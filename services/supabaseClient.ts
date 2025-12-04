import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Chaves configuradas pelo usuário
const SUPABASE_URL: string = 'https://bwfxdtfpxoelyiuviwku.supabase.co'; 
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZnhkdGZweG9lbHlpdXZpd2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTcwNjcsImV4cCI6MjA4MDI3MzA2N30.f4TllE1FpzJwq3sBamDqt8cNV_w0_HW0C3jQf51FQhw';

// Verificação simples para saber se o usuário configurou as chaves
// Verifica se os valores são diferentes dos placeholders padrão
export const isSupabaseConfigured = 
  SUPABASE_URL !== 'https://seu-projeto.supabase.co' && 
  SUPABASE_ANON_KEY !== 'sua-chave-anonima-aqui';

// Criamos o cliente. 
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);