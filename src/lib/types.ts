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

