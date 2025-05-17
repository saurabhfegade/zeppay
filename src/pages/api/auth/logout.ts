import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../backend/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Simply sign out without requiring token validation
    // This is safer as it won't fail if the token is already expired/invalid
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return res.status(500).json({ error: 'Failed to sign out', details: error.message });
    }

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout API route:', error);
    return res.status(500).json({ 
      error: 'Internal server error during logout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 