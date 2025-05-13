import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../backend/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Simple database query to check connectivity
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      throw new Error(`Database connection error: ${categoriesError.message}`);
    }

    // 2. Check if required tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    const tableNames = tables ? tables.map(t => t.tablename) : [];
    
    // 3. Check environment variables (redacted for security)
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      COINBASE_WAAS_API_KEY: !!process.env.COINBASE_WAAS_API_KEY ? 'Set' : 'Missing',
      COINBASE_WAAS_API_SECRET: !!process.env.COINBASE_WAAS_API_SECRET ? 'Set' : 'Missing',
      COINBASE_WAAS_API_URL: !!process.env.COINBASE_WAAS_API_URL ? 'Set' : 'Missing',
    };

    return res.status(200).json({
      success: true,
      database_connection: 'Success',
      categories: categories || [],
      tables_available: tableNames,
      environment_check: envCheck
    });
  } catch (error) {
    console.error('Error in simple wallet test:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 