import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../lib/db';
import { User } from '../../common/types/database.types';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: User;
  supabaseAccessToken?: string;
}

type NextApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Middleware for authenticating requests using Supabase JWT
 * 
 * @param handler The API route handler
 * @param requiredRoles Optional array of roles that are allowed to access the endpoint
 * @returns NextApiHandler
 */
export function withAuth(
  handler: NextApiHandler,
  requiredRoles?: Array<'sponsor' | 'vendor'>
): NextApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    
    try {
      // Verify the JWT with Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired authorization token' });
      }
      
      // Get the user from the database to include role and other details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError || !userData) {
        console.error('User fetch error:', userError);
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if the user has the required role
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(userData.role)) {
          return res.status(403).json({ error: 'Insufficient permissions for this endpoint' });
        }
      }
      
      // Attach the user to the request
      req.user = userData as User;
      req.supabaseAccessToken = token;
      
      // Call the API route handler
      return handler(req, res);
    } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  };
} 