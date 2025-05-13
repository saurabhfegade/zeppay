import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { validateRequestBody } from '../../backend/validation/requestValidation';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '../../common/types/database.types';

// Validate request body using Zod
const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['sponsor', 'vendor']),
  display_name: z.string().min(2),
  phone_number: z.string().optional(),
});

type SignupRequest = z.infer<typeof SignupSchema>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const data = await validateRequestBody<SignupRequest>(SignupSchema, req, res);
    if (!data) return; // Response already sent by validateRequestBody

    // Create Supabase admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create user with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: data.role,
        display_name: data.display_name,
        phone_number: data.phone_number,
      }
    });

    if (authError || !authData.user) {
      console.error('Admin user creation error:', authError);
      return res.status(500).json({
        error: 'Failed to create user account',
        details: authError?.message
      });
    }

    // Insert the user into our custom users table - ALSO using admin client to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        phone_number: data.phone_number,
        role: data.role as UserRole,
        display_name: data.display_name,
        raw_app_meta_data: authData.user.app_metadata,
      })
      .select()
      .single();

    if (userError) {
      console.error('User table insert error:', userError);
      // Clean up the auth user since we couldn't create the record in our users table
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: 'Failed to create user record',
        details: userError.message
      });
    }

    // Simply create a dummy wallet object without actually calling the CDP API
    const dummyWalletResponse = {
      wallet_address: `0x${Math.random().toString(16).slice(2, 42)}`, // Random address for testing
      network_id: 'base-sepolia',
      coinbase_wallet_id: `waas_${Math.random().toString(16).slice(2, 12)}`,
      usdc_balance: 1000, // Mock balance
      gas_balance: 0.1
    };

    // Return user data and wallet info
    return res.status(201).json({
      message: 'Test user created successfully',
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        display_name: userData.display_name,
      },
      wallet: dummyWalletResponse,
      session: null // No session since we used admin API
    });
  } catch (error) {
    console.error('Error in test signup API route:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 