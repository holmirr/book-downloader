export function isValidToken(expires_at: string) {
  // expires_atはTZを含まない時刻文字列だが、実際はJST時刻を表している。
  // 上記を用いてDateオブジェクトを作ると、UTC時間として扱われる。
  // UTCにおけるJST文字列時間＝JSTにおける(JST文字列時間+9)
  // よって、JSTにおけるJST文字列時間＝UTCにおけるJST文字列時間 - 9h
  const expires_at_date = new Date(new Date(expires_at).getTime() - 9 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expires_at_date.getTime() - now.getTime();
  // 30分は余裕を持つ。
  return diff > 30 * 60 * 1000;
}