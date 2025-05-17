import { NextApiResponse } from 'next';
import { z } from 'zod';
import { SponsorshipService } from '../../../../backend/services/sponsorshipService';
import { withAuth, AuthenticatedRequest } from '../../../../backend/middlewares/auth.middleware';
import { validateRequestBody } from '../../../../backend/validation/requestValidation';
import { ApiError } from '../../../../backend/lib/apiError';

// Validate request body for POST using Zod
const CreateSponsorshipSchema = z.object({
  beneficiary_phone_number: z.string().min(4),
  amount_usdc: z.number().positive(),
  category_ids: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
  expires_at: z.string().optional(),
});

type CreateSponsorshipRequest = z.infer<typeof CreateSponsorshipSchema>;

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Ensure user is authenticated and is a sponsor
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'sponsor') {
    return res.status(403).json({ error: 'Only sponsors can access this endpoint' });
  }

  try {
    // GET: Get sponsor's sponsorships
    if (req.method === 'GET') {
      const sponsorships = await SponsorshipService.getSponsorshipsBySponsor(req.user.id);
      return res.status(200).json(sponsorships);
    }
    
    // POST: Create a new sponsorship
    else if (req.method === 'POST') {
      // Validate request body
      const data = await validateRequestBody<CreateSponsorshipRequest>(CreateSponsorshipSchema, req, res);
      if (!data) return; // Response already sent by validateRequestBody

      // Transform expires_at string to Date if provided
      const expiresAt = data.expires_at ? new Date(data.expires_at) : undefined;
      
      // Create the sponsorship
      const sponsorship = await SponsorshipService.createSponsorship(
        req.user.id,
        data.beneficiary_phone_number,
        data.amount_usdc,
        data.category_ids,
        data.notes,
        expiresAt
      );

      return res.status(201).json(sponsorship);
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in sponsorships API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with sponsor role requirement
export default withAuth(handler, ['sponsor']); 