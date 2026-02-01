import { createClient } from '@supabase/supabase-js';

// Substitua pelos seus dados reais do Supabase
const SUPABASE_URL = 'https://vvnigetcelrlugziqqyf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmlnZXRjZWxybHVnemlxcXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODUyNjcsImV4cCI6MjA4NTQ2MTI2N30.zFw1faZ16bN16zzfnT9E_Q-cRzPJHpd_LVoNltkajfs'; // A chave "anon public"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);