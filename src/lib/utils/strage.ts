import { createClient} from '@supabase/supabase-js';
import { getInit } from '../books';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ?? "";
export const supabase = createClient(supabaseUrl, supabaseKey);
const bucketName = "book-downloader";

export function safeFileName(text: string): string {
  const safeText = text.replace(/\//g, '_');
  return Buffer.from(safeText).toString('hex');
}

export function restoreFileName(encoded: string): string {
  return Buffer.from(encoded, 'hex').toString();
}

export async function getRemainingBooks(token: string) {
  const { data, error } = await supabase.storage.from(bucketName).list("images");
  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  const dirs = data.filter(item => !item.metadata).map(item => item.name);
  const remainingBooks = dirs.map(async (dirName) => {
    const {data, error} = await supabase.storage.from(bucketName).download(`images/${dirName}/book_id.txt`);
    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
    const id = await data.text();
    const {total_images, timeleft} = await getInit(id, token); 
    const title = restoreFileName(dirName);
    const endPage = (await getStartPage(title)) - 1;
    return {
      title: title,
      bookId: id,
      total_images: total_images,
      endPage: endPage,
      timeleft: timeleft
    }
  })
  return await Promise.all(remainingBooks);
}

export async function getStartPage(title: string) {
  const safeTitle = safeFileName(title);
  const folderPath = `images/${safeTitle}`;
  const { data, error } = await supabase.storage.from(bucketName).list(folderPath, {limit:1000});
  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  const files = data.filter((item) => item.name.endsWith(".png")).map((item) => item.name);
  if (files.length === 0) {
    return 1;
  }
  const maxPage = Math.max(...files.map((file) => {
    const nameWithoutExt = file.replace('.png', '');
    const numbers = nameWithoutExt.split('_');
    const lastNumber = numbers[numbers.length - 1];
    const result = parseInt(lastNumber, 10);
    if (isNaN(result)) {
      return 1;
    } 
    return result;
  }));
  console.log("maxPage is", maxPage);
  return maxPage + 1;
}

export async function saveBookId(title: string, id: string) {
  const safeTitle = safeFileName(title);
  const filePath = `images/${safeTitle}/book_id.txt`;
  const {data, error} = await supabase.storage.from(bucketName).upload(filePath, id);
  if (error) {
    if ('statusCode' in error && error.statusCode === "409") {
      console.log("File already exists");
      return;
    }
    console.error(error);
    throw new Error(error.message);
  }
  return data;
}

export async function saveImage(image: string, title: string, startPage: number, isDouble: boolean) {
  const safeTitle = safeFileName(title);
  const folderPath = `images/${safeTitle}`;
  const fileName = isDouble ? `${startPage}_${startPage + 1}.png` : `${startPage}.png`;
  const filePath = `${folderPath}/${fileName}`;
  
  const imageBuffer = Buffer.from(image, 'base64');
  const {data, error} = await supabase.storage.from(bucketName).upload(filePath, imageBuffer);
  if (error) {
    if ('statusCode' in error && error.statusCode === "409") {
      console.log("File already exists");
      return;
    }
    console.log("this is error block of saveImage function")
    console.error(error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteImage(title: string) {
  const safeTitle = safeFileName(title);
  const folderPath = `images/${safeTitle}`;
  const files = await getFiles(folderPath);
  
  const {data, error} = await supabase.storage.from(bucketName).remove(files.map((file) => `${folderPath}/${file}`));
  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  return data;
}

export async function getFiles(folderPath: string) {
  const {data, error} = await supabase.storage.from(bucketName).list(folderPath, {limit:1000});
  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  return data.map((item) => item.name);
}
