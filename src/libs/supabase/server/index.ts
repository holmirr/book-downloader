import { createClient } from '@supabase/supabase-js';

// サーバーサイドでsupabaseを使用するためのクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// サーバーサイドではすべてのアクセス権を持つservice_role_keyを使用
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
