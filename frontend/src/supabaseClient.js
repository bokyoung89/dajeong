import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트의 실제 URL과 anon key로 교체해주세요.
// 이 정보는 Supabase 프로젝트 설정에서 찾을 수 있습니다.
export const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vcnmedzrrqkeufrljlzt.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbm1lZHpycnFrZXVmcmxqbHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODA5MTksImV4cCI6MjA3MTM1NjkxOX0.WXazyNN2XyEp7MMhJhoZxvKX96vy8x7VkkROboPyPXY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
