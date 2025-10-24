import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import { createClient } from '@supabase/supabase-js';

function required(name: string, value?: string) {
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required. Check your .env and babel config.`);
  }
  return value;
}

// Optional: quick debug without printing secrets
console.log('[SUPABASE] URL len:', (SUPABASE_URL || '').length, ' KEY len:', (SUPABASE_ANON_KEY || '').length);

const url = required('SUPABASE_URL', SUPABASE_URL);
const key = required('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

export const supabase = createClient(url, key);
