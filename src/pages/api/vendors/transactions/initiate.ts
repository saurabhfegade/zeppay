import { NextApiResponse } from 'next';
import { z } from 'zod';
import { TransactionService } from '../../../../backend/services/transactionService';
import { withAuth, AuthenticatedRequest } from '../../../../backend/middlewares/auth.middleware';
import { validateRequestBody } from '../../../../backend/validation/requestValidation';
import { ApiError } from '../../../../backend/lib/apiError';

// Validate request body using Zod
const InitiateTransactionSchema = z.object({
  beneficiary_phone_number: z.string().min(4),
  amount_usdc: z.number().positive(),
  category_id: z.string().uuid(),
  vendor_notes: z.string().optional(),
});

type InitiateTransactionRequest = z.infer<typeof InitiateTransactionSchema>;

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  console.log('📥 API: /api/vendors/transactions/initiate received request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    hasAuth: !!req.headers.authorization,
  });

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
    const data = await validateRequestBody<InitiateTransactionRequest>(InitiateTransactionSchema, req, res);
    if (!data) return; // Response already sent by validateRequestBody

    // Initiate the transaction
    const transactionDetails = await TransactionService.initiateTransaction(
      req.user.id,
      data.beneficiary_phone_number,
      data.amount_usdc,
      data.category_id,
      data.vendor_notes
    );

    // Return response with OTP display message for alert instead of Telegram
    return res.status(200).json({
      pending_transaction_id: transactionDetails.pending_transaction_id,
      otp_message_to_display: transactionDetails.otp_display_message,
      otp_expires_at: transactionDetails.otp_expires_at,
      // Include OTP in response for testing purposes
      // In production, this would be removed
      otp: transactionDetails.otp
    });
  } catch (error) {
    console.error('Error in initiate transaction API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with vendor role requirement
export default withAuth(handler, ['vendor']); 