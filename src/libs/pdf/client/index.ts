import { PDFDocument } from 'pdf-lib';
import pLimit from 'p-limit';
import { supabase } from "../../supabase/client";


export async function createPDF(folderName: string): Promise<Uint8Array> {
  // 非同期処理の数を制限する。
  // usage: 非同期処理をlimitでラップし、limitを実行する。
  const limit = pLimit(10);
  try {
    // pdfを扱うためにPDFDocumentを作成
    const pdfDoc = await PDFDocument.create();
    // フォルダ名を指定してファイル一覧を取得
    const { data: files, error: listError } = await supabase.storage.from("book-downloader").list(`images/${folderName}`, { limit: 1000 });
    // エラーがnullでなければ、errorをthrowする。
    if (listError) throw listError;
    // ファイル名のみを取得し、PNGファイルのみをフィルタリングしてソート（.pngのみを指定しているのでフォルダかファイルかの判断は不要）
    const pngFiles = files.map(file => file.name).filter(file => file.endsWith(".png"))
      // 2_3.pngのようなファイル名であるため、ファイル名から大きい方の数字を抜き出し、その数字で昇順にsortする。
      .sort((a, b) => {
        const numA = parseInt(a.split(".")[0].split("_")[0]);
        const numB = parseInt(b.split(".")[0].split("_")[0]);
        return numA - numB;
      });
    if (pngFiles.length === 0) throw new Error("PNGファイルが見つかりません");

    // 取得した.pngファイル名に対応するダウンロードのための署名付きurlリストを取得する。
    const { data: urlObjs, error: urlError } = await supabase.storage.from("book-downloader").createSignedUrls(pngFiles.map(file => `images/${folderName}/${file}`), 300);
    // エラーがnullでなければ、errorをthrowする。
    if (urlError) throw urlError;
    // 署名付きurlリストを取得する。
    const signedUrls = urlObjs.map(urlObj => urlObj.signedUrl);
    // 署名付きurlリストを用いて、画像データをarrayBuffer形式のリストで取得する。
    const imageBuffers = await Promise.all(
      signedUrls.map(async (signedUrl) => {
        const response = await limit(() => fetch(signedUrl));
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
      })
    );

    // 画像をpdfに追加する。（順番が大事なのでfor文で回す）
    for (let i = 0; i < pngFiles.length; i++) {
      const fileName = pngFiles[i];
      // ファイル名からページ数を取得する。
      const pages = fileName.split('.')[0].split('_');
      // ページ数が2つ以上ある場合は、見開きページである。
      if (pages.length > 1) {
        // 見開きページの場合、画像を半分に分割したい。
        // まず、画像をImageオブジェクトに変換する。
        const img = new Image();
        // 画像をhtmlElementとしてロードする。(canvasに描画するために必要) (canvasはhtmnlの要素であり、画像の編集やフォーマットの編集に必要である。)
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = URL.createObjectURL(new Blob([imageBuffers[i]]));
        });

        // 描写用のcanvasを作成する。
        const canvas = document.createElement('canvas');
        // canvasに画像を描画するためのcontextを取得する。
        const ctx = canvas.getContext('2d');

        // 左ページのcanvasの幅と高さを設定する。
        // 左ページの幅は画像の幅の半分である。
        canvas.width = Math.floor(img.width / 2);
        // 左ページの高さは画像の高さである。
        canvas.height = img.height;
        // 左ページのcanvasに画像を描画する。
        // img→描写するimg, 0, 0→imgの切り取り開始座標, Math.floor(img.width / 2)→imgの切り取る幅, img.height→imgの切り取る高さ, 0, 0→canvasの描写開始座標, canvas.width→canvasの幅, canvas.height→canvasの高さ
        ctx?.drawImage(img, 0, 0, Math.floor(img.width / 2), img.height, 0, 0, canvas.width, canvas.height);

        // canvasをblobに変換する。
        // canvas.toBlobではcallbackで結果のblobを受け取るため、これをpromiseで返し、awaitで待って受け取る。
        // pngからjpegに変換し、0.8の品質で保存する。
        const leftPageBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
        });
        // blobをarrayBufferに変換する。
        const leftPageArrayBuffer = await leftPageBlob.arrayBuffer();

        // pdfDocに画像を埋め込む。
        const leftImage = await pdfDoc.embedJpg(leftPageArrayBuffer);
        // pdfDocに画像と同じサイズのページを追加する。
        const leftPdfPage = pdfDoc.addPage([leftImage.width, leftImage.height]);
        // 上で追加したページに画像を描画する。
        leftPdfPage.drawImage(leftImage, {
          x: 0,
          y: 0,
          width: leftImage.width,
          height: leftImage.height,
        });

        // 右ページのために、canvasのcontextをクリアする。
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        // 右ページのcanvasに画像を描画する。
        // img→描写するimg, Math.floor(img.width / 2), 0→imgの切り取り開始座標, Math.floor(img.width / 2)→imgの切り取る幅, img.height→imgの切り取る高さ, 0, 0→canvasの描写開始座標, canvas.width→canvasの幅, canvas.height→canvasの高さ
        ctx?.drawImage(img, Math.floor(img.width / 2), 0, Math.floor(img.width / 2), img.height, 0, 0, canvas.width, canvas.height);

        // canvasをblobに変換する。
        const rightPageBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
        });
        // blobをarrayBufferに変換する。
        const rightPageArrayBuffer = await rightPageBlob.arrayBuffer();
        // pdfDocに画像を埋め込む。
        const rightImage = await pdfDoc.embedJpg(rightPageArrayBuffer);
        // pdfDocに画像と同じサイズのページを追加する。
        const rightPdfPage = pdfDoc.addPage([rightImage.width, rightImage.height]);
        // 上で追加したページに画像を描画する。
        rightPdfPage.drawImage(rightImage, {
          x: 0,
          y: 0,
          width: rightImage.width,
          height: rightImage.height,
        });
      } else {
        // 単一ページの場合はJPEG(0.8の品質)に変換してから追加
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = URL.createObjectURL(new Blob([imageBuffers[i]]));
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const jpegBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
        });
        const jpegArrayBuffer = await jpegBlob.arrayBuffer();
        const image = await pdfDoc.embedJpg(jpegArrayBuffer);
        const imagePage = pdfDoc.addPage([image.width, image.height]);
        imagePage.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
    }
    console.log("画像追加完了")
    // PDFバッファを生成してreturn
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error("PDF作成エラー:", error);
    throw error;
  }
}