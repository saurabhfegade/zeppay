import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const results: any[] = [];

    // Check if tables exist
    const { data: tables } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    const existingTables = tables ? tables.map(t => t.table_name) : [];
    results.push(`Existing tables: ${existingTables.join(', ')}`);

    // Create users table if it doesn't exist
    if (!existingTables.includes('users')) {
      results.push('Creating users table...');
      
      await supabaseAdmin.rpc('create_users_table', {});
      
      // Alternative approach using raw SQL (only if RPC fails)
      // Using supabase.rpc is preferred, but this is a fallback
      /*
      const { error: usersError } = await supabaseAdmin.from('users').insert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'test@example.com',
        role: 'sponsor',
        display_name: 'Test User',
        created_at: new Date().toISOString()
      }).select();
      */
      
      results.push('Users table created');
    }

    // Create waas_wallets table if it doesn't exist
    if (!existingTables.includes('waas_wallets')) {
      results.push('Creating waas_wallets table...');
      
      await supabaseAdmin.rpc('create_waas_wallets_table', {});
      
      // Alternative approach (fallback)
      /*
      const { error: waasError } = await supabaseAdmin.from('waas_wallets').insert({
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        coinbase_wallet_id: 'test_wallet',
        wallet_address: '0x0000000000000000000000000000000000000000',
        network_id: 'test-network',
        usdc_balance: 0,
        gas_balance: 0,
        created_at: new Date().toISOString()
      }).select();
      */
      
      results.push('WaaS wallets table created');
    }

    // Create smart_wallets table if it doesn't exist
    if (!existingTables.includes('smart_wallets')) {
      results.push('Creating smart_wallets table...');
      
      await supabaseAdmin.rpc('create_smart_wallets_table', {});
      
      // Alternative approach (fallback)
      /*
      const { error: smartError } = await supabaseAdmin.from('smart_wallets').insert({
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        wallet_address: '0x0000000000000000000000000000000000000000',
        network_id: 'test-network',
        created_at: new Date().toISOString()
      }).select();
      */
      
      results.push('Smart wallets table created');
    }

    // Create beneficiaries table if needed
    if (!existingTables.includes('beneficiaries')) {
      results.push('Creating beneficiaries table...');
      
      await supabaseAdmin.rpc('create_beneficiaries_table', {});
      
      results.push('Beneficiaries table created');
    }

    // Create categories table if needed
    if (!existingTables.includes('categories')) {
      results.push('Creating categories table...');
      
      await supabaseAdmin.rpc('create_categories_table', {});
      
      // Add some default categories
      await supabaseAdmin.from('categories').insert([
        { name: 'Food', description: 'Food and groceries' },
        { name: 'Healthcare', description: 'Medical and healthcare expenses' },
        { name: 'Education', description: 'Educational expenses and supplies' }
      ]);
      
      results.push('Categories table created with default categories');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Database initialization complete',
      results
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 