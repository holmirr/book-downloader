import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

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
      return;
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

    // 画像をJPEGに変換してサイズを最適化
    const optimizedImageBuffer = await sharp(filePath)
      .jpeg({ quality: 80 })
      .toBuffer();

    // JPEGをPDFに埋め込む
    const image = await pdfDoc.embedJpg(optimizedImageBuffer);
    const imagePage = pdfDoc.addPage([image.width, image.height]);
    imagePage.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

    // PDFを保存
    const pdfPath = path.join(dirPath, `${safeTitle}.pdf`);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
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


