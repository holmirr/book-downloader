import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export function getStartPage(title: string) {
  const safeTitle = title.replace(/\//g, '_');
  const dirPath = path.join(process.cwd(), 'public', 'images', safeTitle);
  if (!fs.existsSync(dirPath) || title === "") {
    return 1;
  }
  const files = fs.readdirSync(dirPath);

  const maxPage = Math.max(...files.filter(file => file.endsWith('.png')).map(filename => {
    // ファイル名から拡張子を除去
    const nameWithoutExt = filename.replace('.png', '');
    // ハイフンで分割して最後の数字を取得
    // 例: "2-3" → ["2", "3"] → "3"
    //     "8" → ["8"] → "8"
    const numbers = nameWithoutExt.split('_');
    const lastNumber = numbers[numbers.length - 1];
    const result = parseInt(lastNumber, 10);
    if (isNaN(result)) {
      return 1;
    }
    return result;
  }));
  return maxPage + 1;
}

export function saveBookId(title: string, id: string) {
  const safeTitle = title.replace(/\//g, '_');
  const dirPath = path.join(process.cwd(), 'public', 'images', safeTitle);
  
  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filePath = path.join(dirPath, 'book_id.txt');
  fs.writeFileSync(filePath, id);
}

export async function saveImage(image: string, title: string, startPage: number, isDouble: boolean) {
  // タイトルから不正なパス文字を置換
  const safeTitle = title.replace(/\//g, '_');
  const dirPath = path.join(process.cwd(), 'public', 'images', safeTitle);

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // ファイル名の決定
  const fileName = isDouble
    ? `${startPage}_${startPage + 1}.png`
    : `${startPage}.png`;
  const filePath = path.join(dirPath, fileName);

  // Base64をデコードして画像として保存
  const imageBuffer = Buffer.from(image, 'base64');
  fs.writeFileSync(filePath, imageBuffer);
}

export async function createPDF(title: string) {
  try {
    const safeTitle = title.replace(/\//g, '_');

    const dirPath = path.join(process.cwd(), 'public', 'pdfs');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const imageDirPath = path.join(process.cwd(), 'public', 'images', safeTitle);

    if (fs.readdirSync(dirPath).find(fileName => fileName === `${safeTitle}.pdf`)) {
      console.log(`${safeTitle}.pdf は既に存在します`);
      return path.join(dirPath, `${safeTitle}.pdf`);
    }

    const pdfDoc = await PDFDocument.create();


    // フォルダ内のPNGファイルを取得してソート
    const files = fs.readdirSync(imageDirPath)
      .filter(file => file.endsWith('.png'))

      .sort((a, b) => {
        const numA = parseInt(a.split('.')[0].split('_')[0]);
        const numB = parseInt(b.split('.')[0].split('_')[0]);
        return numA - numB;
      });

    for (const fileName of files) {
      const filePath = path.join(imageDirPath, fileName);
      const fileNameWithoutExt = fileName.split('.')[0];
      const pages = fileNameWithoutExt.split('_');

      // 画像を読み込む
      const imageBuffer = await sharp(filePath).toBuffer();

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
        const optimizedImageBuffer = await sharp(filePath)
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

    // PDFを保存
    const pdfPath = path.join(dirPath, `${safeTitle}.pdf`);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
    return pdfPath;
  } catch (error) {
    console.log("PDF作成エラー");
    throw error;
  }
}

export async function deleteImage(title: string) {
  const safeTitle = title.replace(/\//g, '_');
  const dirPath = path.join(process.cwd(), 'public', 'images', safeTitle);
  fs.rmSync(dirPath, { recursive: true, force: true });
}

export async function deletePDF(title: string) {
  const safeTitle = title.replace(/\//g, '_');
  const filePath = path.join(process.cwd(), 'public', 'pdfs', `${safeTitle}.pdf`);
  fs.rmSync(filePath, { recursive: true, force: true });
}


