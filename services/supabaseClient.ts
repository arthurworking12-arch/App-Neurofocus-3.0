
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Helper para acesso seguro a variáveis de ambiente
const getEnv = (key: string) => {
  // Verifica primeiro o padrão Vite (Vercel)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Silently fail if import.meta is not supported
  }
  
  // Fallback para process.env (Node)
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

// Chaves de Backup (Suas chaves atuais)
const FALLBACK_URL = 'https://bwfxdtfpxoelyiuviwku.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZnhkdGZweG9lbHlpdXZpd2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTcwNjcsImV4cCI6MjA4MDI3MzA2N30.f4TllE1FpzJwq3sBamDqt8cNV_w0_HW0C3jQf51FQhw';

// Prioriza variáveis de ambiente, usa fallback se não encontrar
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || FALLBACK_URL;
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || FALLBACK_ANON;

// Verificação simples para saber se o usuário configurou as chaves corretamente
export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

// Criamos o cliente. 
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
