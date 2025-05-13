import { Session, AuthUser } from '@supabase/supabase-js';
import type { LoginPayload, SignupPayload } from '../validation/auth-schemas';
import type { User } from '../../common/types/db';
import { supabaseAdmin } from '../lib/supabase-admin';
import { AppError } from '../lib/error-handler';

// It's crucial that these are set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing environment variable SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase client with service_role key for admin-level operations
// const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false,
//   },
// });

export class AuthService {
  async signupUser(payload: SignupPayload) {
    const { email, password, role, display_name, phone_number } = payload;

    // Step 1: Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Supabase auth signup error:', authError);
      throw new AppError({message: authError?.message || 'Failed to sign up user in auth schema', statusCode: authError?.status || 500});
    }

    const user = authData.user;

    // Step 2: Insert the user profile into public.users table
    const { error: profileInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        role: role,
        display_name: display_name,
        phone_number: phone_number,
      });

    if (profileInsertError) {
      console.error('Error inserting user profile into public.users:', profileInsertError);
      throw new AppError({message: 'User authenticated but failed to create profile in public.users.', statusCode: 500});
    }

    console.log('User signed up and profile created successfully for:', user.email);
    return { user };
  }

  async loginUser(payload: LoginPayload): Promise<{ session: Session; user: AuthUser }> {
    const { email, password } = payload;
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      console.error('Supabase auth login error:', error);
      throw new AppError({message: error?.message || 'Invalid login credentials', statusCode: error?.status || 401});
    }
    
    return { session: data.session, user: data.user };
  }

  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new AppError({message: 'Could not fetch user profile', statusCode: 500});
    }
    return data;
  }

  async getUserBySession(sessionToken: string): Promise<User | null> {
    // Use await to get the result first, then check error and data before destructuring
    const { data, error } = await supabaseAdmin.auth.getUser(sessionToken);

    // Check for errors or if data or data.user is null/undefined first
    if (error || !data || !data.user) {
      if (error && error.status !== 401) { // Log unexpected errors (401 is expected for invalid token)
        console.error('Get user by session error:', error);
      } 
      return null; // Return null if token invalid, user not found, or other error
    }

    // If we reach here, data and data.user are valid
    const authUser = data.user; 

    try {
      // Now safely use authUser.id to get the profile
      const profile = await this.getUserProfile(authUser.id);
      if (!profile) {
        // Handle case where auth user exists but profile doesn't (should not happen with current signup logic)
        console.error(`Profile not found in public.users for valid auth user: ${authUser.id}`);
        return null;
      }
      return profile;
    } catch (profileError) {
      // Log errors encountered while fetching the profile
      if (profileError instanceof AppError) {
        console.error('AppError fetching profile for valid session:', profileError.message, profileError.statusCode);
      } else {
        console.error('Error fetching profile for valid session:', profileError);
      }
      return null; // Return null if profile fetch fails
    }
  }
}

export const authService = new AuthService(); 