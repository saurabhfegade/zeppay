import { NextApiRequest, NextApiResponse } from 'next';
import { WalletService } from '../../backend/services/walletService';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: any[] = [];
  
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

    // 1. Create a test sponsor
    results.push('Creating test sponsor...');
    const sponsorEmail = `sponsor-${uuidv4().substring(0, 8)}@example.com`;
    const { data: sponsorData, error: sponsorError } = await supabaseAdmin.auth.admin.createUser({
      email: sponsorEmail,
      password: 'Password123',
      email_confirm: true,
      user_metadata: {
        role: 'sponsor',
        display_name: 'Test Sponsor',
      }
    });

    if (sponsorError || !sponsorData.user) {
      throw new Error(`Failed to create sponsor: ${sponsorError?.message}`);
    }
    
    const sponsorUserId = sponsorData.user.id;
    results.push(`Sponsor created with ID: ${sponsorUserId}`);

    // Insert the sponsor into the users table
    await supabaseAdmin
      .from('users')
      .insert({
        id: sponsorUserId,
        email: sponsorEmail,
        role: 'sponsor',
        display_name: 'Test Sponsor',
        raw_app_meta_data: sponsorData.user.app_metadata,
      });

    // 2. Create WaaS wallet for sponsor
    results.push('Creating sponsor WaaS wallet...');
    const sponsorWallet = await WalletService.createWaasWalletForSponsor(sponsorUserId);
    results.push(`Sponsor wallet created with ID: ${sponsorWallet.id}`);
    results.push(`Wallet address: ${sponsorWallet.wallet_address}`);
    results.push(`Initial USDC balance: ${sponsorWallet.usdc_balance}`);
    results.push(`Initial gas balance: ${sponsorWallet.gas_balance}`);

    // 3. Create a test vendor
    results.push('Creating test vendor...');
    const vendorEmail = `vendor-${uuidv4().substring(0, 8)}@example.com`;
    const vendorPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const { data: vendorData, error: vendorError } = await supabaseAdmin.auth.admin.createUser({
      email: vendorEmail,
      password: 'Password123',
      email_confirm: true,
      user_metadata: {
        role: 'vendor',
        display_name: 'Test Vendor',
        phone_number: vendorPhone,
      }
    });

    if (vendorError || !vendorData.user) {
      throw new Error(`Failed to create vendor: ${vendorError?.message}`);
    }
    
    const vendorUserId = vendorData.user.id;
    results.push(`Vendor created with ID: ${vendorUserId}`);

    // Insert the vendor into the users table
    await supabaseAdmin
      .from('users')
      .insert({
        id: vendorUserId,
        email: vendorEmail,
        phone_number: vendorPhone,
        role: 'vendor',
        display_name: 'Test Vendor',
        raw_app_meta_data: vendorData.user.app_metadata,
      });

    // 4. Create smart wallet for vendor
    results.push('Creating vendor smart wallet...');
    const vendorWallet = await WalletService.createSmartWalletForVendor(vendorUserId);
    results.push(`Vendor wallet created with address: ${vendorWallet.wallet_address}`);

    // 5. Update sponsor wallet balance (simulating funding)
    results.push('Updating sponsor wallet with test balance...');
    await supabaseAdmin
      .from('waas_wallets')
      .update({
        usdc_balance: 1000,
        gas_balance: 0.1,
      })
      .eq('id', sponsorWallet.id);

    // 6. Refresh the wallet to see the new balance
    results.push('Refreshing wallet to verify balance...');
    const updatedWallet = await WalletService.refreshWaasWalletBalance(sponsorWallet.id);
    results.push(`Updated USDC balance: ${updatedWallet.usdc_balance}`);
    results.push(`Updated gas balance: ${updatedWallet.gas_balance}`);

    // 7. Test wallet retrieval methods
    results.push('Testing wallet retrieval methods...');
    const retrievedSponsorWallet = await WalletService.getSponsorWaasWallet(sponsorUserId);
    results.push(`Retrieved sponsor wallet: ${retrievedSponsorWallet?.id}`);

    const retrievedVendorWallet = await WalletService.getVendorSmartWallet(vendorUserId);
    results.push(`Retrieved vendor wallet: ${retrievedVendorWallet?.wallet_address}`);

    return res.status(200).json({ 
      success: true, 
      results 
    });
  } catch (error) {
    console.error('Error in wallet test:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    });
  }
} 