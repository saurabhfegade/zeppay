import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { validateRequestBody } from '../../../backend/validation/requestValidation';
import { createClient } from '@supabase/supabase-js';
import { UserRole, WaasWallet, SmartWallet } from '../../../common/types/database.types';
import { WalletService } from '../../../backend/services/walletService';

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

    // If phone_number is required for vendor, validate here
    if (data.role === 'vendor' && !data.phone_number) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: [{ path: 'phone_number', message: 'Phone number is required for vendors' }],
      });
    }

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

    // Create wallet based on role
    let sponsorWallet: WaasWallet | null = null;
    let vendorWallet: SmartWallet | null = null;
    let walletCreationError: string | null = null;
    
    try {
      if (data.role === 'sponsor') {
        // Use WalletService to create sponsor wallet
        console.log(`Creating sponsor wallet for user ${authData.user.id}`);
        sponsorWallet = await WalletService.createWaasWalletForSponsor(authData.user.id);
        console.log('Sponsor wallet created successfully:', sponsorWallet);
      } else if (data.role === 'vendor') {
        // Use WalletService to create vendor wallet
        console.log(`Creating vendor wallet for user ${authData.user.id}`);
        vendorWallet = await WalletService.createSmartWalletForVendor(authData.user.id);
        console.log('Vendor wallet created successfully:', vendorWallet);
      }
    } catch (error) {
      console.error(`Failed to create wallet for ${data.role}:`, error);
      walletCreationError = error instanceof Error ? error.message : 'Unknown wallet creation error';
      // Continue with signup process - wallet can be created later
    }

    // Prepare wallet response data based on user role
    let walletResponse = null;
    if (data.role === 'sponsor' && sponsorWallet) {
      walletResponse = {
        id: sponsorWallet.id,
        wallet_address: sponsorWallet.wallet_address,
        network_id: sponsorWallet.network_id,
        coinbase_wallet_id: sponsorWallet.coinbase_wallet_id,
        usdc_balance: sponsorWallet.usdc_balance,
        gas_balance: sponsorWallet.gas_balance
      };
    } else if (data.role === 'vendor' && vendorWallet) {
      walletResponse = {
        id: vendorWallet.id,
        wallet_address: vendorWallet.wallet_address,
        network_id: vendorWallet.network_id,
        is_platform_created: vendorWallet.is_platform_created
      };
    }

    // Return user data, session, and wallet info
    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        display_name: userData.display_name,
      },
      wallet: walletResponse,
      wallet_creation_error: walletCreationError,
      session: null // No session since we used admin API
    });
  } catch (error) {
    console.error('Error in signup API route:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 