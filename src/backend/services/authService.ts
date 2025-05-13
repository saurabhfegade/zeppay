import { supabase } from '../lib/db';
import { User, UserRole } from '../../common/types/database.types';
import { WalletService } from './walletService';
import { ApiError } from '../lib/apiError';
import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';

type AuthDataType = {
  user: User | null | SupabaseUser;
  session: Session | null;
};

export class AuthService {
  /**
   * Signs up a new user with Supabase, creates appropriate wallet, and inserts into users table
   * If standard signup fails, falls back to admin API
   * 
   * @param email User's email
   * @param password User's password
   * @param role User role (sponsor or vendor)
   * @param displayName User's display name
   * @param phoneNumber Optional phone number
   * @returns The created user and session
   */
  static async signUp(
    email: string,
    password: string,
    role: UserRole,
    displayName: string,
    phoneNumber?: string
  ) {
    try {
      // First attempt: try standard signup
      let authData: AuthDataType = { user: null, session: null };
      let authError;
      
      try {
        console.log(`Attempting standard signup for email: ${email}`);
        const signupResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              display_name: displayName,
              phone_number: phoneNumber,
            },
          },
        });
        
        authData = signupResult.data;
        authError = signupResult.error;
      } catch (error) {
        console.error('Error during standard signup:', error);
        authError = error;
      }

      // If standard signup fails, try admin API
      if (authError || !authData?.user) {
        console.log('Standard signup failed, attempting admin API signup', authError);
        
        // Create admin client
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
        const { data: adminAuthData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role,
            display_name: displayName,
            phone_number: phoneNumber,
          }
        });
        
        if (adminError) {
          console.error('Admin API signup error:', adminError);
          throw new ApiError('Failed to create user account', 500, adminError.message);
        }
        
        authData = { user: adminAuthData.user, session: null };
      }

      if (!authData?.user) {
        throw new ApiError('Failed to create user account', 500, 'No user data returned');
      }

      // Insert the user into our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          phone_number: phoneNumber,
          role,
          display_name: displayName,
          raw_app_meta_data: (authData.user as SupabaseUser).app_metadata || {},
        })
        .select()
        .single();

      if (userError) {
        console.error('User table insert error:', userError);
        // Clean up the auth user since we couldn't create the record in our users table
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
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new ApiError('Failed to create user record', 500, userError.message);
      }

      // Create appropriate wallet for the user's role
      try {
        if (role === 'sponsor') {
          await WalletService.createWaasWalletForSponsor(authData.user.id);
        } else if (role === 'vendor') {
          await WalletService.createSmartWalletForVendor(authData.user.id);
        }
      } catch (error) {
        console.error(`Failed to create wallet for ${role}:`, error);
        // Don't throw here - the user account is created, but they'll need to create a wallet later
      }

      return { 
        user: userData as User, 
        session: 'session' in authData ? authData.session : null 
      };
    } catch (error) {
      console.error('Error in AuthService.signUp:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to create user account', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Signs in a user with email and password
   * 
   * @param email User's email
   * @param password User's password
   * @returns The user session
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error('Supabase auth signin error:', error);
      throw new ApiError('Invalid email or password', 401, error?.message);
    }

    // Get user profile data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.error('User lookup error on signin:', userError);
      throw new ApiError('User record not found', 404, userError.message);
    }

    return { user: userData as User, session: data.session };
  }

  /**
   * Gets a user's profile by ID
   * 
   * @param userId User ID
   * @returns The user profile
   */
  static async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('User profile fetch error:', error);
      throw new ApiError('User not found', 404, error?.message);
    }

    return data as User;
  }

  /**
   * Updates a user's profile
   * 
   * @param userId User ID
   * @param updates Partial user fields to update
   * @returns The updated user
   */
  static async updateUserProfile(userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'role'>>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('User profile update error:', error);
      throw new ApiError('Failed to update user profile', 500, error.message);
    }

    return data as User;
  }
} 