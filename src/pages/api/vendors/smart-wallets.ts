import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';
import { ApiError } from '../../../backend/lib/apiError';
import { supabase } from '../../../backend/lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only accept GET requests
  if (req.method !== 'GET') {
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
    // Get the vendor's smart wallets
    const { data: smartWallets, error } = await supabase
      .from('smart_wallets')
      .select('id, wallet_address, network_id, is_platform_created, created_at, updated_at')
      .eq('user_id', req.user.id);

    if (error) {
      throw new ApiError('Failed to fetch smart wallets', 500, error.message);
    }

    return res.status(200).json(smartWallets || []);
  } catch (error) {
    console.error('Error in vendor smart wallets API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with vendor role requirement
export default withAuth(handler, ['vendor']); 