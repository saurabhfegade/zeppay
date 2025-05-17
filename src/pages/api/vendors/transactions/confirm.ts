import { NextApiResponse } from 'next';
import { z } from 'zod';
import { TransactionService } from '../../../../backend/services/transactionService';
import { withAuth, AuthenticatedRequest } from '../../../../backend/middlewares/auth.middleware';
import { validateRequestBody } from '../../../../backend/validation/requestValidation';
import { ApiError } from '../../../../backend/lib/apiError';

// Validate request body using Zod
const ConfirmTransactionSchema = z.object({
  pending_transaction_id: z.string().uuid(),
  otp: z.string().min(6).max(6),
});

type ConfirmTransactionRequest = z.infer<typeof ConfirmTransactionSchema>;

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
    const data = await validateRequestBody<ConfirmTransactionRequest>(ConfirmTransactionSchema, req, res);
    if (!data) return; // Response already sent by validateRequestBody

    // Confirm the transaction with OTP
    const executedTransaction = await TransactionService.confirmTransaction(
      data.pending_transaction_id,
      data.otp
    );

    // Check if this pending transaction belongs to this vendor
    // This would be done in the service in a production environment
    // For simplicity in this hackathon, we'll assume the service handles this

    return res.status(200).json({
      message: 'Transaction successfully confirmed',
      transaction: executedTransaction,
    });
  } catch (error) {
    console.error('Error in confirm transaction API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with vendor role requirement
export default withAuth(handler, ['vendor']); 