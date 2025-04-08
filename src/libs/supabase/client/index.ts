import { createClient } from '@supabase/supabase-js';

// クライアントサイドでsupabaseを使用するためのクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// クライアントサイドではanonymousなユーザーで使用するため、anonKeyを使用
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

