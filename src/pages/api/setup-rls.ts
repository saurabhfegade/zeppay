import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests with admin token
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple security check - admin token should be passed in request
  const { admin_token } = req.body;
  if (!admin_token || admin_token !== process.env.SETUP_ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Create admin client to bypass RLS and execute SQL
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Execute SQL to configure RLS policies properly
    const results = [];

    // 1. Enable RLS for all tables
    results.push(await supabaseAdmin.rpc('setup_users_rls'));
    
    return res.status(200).json({
      message: 'Row Level Security (RLS) policies have been configured',
      results
    });
  } catch (error) {
    console.error('Error setting up RLS policies:', error);
    return res.status(500).json({
      error: 'Failed to set up RLS policies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 