import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../backend/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  const envCheck = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    databaseUrl: Boolean(process.env.DATABASE_URL),
  };

  // Check if Supabase client is initialized correctly
  const supabaseInitialized = Boolean(supabase);

  // Test a simple query to Supabase
  let supabaseQueryResult: { success: boolean, error: string | null } = { success: false, error: null };
  try {
    const { data, error } = await supabase.from('categories').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      supabaseQueryResult.error = error.message;
    } else {
      supabaseQueryResult.success = true;
    }
  } catch (error) {
    supabaseQueryResult.error = error instanceof Error ? error.message : String(error);
  }

  // Return the results
  return res.status(200).json({
    environment: envCheck,
    supabaseClient: supabaseInitialized,
    supabaseQuery: supabaseQueryResult,
    supabaseConfig: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...',
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    }
  });
} 