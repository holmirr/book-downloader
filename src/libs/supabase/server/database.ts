import { supabase } from '.';
import { DBUser } from '@/libs/types';
import { Credentials } from 'google-auth-library';

// usesテーブルに新規ユーザー情報をinsertする関数
// 成功→true, 失敗→errorをthrow
export async function createUser(
  { email, password, name, token_info, download_at = null }:
    {
      email: string;
      password: string;
      name: string;
      token_info: { token: string, expires_at: string };
      download_at?: Date | null;
    }
): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .insert(
      {
        email,
        password,
        name,
        token_info,
        download_at
      })
  if (error) {
    console.error(error);
    throw error;
  }
  // 成功時、dataには何も入らない
  return true;
}

// usersテーブルからユーザー情報を取得する関数
// 成功→ユーザー情報, 失敗→errorをthrow
export async function getUser(email: string): Promise<DBUser> {
  const { data, error } = await supabase
  .from("users")
  .select("*")
  // .eqはWHERE句と同価
  .eq("email", email)
  // .singleでリストではなく、直接rowオブジェクトを返すようになる。
  // もしユーザーが見つからない場合は、errorが返る（error.codeはPGRST116になる。）
  .single<DBUser>();
  if (error) {
    console.error(error);
    throw error;
  }
  return data;
}

// usersテーブルからユーザー情報を更新する関数
// 成功→true, 失敗→errorをthrow
// 更新するフィールドだけを指定したオブジェクトを引き数にとる→型指定はPartial<DBUser>
export async function updateUser(email: string, updated: Partial<DBUser>): Promise<boolean> {
  const { data, error } = await supabase
  .from("users")
  .update(updated)
  .eq("email", email);
  if (error) {
    console.error(error);
    throw error;
  }
  // 成功時、dataには何も入らない
  return true;
}

// permissionsテーブルからユーザーが存在するかを取得する関数
// 存在→true, 存在しない→false, エラー→errorをthrow
export async function getPermissions(name: string): Promise<boolean> {
  const { data, error } = await supabase
  .from("permissions")
  .select("*")
  .eq("name", name)
  .single();
  if (error) {
    // ユーザーが存在しない場合は、error.codeはPGRST116になる。
    if (error.code === "PGRST116") {
      return false;
    }
    // エラーがPGRST116でない場合は、errorをthrow
    console.error(error);
    throw error;
  }
  return true;
}

// permissionsテーブルからmasterフィールドを取得する関数
// master→true, 非master→false, 非存在orエラー→errorをthrow
export async function getIsMaster(name: string): Promise<boolean> {
  const { data, error } = await supabase
  .from("permissions")
  .select("master")
  .eq("name", name)
  .single<{ master: boolean }>();
  if (error) {
    // ユーザーが存在しない場合は、error.codeはPGRST116になるが、今回はまとめてerrorをthrow
    console.error(error);
    throw error;
  }
  return data.master;
}

// google_tokensテーブルからトークン情報を取得する関数
// 存在→トークン情報, 非存在→null, エラー→errorをthrow
export async function getGoogleTokens(): Promise<Credentials | null> {
  const { data, error } = await supabase
  .from("google_tokens")
  .select("tokens")
  .single<{ tokens: Credentials }>();
  if (error){
    // トークンが存在しない場合は、error.codeはPGRST116になる。
    if (error.code === "PGRST116") {
      return null;
    }
    // エラーがPGRST116でない場合は、errorをthrow
    console.error(error);
    throw error;
  }
  return data.tokens;
}

// google_tokensテーブルにトークン情報を保存する関数
// 成功→true, 失敗→errorをthrow
export async function saveGoogleTokens(tokens: Credentials): Promise<boolean> {
  const { data, error } = await supabase
  .from("google_tokens")
  // upsert()の第１引数には保存するデータ(column: valueのオブジェクト)
  // 第２引数にはオプション
  // onConflictにはuniqueなカラムを指定する。
  // 今回はidが1の行が存在する場合は、その行を更新する。
  // 存在しない場合は、新規に作成する。
  .upsert({ id: 1, tokens }, { onConflict: "id" });
  if (error) {
    console.error(error);
    throw error;
  }
  // 成功時、dataには何も入らない
  return true;
}