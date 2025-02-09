import postgres from "postgres";
import { DBUser, DBJsonUser, TokenInfo } from "@/lib/types";
const sql = postgres(process.env.POSTGRES_URL!, {ssl: "require"});


export async function createTable() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      token_info JSONB NOT NULL,
      download_at TIMESTAMP
    )`;
    await sql`CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )`;
    console.log("created table");
  } catch (e) {
    console.log("テーブル作成エラー");
    throw e;
  }
}

export async function createUser(email: string, password: string, name: string, token_info: {token:string, expires_at:string}, download_at: Date | null) {
  try {
    await sql`INSERT INTO users (email, password, name, token_info, download_at) VALUES (${email}, ${password}, ${name}, ${JSON.stringify(token_info)}, ${download_at})`;
  } catch (e) {
    console.log("ユーザー作成エラー");
    throw e;
  }
}

export async function getUser(email: string): Promise<DBUser | null> {
  try {
    const users = await sql<DBJsonUser[]>`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return null;
    }
    else {
      const user = users[0];
      return {
        ...user,
        token_info: JSON.parse(user.token_info) as TokenInfo
      };
    }

  } catch (e) {
    console.log("ユーザー取得エラー");
    throw e;
  }
}

export async function updateUser(email: string, updated: Partial<DBUser>) {
  try {
    const updatedWithStringified = {
      ...updated,
      token_info: updated.token_info ? JSON.stringify(updated.token_info) : undefined
    };
    await sql`
      UPDATE users 
      SET ${sql(updatedWithStringified)}
      WHERE email = ${email}
    `;
  } catch (e) {
    console.log("ユーザー更新エラー");
    throw e;
  }
}

export async function getPermissions(name: string) {
  try {
    const permissions = await sql`SELECT * FROM permissions WHERE name = ${name}`;
    if (permissions.length === 0) {
      return false;
    }
    else {
      return true;
    }
  } catch (e) {
    console.log("権限取得エラー");
    throw e;
  }
}
