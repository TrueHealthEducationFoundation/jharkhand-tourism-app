import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Check your .env.local file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://trxlnyupdmwaeyzucvvk.supabase.co',
  supabaseAnonKey || 'sb_publishable_7qju5HNmbjLY-WU6jBE0xg_1Hc9DcuJ'
);
