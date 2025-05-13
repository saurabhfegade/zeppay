import { NextApiRequest, NextApiResponse } from 'next';
import { WalletService } from '../../backend/services/walletService';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a test user ID that we'll use for wallet creation
    const testUserId = uuidv4();
    console.log(`Testing wallet creation with test user ID: ${testUserId}`);

    // Check if env variables are properly set
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      COINBASE_WAAS_API_KEY: !!process.env.COINBASE_WAAS_API_KEY ? 'Set' : 'Missing',
      COINBASE_WAAS_API_SECRET: !!process.env.COINBASE_WAAS_API_SECRET ? 'Set' : 'Missing',
      COINBASE_WAAS_API_URL: !!process.env.COINBASE_WAAS_API_URL ? 'Set' : 'Missing',
    };

    // Try to connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    const tableNames = tables ? tables.map(t => t.tablename) : [];
    
    // Try to create a WaaS wallet directly using the WalletService
    console.log('Creating test WaaS wallet...');
    let walletResponse;
    let error = null;
    
    try {
      const wallet = await WalletService.createWaasWalletForSponsor(testUserId);
      walletResponse = {
        id: wallet.id,
        wallet_address: wallet.wallet_address,
        coinbase_wallet_id: wallet.coinbase_wallet_id,
        network_id: wallet.network_id
      };
    } catch (err) {
      error = err;
      console.error('Error creating wallet:', err);
    }

    // Return all the diagnostic information
    return res.status(200).json({
      success: !error,
      environment_checks: envCheck,
      tables_available: tableNames,
      wallet_created: !!walletResponse,
      wallet_details: walletResponse || null,
      error: error ? (error instanceof Error ? error.message : String(error)) : null
    });
  } catch (error) {
    console.error('Error in test wallet endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 