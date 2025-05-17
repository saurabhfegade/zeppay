import { NextApiResponse } from 'next';
import { WalletService } from '../../../backend/services/walletService';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';
import { ApiError } from '../../../backend/lib/apiError';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Ensure user is authenticated and is a sponsor
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'sponsor') {
    return res.status(403).json({ error: 'Only sponsors can access this endpoint' });
  }

  try {
    // GET: Get sponsor's WaaS wallet(s)
    if (req.method === 'GET') {
      const wallet = await WalletService.getSponsorWaasWallet(req.user.id);
      
      if (!wallet) {
        return res.status(404).json({ error: 'No wallet found for this sponsor' });
      }
      
      // Refresh wallet balance
      const walletWithBalance = await WalletService.refreshWaasWalletBalance(wallet.id);
      
      return res.status(200).json(walletWithBalance);
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in sponsor waas-wallets API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with sponsor role requirement
export default withAuth(handler, ['sponsor']); 