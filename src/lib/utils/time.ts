export function isValidToken(expires_at: string) {
  const expires_at_date = new Date(new Date(expires_at).getTime() + 1000 * 60 * 60 * 9);
  const now = new Date();
  const diff = expires_at_date.getTime() - now.getTime();
  return diff > 30 * 60 * 1000;
}
