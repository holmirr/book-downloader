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
    
    // Supabaseからファイル一覧を取得
    const { data: files, error } = await supabase.storage
      .from('book-downloader')
      .list(dirPath);
    
    if (error) throw error;

    // PNGファイルをフィルタリングしてソート
    const pngFiles = files
      .filter(file => file.name.endsWith('.png'))
      .map(file => file.name)
      .sort((a, b) => {
        const numA = parseInt(a.split('.')[0].split('_')[0]);
        const numB = parseInt(b.split('.')[0].split('_')[0]);
        return numA - numB;
      });

    for (const fileName of pngFiles) {
      const filePath = `${dirPath}/${fileName}`;
      const fileNameWithoutExt = fileName.split('.')[0];
      const pages = fileNameWithoutExt.split('_');

      // Supabaseから画像をダウンロード
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('book-downloader')
        .download(filePath);

      if (downloadError) throw downloadError;

      // 画像をバッファに変換
      const imageBuffer = Buffer.from(await imageData.arrayBuffer());

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

    // PDFバッファを生成して直接アップロード
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    
    // Google Driveにアップロード
    const uploadTitle = title.replace(/\//g, '_');
    const uploadedFile = await uploadPDFBuffer(pdfBuffer, uploadTitle);
    return uploadedFile;
    
  } catch (error) {
    console.log("PDF作成とアップロードのエラー");
    throw error;
  }
}


