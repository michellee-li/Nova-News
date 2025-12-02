import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Must use EXPO_PUBLIC_ prefix so EAS exposes these in production
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Client disabled.'
  );
}

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null;



// Original code
// import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { Platform } from 'react-native';
// import 'react-native-url-polyfill/auto';

// function required(name: string, value?: string) {
//   if (!value || !String(value).trim()) {
//     throw new Error(`${name} is required. Check your .env and babel config.`);
//   }
//   return value;
// }

// // Optional: quick debug without printing secrets
// console.log('[SUPABASE] URL len:', (SUPABASE_URL || '').length, ' KEY len:', (SUPABASE_ANON_KEY || '').length);

// const storage = Platform.OS === 'web' ? undefined : AsyncStorage;
// const url = required('SUPABASE_URL', SUPABASE_URL);
// const key = required('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);

// declare global {
//   // eslint-disable-next-line no-var
//   var __supabase__: SupabaseClient | undefined;
// }

// if (!global.__supabase__) {
//   console.log('[SUPABASE] init client');
//   global.__supabase__ = createClient(url, key, {
//     auth: {
//       storage,
//       autoRefreshToken: true,
//       persistSession: true,
//       detectSessionInUrl: false, // RN
//     },
//   });
// }
// export const supabase = global.__supabase__!;
