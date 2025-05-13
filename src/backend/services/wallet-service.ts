import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "common/types/db";
import {
  createCoinbaseWaaSWallet,
  createVendorSmartWallet,
} from "backend/integrations/coinbase-client";
import { supabaseAdmin } from "backend/lib/supabase-admin"; // Correct: Import the admin client instance directly

type WaasWalletInsert = Database["public"]["Tables"]["waas_wallets"]["Insert"];
type SmartWalletInsert =
  Database["public"]["Tables"]["smart_wallets"]["Insert"];

export class WalletService {
  // Keep supabase member if needed for flexibility or testing, but initialize with admin client
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient?: SupabaseClient<Database>) {
    // Default to using the admin client if no specific client is passed
    this.supabase = supabaseClient || supabaseAdmin;
  }

  /**
   * Provisions a WaaS wallet for a sponsor user.
   * Uses the field names 'address' and 'network' as per user's recent edits.
   */
  async provisionSponsorWallet(
    userId: string,
  ): Promise<Database["public"]["Tables"]["waas_wallets"]["Row"] | null> {
    try {
      console.log(
        `[WalletService] Provisioning WaaS wallet for sponsor user: ${userId}`,
      );
      const realWalletData = await createCoinbaseWaaSWallet(userId);

      const walletInsert: WaasWalletInsert = {
        user_id: userId,
        coinbase_wallet_id: realWalletData.coinbase_wallet_id,
        address: realWalletData.address,
        network: realWalletData.network,
        usdc_balance: 0,
        gas_balance: 0,
      };

      const { data, error } = await this.supabase // Use the instance member
        .from("waas_wallets")
        .insert(walletInsert)
        .select()
        .single();

      if (error) {
        console.error(
          `[WalletService] Error inserting WaaS wallet for user ${userId}:`,
          error,
        );
        throw new Error(
          `Failed to store WaaS wallet details: ${error.message}`,
        );
      }

      console.log(
        `[WalletService] Successfully provisioned WaaS wallet for sponsor ${userId}, DB ID: ${data?.id}`,
      );
      return data;
    } catch (error) {
      console.error(
        `[WalletService] Failed to provision WaaS wallet for sponsor ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  /**
   * Provisions a Smart Wallet for a vendor user.
   * Uses the field names 'address' and 'network'. Includes 'is_platform_created'.
   */
  async provisionVendorWallet(
    userId: string,
  ): Promise<Database["public"]["Tables"]["smart_wallets"]["Row"] | null> {
    try {
      console.log(
        `[WalletService] Provisioning Smart Wallet for vendor user: ${userId}`,
      );
      const mockWalletData = await createVendorSmartWallet(userId);

      const walletInsert: SmartWalletInsert = {
        user_id: userId,
        address: mockWalletData.wallet_address, // Using 'address'
        network: mockWalletData.network_id, // Using 'network'
      };

      const { data, error } = await this.supabase // Use the instance member
        .from("smart_wallets")
        .insert(walletInsert)
        .select()
        .single();

      if (error) {
        console.error(
          `[WalletService] Error inserting Smart Wallet for user ${userId}:`,
          error,
        );
        throw new Error(
          `Failed to store Smart Wallet details: ${error.message}`,
        );
      }

      console.log(
        `[WalletService] Successfully provisioned Smart Wallet for vendor ${userId}, DB ID: ${data?.id}`,
      );
      return data;
    } catch (error) {
      console.error(
        `[WalletService] Failed to provision Smart Wallet for vendor ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }
}

// Optional: Export an instance if you prefer a singleton pattern for services
// export const walletService = new WalletService();
