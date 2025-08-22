import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트의 실제 URL과 anon key로 교체해주세요.
// 이 정보는 Supabase 프로젝트 설정에서 찾을 수 있습니다.
export const supabaseUrl =  import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
