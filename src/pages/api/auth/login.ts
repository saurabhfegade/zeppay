import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { validateRequestBody } from '../../../backend/validation/requestValidation';
import { createClient } from '@supabase/supabase-js';

// Validate request body using Zod
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type LoginRequest = z.infer<typeof LoginSchema>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const data = await validateRequestBody<LoginRequest>(LoginSchema, req, res);
    if (!data) return; // Response already sent by validateRequestBody

    // Create standard Supabase client for authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Attempt to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user) {
      console.error('Supabase auth signin error:', authError);
      return res.status(401).json({ error: 'Invalid email or password', details: authError?.message });
    }

    // First attempt to get user data with the authenticated client
    let userData;
    let userError;
    
    try {
      const result = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      userData = result.data;
      userError = result.error;
    } catch (error) {
      console.error('Error fetching user data with authenticated client:', error);
      userError = error;
    }

    // If that fails due to RLS, try with admin client
    if (userError) {
      console.log('User lookup failed with authenticated client, trying admin client');
      
      // Create admin client to bypass RLS
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );
      
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (adminError) {
        console.error('User lookup error with admin client:', adminError);
        return res.status(404).json({ 
          error: 'User record not found', 
          details: adminError.message 
        });
      }
      
      userData = adminData;
    }

    if (!userData) {
      return res.status(404).json({ 
        error: 'User record not found', 
        details: 'No user data found in database'
      });
    }

    // Return user data and session
    return res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        display_name: userData.display_name,
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
    });
  } catch (error) {
    console.error('Error in login API route:', error);
    return res.status(500).json({ 
      error: 'Internal server error during login',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 