import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

export type UserRole = 'sponsor' | 'vendor';

export interface UserProfile {
  id: string;
  email?: string;
  role: UserRole;
  display_name?: string;
  phone_number?: string;
  // Add other profile fields as needed
}

export interface SignUpRequestPayload {
  email: string;
  password: string;
  role: UserRole;
  display_name?: string;
  phone_number?: string;
}

export interface SignUpResponsePayload {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  // Add any custom fields your API returns
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface LoginResponsePayload {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  // Add any custom fields your API returns
}

export interface GetMeResponsePayload extends UserProfile {
  // Supabase user object might not be fully needed on frontend for /me
  // It depends on what /api/auth/me returns according to PRD
  waas_wallet?: WaasWalletInfo; // Define more specific type later
  smart_wallet?: SmartWalletInfo; // Define more specific type later
}

export interface WaasWalletInfo {
  id: string;
  coinbase_wallet_id: string;
  wallet_address: string;
  network_id: string;
  usdc_balance: string; // Assuming string from PRD, could be number
  gas_balance: string;  // Assuming string from PRD, could be number
  last_balance_sync_at: string; // ISO date string
}

export interface SmartWalletInfo {
  id: string;
  wallet_address: string;
  network_id: string;
  is_platform_created: boolean;
} 