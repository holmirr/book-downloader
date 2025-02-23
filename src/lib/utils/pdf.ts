import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { uploadPDFBuffer } from '../google';
import { safeFileName } from './strage';
import { supabase } from './strage';  // supabaseクライアントをインポート

export async function createAndUploadPDF(title: string) {
  try {
    const safeTitle = safeFileName(title);
    const dirPath = `images/${safeTitle}`;
    const pdfDoc = await PDFDocument.create();
    console.log("pdfDoc 作成")
    
    // Supabaseからファイル一覧を取得
    const { data: files, error } = await supabase.storage
      .from('book-downloader')
      .list(dirPath);
    
    if (error) throw error;
    if (files.length === 0) throw new Error('PNGファイルが見つかりません');
    console.log("strageからfiles名取得")
    // PNGファイルをフィルタリングしてソート
    const pngFiles = files
      .filter(file => file.name.endsWith('.png'))
      .map(file => file.name)
      .sort((a, b) => {
        const numA = parseInt(a.split('.')[0].split('_')[0]);
        const numB = parseInt(b.split('.')[0].split('_')[0]);
        return numA - numB;
      });
    if (pngFiles.length === 0) throw new Error('PNGファイルが見つかりません');

    // 署名付きURLを一括で取得
    const signedUrls = await Promise.all(
      pngFiles.map(fileName => 
        supabase.storage
          .from('book-downloader')
          .createSignedUrl(`${dirPath}/${fileName}`, 60) // 60秒の有効期限
      )
    );
    console.log("すべての署名付きURL取得完了")

    // 署名付きURLを使用して並列でダウンロード
    const imageBuffers = await Promise.all(
      signedUrls.map(async ({ data }) => {
        if (!data?.signedUrl) throw new Error('署名付きURL の取得に失敗しました');
        const response = await fetch(data.signedUrl);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      })
    );
    console.log("すべての画像バッファ取得完了")

    for (let i = 0; i < pngFiles.length; i++) {
      const imageBuffer = imageBuffers[i];
      const fileName = pngFiles[i];
      const pages = fileName.split('.')[0].split('_');

      if (pages.length > 1) {
        // 見開きページの場合、画像を半分に分割
        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;

        // 左ページ
        const leftPage = await sharp(imageBuffer)
          .extract({ left: 0, top: 0, width: Math.floor(width / 2), height })
          .jpeg({ quality: 80 })
          .toBuffer();

        // 右ページ
        const rightPage = await sharp(imageBuffer)
          .extract({ left: Math.floor(width / 2), top: 0, width: Math.floor(width / 2), height })
          .jpeg({ quality: 80 })
          .toBuffer();

        // 左ページをPDFに追加
        const leftImage = await pdfDoc.embedJpg(leftPage);
        const leftPdfPage = pdfDoc.addPage([leftImage.width, leftImage.height]);
        leftPdfPage.drawImage(leftImage, {
          x: 0,
          y: 0,
          width: leftImage.width,
          height: leftImage.height,
        });

        // 右ページをPDFに追加
        const rightImage = await pdfDoc.embedJpg(rightPage);
        const rightPdfPage = pdfDoc.addPage([rightImage.width, rightImage.height]);
        rightPdfPage.drawImage(rightImage, {
          x: 0,
          y: 0,
          width: rightImage.width,
          height: rightImage.height,
        });
      } else {
        // 単一ページの場合は従来通りの処理
        const optimizedImageBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 80 })
          .toBuffer();

        const image = await pdfDoc.embedJpg(optimizedImageBuffer);
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
    // PDFバッファを生成して直接アップロード
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    
    // Google Driveにアップロード
    const uploadTitle = title.replace(/\//g, '_');
    console.log("driveにアップロード", uploadTitle)
    const uploadedFile = await uploadPDFBuffer(pdfBuffer, uploadTitle);
    return uploadedFile;
    
  } catch (error) {
    console.log("PDF作成とアップロードのエラー");
    throw error;
  }
}


