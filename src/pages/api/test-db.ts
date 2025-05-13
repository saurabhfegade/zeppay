import { NextApiRequest, NextApiResponse } from 'next';
import { healthCheck, supabase } from '../../backend/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test PostgreSQL connection
    const dbHealthy = await healthCheck();
    
    // Test Supabase connection
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return res.status(500).json({
        postgresConnection: dbHealthy ? 'SUCCESS' : 'FAILED',
        supabaseConnection: 'FAILED',
        error: error.message
      });
    }
    
    return res.status(200).json({
      postgresConnection: dbHealthy ? 'SUCCESS' : 'FAILED',
      supabaseConnection: 'SUCCESS',
      categoriesCount: count || 0
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Connection test failed',
      details: error?.message || 'Unknown error'
    });
  }
} 