export type UserRole = 'sponsor' | 'vendor' | 'beneficiary'; // Or 'admin' if needed

export interface User {
  id: string; // UUID, references auth.users.id
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  email: string; // From auth.users.email
  display_name: string | null;
  phone_number: string | null;
  role: UserRole;
  // other user-specific profile fields
}

export interface Beneficiary {
  id: string; // UUID, primary key
  user_id: string | null; // foreign key to users.id, if a beneficiary can also be a platform user
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  phone_number: string; // unique identifier for beneficiary
  display_name: string | null;
  telegram_user_id: string | null; // For Telegram notifications
  // other beneficiary-specific fields
}

export interface Category {
  id: string; // UUID, primary key
  created_at: string; // timestamp with time zone
  name: string; // e.g., "Groceries", "Education", "Healthcare"
  description: string | null;
}

export interface WaaSWallet {
  id: string; // UUID, primary key
  user_id: string; // foreign key to users.id (sponsor)
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  coinbase_wallet_id: string; // ID from Coinbase WaaS
  address: string;
  network: string; // e.g., "base-mainnet", "base-sepolia"
  usdc_balance: number; // decimal, updated via webhook or direct check
  gas_balance: number; // decimal, for the native gas token (e.g., ETH on Base)
  // other WaaS wallet-specific fields
}

export interface SmartWallet {
  id: string; // UUID, primary key
  user_id: string; // foreign key to users.id (vendor)
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  address: string; // unique
  network: string; // e.g., "base-mainnet", "base-sepolia"
  // other smart wallet-specific fields
}

export interface Sponsorship {
  id: string; // UUID, primary key
  sponsor_user_id: string; // foreign key to users.id (sponsor)
  beneficiary_id: string; // foreign key to beneficiaries.id
  waas_wallet_id: string; // foreign key to waas_wallets.id (sponsor's WaaS wallet used for funding)
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  initial_usdc_amount: number; // decimal
  remaining_usdc_amount: number; // decimal
  notes: string | null;
  expires_at: string | null; // timestamp with time zone
  status: 'active' | 'depleted' | 'expired' | 'cancelled';
  // other sponsorship-specific fields
}

export interface SponsorshipAllowedCategory {
  id: string; // UUID, primary key
  sponsorship_id: string; // foreign key to sponsorships.id
  category_id: string; // foreign key to categories.id
  // Ensure composite key (sponsorship_id, category_id) is unique
}

export interface VendorCategory {
  id: string; // UUID, primary key
  vendor_user_id: string; // foreign key to users.id (vendor)
  category_id: string; // foreign key to categories.id
  // Ensure composite key (vendor_user_id, category_id) is unique
}

export type PendingTransactionStatus = 'otp_pending' | 'otp_verified' | 'otp_failed' | 'expired';

export interface PendingTransaction {
  id: string; // UUID, primary key
  sponsorship_id: string; // foreign key to sponsorships.id
  vendor_user_id: string; // foreign key to users.id (vendor who initiated)
  beneficiary_id: string; // foreign key to beneficiaries.id
  category_id: string; // foreign key to categories.id
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  amount_usdc: number; // decimal
  otp_hashed: string;
  otp_expires_at: string; // timestamp with time zone
  status: PendingTransactionStatus;
  vendor_notes: string | null;
  // other pending transaction-specific fields
}

export type ExecutedTransactionStatus = 'initiated' | 'pending_onchain_confirmation' | 'completed_onchain' | 'failed_onchain' | 'reverted';

export interface ExecutedTransaction {
  id: string; // UUID, primary key
  pending_transaction_id: string | null; // foreign key to pending_transactions.id (if originated from OTP flow)
  sponsorship_id: string; // foreign key to sponsorships.id
  vendor_user_id: string; // foreign key to users.id (vendor)
  beneficiary_id: string; // foreign key to beneficiaries.id
  category_id: string; // foreign key to categories.id
  sponsor_waas_wallet_id: string; // foreign key to waas_wallets.id
  vendor_smart_wallet_id: string; // foreign key to smart_wallets.id
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  amount_usdc: number; // decimal
  status: ExecutedTransactionStatus;
  coinbase_transaction_id: string | null; // from Coinbase WaaS transfer API
  onchain_transaction_hash: string | null;
  executed_at: string | null; // timestamp with time zone, when transfer was confirmed on-chain
  // other executed transaction-specific fields
}

// It's good practice to have a Database interface that groups all table types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'email'>>;
      };
      beneficiaries: {
        Row: Beneficiary;
        Insert: Omit<Beneficiary, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Beneficiary, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      waas_wallets: {
        Row: WaaSWallet;
        Insert: Omit<WaaSWallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WaaSWallet, 'id' | 'created_at' | 'user_id'>>;
      };
      smart_wallets: {
        Row: SmartWallet;
        Insert: Omit<SmartWallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SmartWallet, 'id' | 'created_at' | 'user_id'>>;
      };
      sponsorships: {
        Row: Sponsorship;
        Insert: Omit<Sponsorship, 'id' | 'created_at' | 'updated_at' | 'remaining_usdc_amount' | 'status'> & { status?: Sponsorship['status'] };
        Update: Partial<Omit<Sponsorship, 'id' | 'created_at' | 'sponsor_user_id' | 'beneficiary_id' | 'waas_wallet_id'>>;
      };
      sponsorship_allowed_categories: {
        Row: SponsorshipAllowedCategory;
        Insert: Omit<SponsorshipAllowedCategory, 'id'>;
        Update: Partial<Omit<SponsorshipAllowedCategory, 'id'>>;
      };
      vendor_categories: {
        Row: VendorCategory;
        Insert: Omit<VendorCategory, 'id'>;
        Update: Partial<Omit<VendorCategory, 'id'>>;
      };
      pending_transactions: {
        Row: PendingTransaction;
        Insert: Omit<PendingTransaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PendingTransaction, 'id' | 'created_at' | 'sponsorship_id' | 'vendor_user_id' | 'beneficiary_id' | 'category_id'>>;
      };
      executed_transactions: {
        Row: ExecutedTransaction;
        Insert: Omit<ExecutedTransaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ExecutedTransaction, 'id' | 'created_at'>>;
      };
    };
    Views: {
      // Define view types if you have any
      [key: string]: never; // Or use Record<string, never>
    };
    Functions: {
      // Define function types if you have any
      [key: string]: never; // Or use Record<string, never>
    };
  };
}

// Helper type for Supabase client, if you generate types from your schema
// export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
// export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
// etc. 