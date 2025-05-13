import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../../backend/services/authService';
import { WalletService } from '../../backend/services/walletService';
import { SponsorshipService } from '../../backend/services/sponsorshipService';
import { CategoryService } from '../../backend/services/categoryService';
import { supabase } from '../../backend/lib/db';

/**
 * This is a test endpoint to simulate the sponsor flow.
 * It should NOT be used in production.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const results = [];
  
  try {
    // Step 1: Create test categories if they don't exist
    results.push('Creating test categories...');
    const categories = await CategoryService.getAllCategories();
    let categoryIds = [];
    
    if (categories.length === 0) {
      const testCategories = [
        { name: 'Food', description: 'Food and groceries' },
        { name: 'Healthcare', description: 'Medical services and supplies' },
        { name: 'Education', description: 'School fees and supplies' }
      ];
      
      for (const cat of testCategories) {
        const newCat = await CategoryService.createCategory(cat.name, cat.description);
        categoryIds.push(newCat.id);
      }
      results.push(`Created ${categoryIds.length} categories`);
    } else {
      categoryIds = categories.map(c => c.id);
      results.push(`Using ${categoryIds.length} existing categories`);
    }

    // Step 2: Create a test sponsor user
    const testEmail = `sponsor-test-${uuidv4().substring(0, 8)}@example.com`;
    const testPassword = 'Password123!';
    
    results.push(`Creating test sponsor user with email: ${testEmail}`);
    const { user: sponsor } = await AuthService.signUp(
      testEmail,
      testPassword,
      'sponsor',
      'Test Sponsor',
      '+12025550108' // Test US phone number
    );
    
    results.push(`Created sponsor user with ID: ${sponsor.id}`);

    // Step 3: Get the sponsor's WaaS wallet
    results.push('Getting sponsor WaaS wallet...');
    const wallet = await WalletService.getSponsorWaasWallet(sponsor.id);
    
    if (!wallet) {
      results.push('Error: No wallet found for sponsor');
      return res.status(500).json({ results });
    }
    
    results.push(`Sponsor wallet found: ${wallet.wallet_address}`);
    
    // Step 4: Update wallet with mock balance - using a direct SQL query for more reliable update
    results.push('Updating wallet with mock balance...');
    
    // First check the current balance
    const { data: currentWallet } = await supabase
      .from('waas_wallets')
      .select('*')
      .eq('id', wallet.id)
      .single();
    
    results.push(`Current wallet balance: ${currentWallet?.usdc_balance || 0} USDC`);
    
    // Use a direct SQL query with RPC for maximum reliability
    const { error: rpcError } = await supabase.rpc('update_wallet_balance', {
      wallet_id: wallet.id,
      usdc_amount: 1000,
      gas_amount: 0.1
    });
    
    if (rpcError) {
      // Fall back to standard update if RPC fails
      results.push(`RPC update failed: ${rpcError.message}, falling back to standard update`);
      
      const { data: updatedWallet, error: updateError } = await supabase
        .from('waas_wallets')
        .update({
          usdc_balance: 1000, // 1000 USDC
          gas_balance: 0.1,   // 0.1 ETH
          last_balance_sync_at: new Date()
        })
        .eq('id', wallet.id)
        .select()
        .single();
      
      if (updateError) {
        results.push(`Error updating wallet: ${updateError.message}`);
        return res.status(500).json({ results });
      } else {
        results.push(`Wallet updated with 1000 USDC and 0.1 ETH via standard update`);
      }
    } else {
      results.push(`Wallet updated with 1000 USDC and 0.1 ETH via RPC`);
    }
    
    // Verify the update worked by fetching the wallet again
    const { data: verifiedWallet } = await supabase
      .from('waas_wallets')
      .select('*')
      .eq('id', wallet.id)
      .single();
    
    results.push(`Verified wallet balance: ${verifiedWallet?.usdc_balance || 0} USDC`);
    
    // Force the WalletService to recognize the new balance
    await WalletService.refreshWaasWalletBalance(wallet.id);
    results.push('Refreshed wallet balance via service');
    
    // Get the wallet again to confirm the refresh worked
    const refreshedWallet = await WalletService.getSponsorWaasWallet(sponsor.id);
    results.push(`Refreshed wallet balance: ${refreshedWallet?.usdc_balance || 0} USDC`);

    // Step 5: Create a sponsorship
    results.push('Creating sponsorship...');
    const testPhone = '+254712345678'; // Test Kenyan phone number
    
    const sponsorship = await SponsorshipService.createSponsorship(
      sponsor.id,
      testPhone,
      100, // 100 USDC
      categoryIds.slice(0, 2), // Use first two categories
      'Test sponsorship from API flow',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
    );
    
    results.push(`Created sponsorship with ID: ${sponsorship.id}`);
    results.push(`Allocated 100 USDC to beneficiary ${sponsorship.beneficiary.display_name || testPhone}`);

    // Step 6: Get all sponsorships for this sponsor
    results.push('Getting all sponsorships for this sponsor...');
    const sponsorships = await SponsorshipService.getSponsorshipsBySponsor(sponsor.id);
    
    results.push(`Found ${sponsorships.length} sponsorships`);
    
    // Return all results and relevant data
    return res.status(200).json({
      success: true,
      results,
      testUser: {
        email: testEmail,
        password: testPassword,
        id: sponsor.id
      },
      wallet: refreshedWallet,
      beneficiary: sponsorship.beneficiary,
      sponsorship,
      sponsorships
    });
    
  } catch (error) {
    console.error('Error in test sponsor flow:', error);
    results.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    
    return res.status(500).json({
      success: false,
      results
    });
  }
} 