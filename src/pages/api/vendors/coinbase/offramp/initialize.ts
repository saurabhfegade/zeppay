import { NextApiResponse } from 'next';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '../../../../../backend/middlewares/auth.middleware';
import { validateRequestBody } from '../../../../../backend/validation/requestValidation';
import { ApiError } from '../../../../../backend/lib/apiError';

// Validate request body using Zod
const OfframpInitializeSchema = z.object({
  amount_usdc: z.number().positive(),
  source_smart_wallet_address: z.string().startsWith('0x'),
});

type OfframpInitializeRequest = z.infer<typeof OfframpInitializeSchema>;

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
    const data = await validateRequestBody<OfframpInitializeRequest>(OfframpInitializeSchema, req, res);
    if (!data) return; // Response already sent by validateRequestBody

    // Verify wallet ownership
    // Note: In a production app, this would validate that the wallet address belongs to this vendor
    
    // This is a conceptual implementation for the hackathon
    // In a real application, this would integrate with Coinbase Offramp API
    
    // Mock offramp session details
    const offrampSessionDetails = {
      session_id: `offramp-session-${Date.now()}`,
      amount_usdc: data.amount_usdc,
      source_wallet: data.source_smart_wallet_address,
      widget_url: `https://coinbase.com/offramp?mock=true&amount=${data.amount_usdc}&wallet=${data.source_smart_wallet_address}`,
      expires_at: new Date(Date.now() + 3600000).toISOString(), // Expires in 1 hour
    };

    // Note: In production, we would securely store this offramp session in the database
    // and create a webhook handler to process offramp status updates

    return res.status(200).json({
      message: 'Offramp session created successfully',
      offramp_session_details: offrampSessionDetails,
    });
  } catch (error) {
    console.error('Error in offramp initialize API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with vendor role requirement
export default withAuth(handler, ['vendor']); 