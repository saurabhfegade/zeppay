import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';
import { supabase } from '../../../backend/lib/db';
import { v4 as uuidv4 } from 'uuid';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Ensure user is authenticated and is a sponsor
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'sponsor') {
    return res.status(403).json({ error: 'Only sponsors can access this endpoint' });
  }

  try {
    // Check if user already has a wallet
    const { data: existingWallet } = await supabase
      .from('waas_wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (existingWallet) {
      // Update the existing wallet with mock balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('waas_wallets')
        .update({
          usdc_balance: 1000, // 1000 USDC
          gas_balance: 0.1,   // 0.1 ETH
          last_balance_sync_at: new Date()
        })
        .eq('id', existingWallet.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ 
          error: 'Failed to update wallet', 
          details: updateError.message 
        });
      }

      return res.status(200).json({
        message: 'Wallet updated with mock balance',
        wallet: updatedWallet
      });
    }

    // Create a new mock wallet
    const walletAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
    const walletData = {
      id: uuidv4(),
      user_id: req.user.id,
      coinbase_wallet_id: `waas_${Math.random().toString(16).slice(2, 12)}`,
      wallet_address: walletAddress,
      network_id: 'base-sepolia',
      usdc_balance: 1000, // 1000 USDC
      gas_balance: 0.1,   // 0.1 ETH
      last_balance_sync_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { data: newWallet, error } = await supabase
      .from('waas_wallets')
      .insert(walletData)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to create wallet', 
        details: error.message 
      });
    }

    return res.status(201).json({
      message: 'Mock wallet created successfully',
      wallet: newWallet
    });
  } catch (error) {
    console.error('Error creating mock wallet:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export default withAuth(handler, ['sponsor']); 