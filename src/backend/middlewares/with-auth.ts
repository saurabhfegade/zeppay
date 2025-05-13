import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { authService } from '../services/auth-service';
import { handleError, AppError } from '../lib/error-handler';
import type { User } from '../../common/types/db';
import type { ApiErrorResponse } from '../../common/types/api';

// Extend NextApiRequest to include the user property
export interface NextApiRequestWithUser extends NextApiRequest {
  user: User;
}

// Define the type for the protected handler
type ProtectedApiHandler<T = unknown> = (
  req: NextApiRequestWithUser,
  res: NextApiResponse<T | ApiErrorResponse>
) => void | Promise<void>;

export function withAuth(handler: ProtectedApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return handleError(res, new AppError({ message: 'Authorization header missing or malformed', statusCode: 401 }));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return handleError(res, new AppError({ message: 'Token missing from Authorization header', statusCode: 401 }));
    }

    try {
      // getUserBySession now returns User | null directly
      const userProfile = await authService.getUserBySession(token);

      // Check if the profile fetch was successful (userProfile is not null)
      if (!userProfile) {
        // If null, the token was invalid/expired or the profile couldn't be fetched after successful auth check
        return handleError(res, new AppError({ message: 'Invalid or expired token', statusCode: 401 }));
      }

      // Attach the valid user profile to the request object
      (req as NextApiRequestWithUser).user = userProfile;
      return handler(req as NextApiRequestWithUser, res);
    } catch (error) {
      // Catch any unexpected errors during the process
      console.error('Unexpected error in withAuth:', error);
      return handleError(res, new AppError({ message: 'Authentication failed due to an unexpected error', statusCode: 500, originalError: error }));
    }
  };
} 