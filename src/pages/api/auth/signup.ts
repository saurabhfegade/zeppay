import type { NextApiRequest, NextApiResponse } from 'next';
import { authService } from '../../../backend/services/auth-service';
import { signupSchema, SignupPayload } from '../../../backend/validation/auth-schemas';
import { handleError, AppError } from '../../../backend/lib/error-handler';
import type { User } from '../../../common/types/db';
import type { ApiErrorResponse, ApiSuccessResponse } from '../../../common/types/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccessResponse<User> | ApiErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return handleError(res, new AppError({ message: `Method ${req.method} Not Allowed`, statusCode: 405 }));
  }

  try {
    const validatedBody = signupSchema.parse(req.body);
    const { user, error } = await authService.signupUser(validatedBody as SignupPayload);

    if (error || !user) {
      // authService.signupUser should ideally return an error object that handleError can interpret
      // For now, pass the Supabase error or a new AppError
      return handleError(res, error || new AppError({ message: 'Signup failed', statusCode: 500, originalError: error }));
    }

    // TODO: After successful signup, you might want to handle wallet provisioning (Phase 2)
    // e.g., if (user.role === 'sponsor') await walletService.provisionSponsorWallet(user.id);
    // e.g., if (user.role === 'vendor') await walletService.provisionVendorWallet(user.id);

    return res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  } catch (error) {
    // This will catch ZodErrors from parse, or any other unexpected errors
    return handleError(res, error);
  }
} 