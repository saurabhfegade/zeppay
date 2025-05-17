import { NextApiResponse } from 'next';
import { supabase } from '../../../backend/lib/db';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';
import { ApiError } from '../../../backend/lib/apiError';

/**
 * API route to look up a beneficiary by phone number
 * Used by sponsors to check if a beneficiary exists before creating a sponsorship
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { phone_number } = req.query;

    if (!phone_number || typeof phone_number !== 'string') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Find beneficiary by phone number
    const { data: beneficiary, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('phone_number_for_telegram', phone_number)
      .single();

    if (error) {
      // If the beneficiary doesn't exist, return a 404
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Beneficiary not found',
          message: 'This beneficiary does not exist yet. They will be created when you create a sponsorship.'
        });
      }
      
      throw new ApiError('Failed to fetch beneficiary', 500, error.message);
    }

    return res.status(200).json({
      id: beneficiary.id,
      phone_number_for_telegram: beneficiary.phone_number_for_telegram,
      display_name: beneficiary.display_name,
      created_at: beneficiary.created_at,
      message: 'Beneficiary found'
    });
  } catch (error) {
    console.error('Error in beneficiary lookup API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware
export default withAuth(handler); 