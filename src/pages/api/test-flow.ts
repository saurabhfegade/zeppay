import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { WalletService } from '../../backend/services/walletService';
import { SponsorshipService } from '../../backend/services/sponsorshipService';
import { TransactionService } from '../../backend/services/transactionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: any[] = [];
  let sponsorUserId: string | null = null;
  let vendorUserId: string | null = null;
  let beneficiaryId: string | null = null;
  let sponsorshipId: string | null = null;
  let pendingTransactionId: string | null = null;
  let otp: string | null = null;

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

    // 1. Create test sponsor
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
    
    sponsorUserId = sponsorData.user.id;
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

    // 3. Create test vendor
    results.push('Creating test vendor...');
    const vendorEmail = `vendor-${uuidv4().substring(0, 8)}@example.com`;
    const vendorPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const { data: vendorData, error: vendorError } = await supabaseAdmin.auth.admin.createUser({
      email: vendorEmail,
      password: 'Password123',
      email_confirm: true,
      user_metadata: {
        role: 'vendor',
        display_name: 'Test Grocery Store',
        phone_number: vendorPhone,
      }
    });

    if (vendorError || !vendorData.user) {
      throw new Error(`Failed to create vendor: ${vendorError?.message}`);
    }
    
    vendorUserId = vendorData.user.id;
    results.push(`Vendor created with ID: ${vendorUserId}`);

    // Insert the vendor into the users table
    await supabaseAdmin
      .from('users')
      .insert({
        id: vendorUserId,
        email: vendorEmail,
        phone_number: vendorPhone,
        role: 'vendor',
        display_name: 'Test Grocery Store',
        raw_app_meta_data: vendorData.user.app_metadata,
      });

    // 4. Create smart wallet for vendor
    results.push('Creating vendor smart wallet...');
    const vendorWallet = await WalletService.createSmartWalletForVendor(vendorUserId);
    results.push(`Vendor wallet created with address: ${vendorWallet.wallet_address}`);

    // 5. Approve vendor for food category
    results.push('Approving vendor for food category...');
    // Get food category ID (assuming it exists from seed-categories)
    const { data: foodCategory } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', 'Food')
      .single();
    
    if (!foodCategory) {
      // Create food category if it doesn't exist
      const { data: newCategory } = await supabaseAdmin
        .from('categories')
        .insert({ name: 'Food', description: 'Food and groceries' })
        .select()
        .single();
        
      if (newCategory) {
        await supabaseAdmin
          .from('vendor_categories')
          .insert({
            vendor_id: vendorUserId,
            category_id: newCategory.id,
          });
        results.push(`Vendor approved for Food category (ID: ${newCategory.id})`);
      }
    } else {
      await supabaseAdmin
        .from('vendor_categories')
        .insert({
          vendor_id: vendorUserId,
          category_id: foodCategory.id,
        });
      results.push(`Vendor approved for Food category (ID: ${foodCategory.id})`);
    }

    // 6. Create a beneficiary
    results.push('Creating test beneficiary...');
    const beneficiaryPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const { data: beneficiary, error: beneficiaryError } = await supabaseAdmin
      .from('beneficiaries')
      .insert({
        phone_number_for_telegram: beneficiaryPhone,
        display_name: 'Test Beneficiary',
      })
      .select()
      .single();

    if (beneficiaryError || !beneficiary) {
      throw new Error(`Failed to create beneficiary: ${beneficiaryError?.message}`);
    }
    
    beneficiaryId = beneficiary.id;
    results.push(`Beneficiary created with ID: ${beneficiaryId} and phone: ${beneficiaryPhone}`);

    // 7. Create a sponsorship
    results.push('Creating sponsorship...');
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', 'Food')
      .single();

    if (!category) {
      throw new Error('Food category not found');
    }

    // Set fake balance for testing
    await supabaseAdmin
      .from('waas_wallets')
      .update({
        usdc_balance: 1000,
        gas_balance: 0.1,
      })
      .eq('user_id', sponsorUserId);

    const sponsorship = await SponsorshipService.createSponsorship(
      sponsorUserId,
      beneficiaryPhone,
      100, // 100 USDC
      [category.id],
      'Test sponsorship'
    );
    
    sponsorshipId = sponsorship.id;
    results.push(`Sponsorship created with ID: ${sponsorshipId} for 100 USDC`);

    // 8. Initiate a transaction
    results.push('Initiating transaction...');
    const transactionResponse = await TransactionService.initiateTransaction(
      vendorUserId,
      beneficiaryPhone,
      25, // 25 USDC
      category.id,
      'Test purchase'
    );
    
    pendingTransactionId = transactionResponse.pending_transaction_id;
    otp = transactionResponse.otp;
    results.push(`Transaction initiated with ID: ${pendingTransactionId} and OTP: ${otp}`);

    // 9. Confirm the transaction
    results.push('Confirming transaction...');
    const executedTransaction = await TransactionService.confirmTransaction(
      pendingTransactionId!,
      otp!
    );
    
    results.push(`Transaction confirmed with executed transaction ID: ${executedTransaction.id}`);
    results.push(`Status: ${executedTransaction.status}`);
    results.push(`Amount: ${executedTransaction.amount_usdc_transferred} USDC`);

    // 10. Check sponsorship remaining balance
    const { data: updatedSponsorship } = await supabaseAdmin
      .from('sponsorships')
      .select('remaining_usdc')
      .eq('id', sponsorshipId)
      .single();
      
    results.push(`Sponsorship remaining balance: ${updatedSponsorship?.remaining_usdc} USDC`);

    return res.status(200).json({ 
      success: true, 
      flow: 'completed',
      results 
    });
  } catch (error) {
    console.error('Error in test flow:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    });
  }
} 