import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../common/types/db'; // Changed to relative path

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Using createBrowserClient for client-side Supabase instance
// This version is suitable for Next.js Pages Router when using @supabase/ssr
// For a simpler client-side only setup without SSR concerns for auth state initially, 
// createClient from '@supabase/supabase-js' can also be used.
export const supabase = createBrowserClient<Database>(
  supabaseUrl!,
  supabaseAnonKey!
);

// Example of a simple client if not using @supabase/ssr immediately for auth tokens:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!); 