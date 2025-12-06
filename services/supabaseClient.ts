
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Helper para acesso seguro a variáveis de ambiente
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.warn('Environment variables not accessible via import.meta');
  }
  return undefined;
};

// Tenta pegar das variáveis de ambiente de forma segura
// Se não encontrar, usa o valor hardcoded como backup
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || 'https://bwfxdtfpxoelyiuviwku.supabase.co'; 
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZnhkdGZweG9lbHlpdXZpd2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTcwNjcsImV4cCI6MjA4MDI3MzA2N30.f4TllE1FpzJwq3sBamDqt8cNV_w0_HW0C3jQf51FQhw';

// Verificação simples para saber se o usuário configurou as chaves corretamente
export const isSupabaseConfigured = 
  SUPABASE_URL && 
  SUPABASE_URL !== 'https://seu-projeto.supabase.co' && 
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== 'sua-chave-anonima-aqui';

// Criamos o cliente. 
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
