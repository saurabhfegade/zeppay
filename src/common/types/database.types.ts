export type UserRole = 'sponsor' | 'vendor';

export type TransactionStatus = 
  'initiated' | 
  'pending_confirmation' | 
  'completed_onchain' | 
  'failed_onchain' | 
  'platform_failed';

export type PendingTransactionStatus = 
  'pending_otp' | 
  'otp_verified' | 
  'expired' | 
  'failed_verification' | 
  'cancelled';

export type SponsorshipStatus = 
  'active' | 
  'depleted' | 
  'cancelled';

export interface User {
  id: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  display_name?: string;
  created_at: Date;
  updated_at: Date;
  raw_app_meta_data: Record<string, any>;
}

export interface WaasWallet {
  id: string;
  user_id: string;
  coinbase_wallet_id: string;
  wallet_address: string;
  network_id: string;
  usdc_balance: number;
  gas_balance: number;
  last_balance_sync_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SmartWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  network_id: string;
  is_platform_created: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Beneficiary {
  id: string;
  phone_number_for_telegram: string;
  display_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface VendorCategory {
  vendor_id: string;
  category_id: string;
}

export interface Sponsorship {
  id: string;
  sponsor_user_id: string;
  sponsor_waas_wallet_id: string;
  beneficiary_id: string;
  total_allocated_usdc: number;
  remaining_usdc: number;
  status: SponsorshipStatus;
  notes?: string;
  created_at: Date;
  expires_at?: Date;
}

export interface SponsorshipAllowedCategory {
  sponsorship_id: string;
  category_id: string;
}

export interface PendingTransaction {
  id: string;
  vendor_user_id: string;
  beneficiary_id: string;
  category_id: string;
  selected_sponsorship_id: string;
  amount_usdc: number;
  otp_hash: string;
  otp_sent_at: Date;
  otp_expires_at: Date;
  status: PendingTransactionStatus;
  vendor_notes?: string;
  created_at: Date;
}

export interface ExecutedTransaction {
  id: string;
  pending_transaction_id: string;
  sponsorship_id: string;
  source_waas_wallet_id: string;
  vendor_user_id: string;
  destination_smart_wallet_id: string;
  beneficiary_id: string;
  category_id: string;
  amount_usdc_transferred: number;
  coinbase_transaction_id?: string;
  onchain_transaction_hash?: string;
  status: TransactionStatus;
  platform_notes?: string;
  created_at: Date;
  updated_at: Date;
} 