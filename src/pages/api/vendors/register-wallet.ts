import { NextApiResponse } from 'next';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';
import { validateRequestBody } from '../../../backend/validation/requestValidation';
import { ApiError } from '../../../backend/lib/apiError';
import { supabase } from '../../../backend/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Validate request body using Zod
const WalletRegistrationSchema = z.object({
  wallet_address: z.string().startsWith('0x'),
});

type WalletRegistrationRequest = z.infer<typeof WalletRegistrationSchema>;

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure user is authenticated and is a vendor
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Only vendors can access this endpoint' });
  }

  try {
    // Validate request body
    const data = await validateRequestBody<WalletRegistrationRequest>(WalletRegistrationSchema, req, res);
    if (!data) return; // Response already sent by validateRequestBody

    // Check if vendor already has a wallet
    const { data: existingWallet } = await supabase
      .from('smart_wallets')
      .select('id, wallet_address')
      .eq('user_id', req.user.id)
      .single();

    if (existingWallet) {
      // Update existing wallet if it's different
      if (existingWallet.wallet_address !== data.wallet_address) {
        const { data: updatedWallet, error } = await supabase
          .from('smart_wallets')
          .update({
            wallet_address: data.wallet_address,
            updated_at: new Date(),
          })
          .eq('id', existingWallet.id)
          .select()
          .single();

        if (error) {
          throw new ApiError('Failed to update wallet', 500, error.message);
        }

        return res.status(200).json({
          message: 'Wallet address updated successfully',
          wallet: updatedWallet,
        });
      }

      return res.status(200).json({
        message: 'Wallet address already registered',
        wallet: existingWallet,
      });
    }

    // Create new wallet record
    const walletData = {
      id: uuidv4(),
      user_id: req.user.id,
      wallet_address: data.wallet_address,
      network_id: 'base-sepolia', // Default to Sepolia testnet
      is_platform_created: false, // User created this wallet
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { data: newWallet, error } = await supabase
      .from('smart_wallets')
      .insert(walletData)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to register wallet', 500, error.message);
    }

    return res.status(201).json({
      message: 'Wallet registered successfully',
      wallet: newWallet,
    });
  } catch (error) {
    console.error('Error in register wallet API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with vendor role requirement
export default withAuth(handler, ['vendor']); 