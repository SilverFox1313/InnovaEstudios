import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ojxusrctvsqkmacnmlwa.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RYaF9w_iecJr7IzxdG4dCA_y6nth1ck';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Falta definir las credenciales de Supabase en las variables de entorno. Usando valores predeterminados.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
