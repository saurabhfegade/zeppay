import { NextApiResponse } from 'next';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ApiError } from '../../../backend/lib/apiError';
import { handleError } from '../../../backend/lib/error-handler';
import { BeneficiaryService } from '../../../backend/services/beneficiary-service';
import { addSponsorBeneficiarySchema } from '../../../backend/validation/beneficiary-validation';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user?.id;
  const accessToken = req.supabaseAccessToken;

  if (!userId || !accessToken) {
    return handleError(new ApiError('User not authenticated or token missing', 401), res);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[API Route] Supabase URL or Anon Key not set');
    return handleError(new ApiError('Server configuration error', 500), res);
  }

  // Create a new Supabase client instance for this request, authenticated with the user's token.
  const requestScopedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, { 
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      storage: undefined, // Use in-memory storage for server-side, request-scoped client
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceSupabaseClient = requestScopedSupabaseClient as SupabaseClient<any>; 
  const beneficiaryService = new BeneficiaryService(serviceSupabaseClient);

  try {
    // The log for getSession() in BeneficiaryService: 
    // Calling getSession() on this requestScopedSupabaseClient might still not yield a full session object
    // as it's not going through the full browser auth flow. 
    // However, RLS will work because the JWT is in the Authorization header for DB requests.
    if (req.method === 'GET') {
      const beneficiaries = await beneficiaryService.getBeneficiariesForSponsor(userId);
      res.status(200).json(beneficiaries);
    } else if (req.method === 'POST') {
      const validationResult = addSponsorBeneficiarySchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ApiError('Invalid request body', 400, JSON.stringify(validationResult.error.flatten()));
      }

      const newBeneficiary = await beneficiaryService.addBeneficiaryToSponsor(userId, validationResult.data);
      res.status(201).json(newBeneficiary);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      handleError(new ApiError(`Method ${req.method} Not Allowed`, 405), res);
    }
  } catch (error) {
    handleError(error, res);
  }
  // No finally block needed to clear auth state as this client is request-scoped.
}

export default withAuth(handler, ['sponsor']); 