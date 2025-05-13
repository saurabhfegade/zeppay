import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../backend/lib/db';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'not-set';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'not-set';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'not-set';
    
    // Create a test client to verify credentials work
    let testClient;
    let testClientError: string | null = null;
    try {
      testClient = createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    } catch (error) {
      testClientError = error instanceof Error ? error.message : String(error);
    }
    
    // Test a simple query
    let queryResult: { success: boolean, error: string | null } = { success: false, error: null };
    if (testClient) {
      try {
        const { data, error } = await testClient.from('categories').select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          queryResult.error = error.message;
        } else {
          queryResult.success = true;
        }
      } catch (error) {
        queryResult.error = error instanceof Error ? error.message : String(error);
      }
    }

    // Redact parts of sensitive values for security
    const redactedUrl = supabaseUrl === 'not-set' ? 'not-set' : 
      `${supabaseUrl.substring(0, 10)}...${supabaseUrl.substring(supabaseUrl.length - 5)}`;
    
    const redactedAnonKey = supabaseAnonKey === 'not-set' ? 'not-set' : 
      `${supabaseAnonKey.substring(0, 5)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)} (length: ${supabaseAnonKey.length})`;
    
    const redactedServiceKey = supabaseServiceRoleKey === 'not-set' ? 'not-set' : 
      `${supabaseServiceRoleKey.substring(0, 5)}...${supabaseServiceRoleKey.substring(supabaseServiceRoleKey.length - 5)} (length: ${supabaseServiceRoleKey.length})`;

    // Test a simple Supabase auth function
    let authTest: { success: boolean, error: string | null } = { success: false, error: null };
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        authTest.error = error.message;
      } else {
        authTest.success = true;
      }
    } catch (error) {
      authTest.error = error instanceof Error ? error.message : String(error);
    }
    
    return res.status(200).json({
      environment: {
        supabaseUrl: redactedUrl,
        supabaseAnonKey: redactedAnonKey,
        supabaseServiceRoleKey: redactedServiceKey,
        nodeEnv: process.env.NODE_ENV || 'not-set'
      },
      clientTest: {
        created: Boolean(testClient),
        error: testClientError,
        queryTest: queryResult
      },
      authTest,
      packageVersions: {
        supabaseJs: require('@supabase/supabase-js/package.json').version
      }
    });
  } catch (error) {
    console.error('Error in debug Supabase API route:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 