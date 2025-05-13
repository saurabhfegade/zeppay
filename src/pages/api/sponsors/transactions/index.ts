import { NextApiResponse } from 'next';
import { TransactionService } from '../../../../backend/services/transactionService';
import { withAuth, AuthenticatedRequest } from '../../../../backend/middlewares/auth.middleware';
import { ApiError } from '../../../../backend/lib/apiError';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure user is authenticated and is a sponsor
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'sponsor') {
    return res.status(403).json({ error: 'Only sponsors can access this endpoint' });
  }

  try {
    // Get sponsor's transactions
    const transactions = await TransactionService.getTransactionsForSponsor(req.user.id);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error in sponsor transactions API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with sponsor role requirement
export default withAuth(handler, ['sponsor']); 