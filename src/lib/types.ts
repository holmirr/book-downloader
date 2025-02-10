export interface UserAccount {
  auth0Id: string;
  birthdate: string;
  contactMail: string;
  email: string;
  familyKanaName: string;
  familyName: string;
  firstKanaName: string;
  firstName: string;
  isPrime: boolean;
  mailReader: boolean;
  occupation: string;
  organization: string;
  specialities: string[];
  systemCode: string;
  tel: string;
}

export interface TokenResponse {
  status: string;
  token: Tokens;
  userAccount: UserAccount;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  idToken: string;
}

export interface TokenInfo {
  token: string;
  expires_at: string;
}

export interface InitInfo {
  maxtime: number;
  page_direction: string;
  timeleft: number;
  total_images: number;
}
// データベースの行の型定義
export interface DBUser {
  id: number;
  email: string;
  password: string;
  name: string;
  token_info: TokenInfo;
  download_at: Date | null;
}

export interface DBJsonUser {
  id: number;
  email: string;
  password: string;
  name: string;
  token_info: string;
  download_at: Date | null;
}

export interface DBBook {
  index: number;
  title: string;
  id: string;
  page: number;
  complete: boolean;
}

