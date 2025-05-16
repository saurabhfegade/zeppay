import { NextApiResponse } from 'next';
// import { AuthService } from '../../../backend/services/authService'; // Removed unused import
import { WalletService } from '../../../backend/services/walletService';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';
import { ApiError } from '../../../backend/lib/apiError';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's wallet based on role
    let wallet = null;
    if (req.user.role === 'sponsor') {
      wallet = await WalletService.getSponsorWaasWallet(req.user.id);
    } else if (req.user.role === 'vendor') {
      wallet = await WalletService.getVendorSmartWallet(req.user.id);
    }

    // Reshape the user object for the response
    const userResponse = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      display_name: req.user.display_name,
      phone_number: req.user.phone_number,
      created_at: req.user.created_at,
      wallet: wallet ? {
        id: wallet.id,
        // For sponsor (WaaS wallet)
        coinbase_wallet_id: 'coinbase_wallet_id' in wallet ? wallet.coinbase_wallet_id : undefined,
        usdc_balance: 'usdc_balance' in wallet ? wallet.usdc_balance : undefined,
        gas_balance: 'gas_balance' in wallet ? wallet.gas_balance : undefined,
        // For vendor (Smart wallet)
        is_platform_created: 'is_platform_created' in wallet ? wallet.is_platform_created : undefined,
        // Common
        wallet_address: wallet.wallet_address,
        network_id: wallet.network_id,
      } : null,
    };

    return res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error in me API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware
export default withAuth(handler); 