// クライアントサイドで動作する関数

export async function uploadPDFonClient(
  { fileName, pdfBytes, token }:
  { fileName: string, pdfBytes: Uint8Array, token: string }
) {
  try{
  // multipart/relatedにはboundaryが必要
  const boundary = "WebKitFormBoundary7MA4YWxkTrZu0gW";
  // bodyに含めるmetadata
  const metadata = JSON.stringify({
    name: fileName,
    mimeType: "application/pdf",
    parents: [process.env.NEXT_PUBLIC_GOOGLE_PARENT_FOLDER_ID ?? "1--EypUv_UYlm4NcDbWoDykdCIDIMBIo5"],
  });

  // bodyをバイト列として作成するためのTextEncoderを作成
  // TextEncoderは、文字列(String)をUTF-8のバイト列に変換し、Uint8Arrayとして扱えるようにする。
  // ちなみに文字列をUTF-8のバイト列に変換し、バイト列として扱うようにするという点はBuffer.from(string)と同じ。
  const encoder = new TextEncoder();

  // metadataをbody用に成形する。
  // content-typeの次には\r\nが2つ必要。
  const metadataBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    "Content-Type: application/pdf",
    "",
    ""
  ].join("\r\n");

  // pdfバイナリデータが終わった後のbodyを成形する。
  const endBoundary = [
    "",
    `--${boundary}--`,
    ""
  ].join("\r\n");
  // metadataをバイト列に変換
  const metadataArray = encoder.encode(metadataBody);
  // pdfバイナリデータが終わった後のbodyをバイト列に変換
  const endBoundaryArray = encoder.encode(endBoundary);
  // metadataとpdfバイナリデータとendBoundaryを結合してbodyを作成
  const body = new Uint8Array([...metadataArray, ...pdfBytes, ...endBoundaryArray]);

  // 作成したbodyを用いて、multipart/relatedでPDFをアップロード
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body
    });
  if (res.ok) {
    return true;
  } else {
    console.log(await res.text());
    console.log(res.status);
    throw new Error("Failed to upload PDF");
  }
  } catch (error) {
    console.error(error);
    throw error;
  }
}