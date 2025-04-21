import { supabase } from '.';
import { getInit } from '../../books';
import { RemainBook } from '@/libs/types';

const bucketName = "book-downloader";

export function safeFileName(text: string): string {
  
  // ファイル名には/が使用できないため、_に変換する。
  const safeText = text.replace(/\//g, '_');
  // ファイル名のstring(javascriptではutf16で格納）をutf8のバイナリに変換
  // そのバイナリを16進数の文字列に変換する。
  return Buffer.from(safeText).toString('hex');
}

// 16進数で表現された文字列からバイナリに変換して、stringに変換する。
export function restoreFileName(encoded: string): string {
  return Buffer.from(encoded, 'hex').toString();
}

// imagesフォルダ内のフォルダ名一覧を取得
// フォルダ名からbook_id.txtをダウンロードしidを取得
// m3 apiからinit情報（total_images, timeleft）を取得し、それらの情報のリストを返す
// エラーハンドリングされていないので、エラーが出た場合はerrorをthrowする。
export async function getRemainingBooks(token: string): Promise<RemainBook[]> {
  // dataはfileオブジェクトのリスト
  const { data, error } = await supabase.storage.from(bucketName).list("images");
  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  // .metadataがundefinedの場合、そのファイルはフォルダーである。
  // フォルダー名のリストを取得
  const dirs = data.filter(item => !item.metadata).map(item => item.name);
  // フォルダ名からbook_id.txtをダウンロードしidを取得
  // idからm3 apiを使用しinit情報（total_images, timeleft）を取得、supabaseのstorageからstartPageも取得
  // それらの情報を返すPromiseのリストを.map()で作成
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
  // それらのPromiseを並列で実行し、その結果をリストにして返す。
  return await Promise.all(remainingBooks);
}

// titleからstartPageを取得する関数
export async function getStartPage(title: string) {
  // titleをhexに変換
  const safeTitle = safeFileName(title);
  // フォルダパスを作成
  const folderPath = `images/${safeTitle}`;
  // フォルダ内のファイル一覧を取得
  // フォルダが存在しなくてもdataは空のリストになる。
  const { data, error } = await supabase.storage.from(bucketName).list(folderPath, {limit:1000});
  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  // ファイル名が.pngで終わるファイル名(2_3.pngなど）のリストを取得
  const files = data.filter((item) => item.name.endsWith(".png")).map((item) => item.name);
  // ファイルがない場合(フォルダがない場合も含む）→まだ１ページもダウンロードされていない→startPageは1
  if (files.length === 0) {
    return 1;
  }
  // ファイル名リストから最大のページ番号を取得
  // files.lentgh=0の場合のハンドリングは行っているので、確実にmaxPageは0以上の数値になる。
  // ちなみにMath.max()の引数が空の場合は-Infinityになる。
  const maxPage = Math.max(...files.map((file) => {
    // ファイル名から.pngを除いた文字列を取得
    const nameWithoutExt = file.replace('.png', '');
    // そこから_で分割した文字のリストを取得(e.g. 2_3.png→['2', '3'])
    const numbers = nameWithoutExt.split('_');
    // 大きいほうのページ番号を取得し、10進数でnumberに変換
    const lastNumber = numbers[numbers.length - 1];
    const result = parseInt(lastNumber, 10);
    // ページ番号が数字でない場合は0を返す
    if (isNaN(result)) {
      return 0;
    } 
    return result;
  }));
  // startPageはmaxPage+1
  return maxPage + 1;
}

// supabaseのstorageのtitleフォルダーにidを保存する関数
export async function saveBookId(title: string, id: string) {
  // titleをhexに変換→これがフォルダ名
  const safeTitle = safeFileName(title);
  // id.txtを保存するファイルパスを作成
  const filePath = `images/${safeTitle}/book_id.txt`;
  // ファイルをアップロード
  const {data, error} = await supabase.storage.from(bucketName).upload(filePath, id);
  if (error) {
    // book_id.txtファイルが既に存在する場合は409エラーが返されるので、その場合は何もせずreturn
    if ('statusCode' in error && error.statusCode === "409") {
      console.log("File already exists");
      return;
    }
    // それ以外のエラーが出た場合はエラーをthrow
    console.error(error);
    throw new Error(error.message);
  }
  // アップロードしたファイルのメタデータを返しているが、実際使用されていない
  return data;
}

// 画像を保存する関数
export async function saveImage(image: string, title: string, startPage: number, isDouble: boolean) {
  // titleをhexに変換→これがフォルダ名
  const safeTitle = safeFileName(title);
  // フォルダパスを作成
  const folderPath = `images/${safeTitle}`;
  // 画像ファイル名を作成
  // もし見開きならstartPage_startPage+1.png、単ページならstartPage.png
  const fileName = isDouble ? `${startPage}_${startPage + 1}.png` : `${startPage}.png`;
  const filePath = `${folderPath}/${fileName}`;
  
  // 画像ファイルをbase64からバイナリに変換
  const imageBuffer = Buffer.from(image, 'base64');
  // ファイルをアップロード 
  const {data, error} = await supabase.storage.from(bucketName).upload(filePath, imageBuffer);
  if (error) {
    // ファイルが既に存在する場合は409エラーが返されるので、その場合は何もせずreturn
    if ('statusCode' in error && error.statusCode === "409") {
      console.log("File already exists");
      return;
    }
    // それ以外のエラーが出た場合はエラーをthrow
    console.log("this is error block of saveImage function")
    console.error(error);
    throw new Error(error.message);
  }
  // アップロードしたファイルのメタデータを返しているが、実際使用されていない
  return data;
}

// title名のフォルダーに入っているファイルをすべて削除する関数
export async function deleteImage(title: string) {
  // titleをhexに変換→これがフォルダ名
  const safeTitle = safeFileName(title);
  // フォルダパスを作成
  const folderPath = `images/${safeTitle}`;
  // フォルダ内のファイル一覧を取得
  const files = await getFiles(folderPath);

  // ファイルパス名のリストを作成し、それらをremove()に渡す。
  // （仮にリストに含まれるパスがフォルダだとしたら、それはデフォルトで無視される。）
  const {data, error} = await supabase.storage.from(bucketName).remove(files.map((file) => `${folderPath}/${file}`));
  if (error) {
    // エラーが出た場合はエラーをthrow
    console.error(error);
    throw new Error(error.message);
  }
  // 削除したファイルのメタデータを返しているが、実際使用されていない
  return data;
}

// フォルダ内のファイル名一覧を取得する関数
export async function getFiles(folderPath: string) {
  // フォルダ内のファイル情報のリストを取得
  const {data, error} = await supabase.storage.from(bucketName).list(folderPath, {limit:1000});
  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  // ファイル名のリストにして返す
  return data.map((item) => item.name);
}
