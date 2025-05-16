import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/backend/middlewares/auth.middleware'; // Adjusted path based on project structure
import { SponsorshipService, EligibleSponsorshipForVendor } from '@/backend/services/sponsorshipService'; // Adjusted path
import { handleError } from '@/backend/lib/error-handler'; // Adjusted path
import { ApiError } from '@/backend/lib/apiError'; // Import ApiError

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication and role check should be handled by withAuth middleware
  // req.user will be populated by withAuth
  if (!req.user) {
    // This case should ideally be caught by withAuth, but as a fallback:
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const eligibleSponsorships: EligibleSponsorshipForVendor[] = await SponsorshipService.getEligibleSponsorshipsForVendor(req.user.id);
    return res.status(200).json(eligibleSponsorships);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    // Fallback for other types of errors
    handleError(error as Error, res); // Pass error as Error type to satisfy handleError
  }
}

// Apply the auth middleware, ensuring it requires the 'vendor' role.
// The actual role string might depend on your specific User type and how roles are stored.
export default withAuth(handler, ['vendor']); 