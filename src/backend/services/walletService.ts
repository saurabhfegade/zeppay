import { supabase } from "../lib/db";
import { ApiError } from "../lib/apiError";
import { SmartWallet, WaasWallet } from "../../common/types/database.types";
import { v4 as uuidv4 } from "uuid";
import { coinbaseClient } from "../lib/coinbase";

// Removed unused coinbaseWalletApi mock object
// Removed baseSmartWalletApi as vendor smart wallet creation is now external

export class WalletService {
  static NETWORK_ID = "base-sepolia"; // Network ID for testnet

  /**
   * Creates a WaaS wallet for a sponsor using Coinbase Developer Platform
   *
   * @param userId Sponsor's user ID
   * @returns The created WaaS wallet
   */
  static async createWaasWalletForSponsor(userId: string): Promise<WaasWallet> {
    try {
      // Check if user already has a wallet
      const { data: existingWallet } = await supabase
        .from("waas_wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingWallet) {
        return existingWallet as WaasWallet;
      }

      // Create wallet via Coinbase CDP WaaS API
      console.log(`Creating a WaaS wallet for user ${userId} via Coinbase API`);
      const walletResponse = await coinbaseClient.createWallet(userId);

      // Log the wallet response for debugging
      console.log(`Received wallet response:`, walletResponse);

      // Store wallet details in database
      const walletData = {
        id: uuidv4(),
        user_id: userId,
        coinbase_wallet_id: walletResponse.walletId,
        wallet_address: walletResponse.address,
        network_id: walletResponse.network || this.NETWORK_ID,
        usdc_balance: 0,
        gas_balance: 0,
        last_balance_sync_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { data, error } = await supabase
        .from("waas_wallets")
        .insert(walletData)
        .select()
        .single();

      if (error) {
        console.error("Error storing WaaS wallet:", error);
        throw new ApiError(
          "Failed to store wallet details",
          500,
          error.message,
        );
      }

      return data as WaasWallet;
    } catch (error) {
      console.error("Error creating WaaS wallet:", error);
      throw new ApiError(
        "Failed to create sponsor wallet",
        500,
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  /**
   * Registers a vendor's externally connected smart wallet.
   *
   * @param userId Vendor's user ID
   * @param walletAddress The address of the smart wallet connected by the vendor
   * @param networkId The network ID of the wallet (defaults to base-sepolia)
   * @returns The registered smart wallet
   */
  static async registerVendorSmartWallet(
    userId: string,
    walletAddress: string,
    networkId: string = this.NETWORK_ID,
  ): Promise<SmartWallet> {
    try {
      // Check if user already has a wallet with the same address
      const { data: existingWalletByAddress } = await supabase
        .from("smart_wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("wallet_address", walletAddress)
        .single();

      if (existingWalletByAddress) {
        console.log(
          `Vendor ${userId} attempting to re-register existing wallet ${walletAddress}. Returning existing.`,
        );
        return existingWalletByAddress as SmartWallet;
      }

      // Check if user already has a *different* wallet registered
      const { data: existingWalletForUser } = await supabase
        .from("smart_wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingWalletForUser) {
        // This case implies the user is trying to register a new/different wallet.
        // For now, we'll throw an error to prevent multiple smart wallets per vendor.
        // A more sophisticated system might allow wallet changes or multiple wallets.
        console.error(
          `Vendor ${userId} already has wallet ${existingWalletForUser.wallet_address} and tried to register ${walletAddress}.`,
        );
        throw new ApiError(
          "Vendor already has a different smart wallet registered. Contact support to change your wallet.",
          409, // Conflict
        );
      }

      // Store wallet details in database
      const walletData: Partial<SmartWallet> = {
        id: uuidv4(),
        user_id: userId,
        wallet_address: walletAddress, // Address from frontend
        network_id: networkId,
        is_platform_created: false, // Indicates it was connected by user, not created by platform
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { data, error } = await supabase
        .from("smart_wallets")
        .insert(walletData as SmartWallet) // Cast to SmartWallet assuming all required fields are present
        .select()
        .single();

      if (error) {
        console.error("Error storing smart wallet:", error);
        throw new ApiError(
          "Failed to store vendor wallet details",
          500,
          error.message,
        );
      }

      console.log(
        `Successfully registered smart wallet ${walletAddress} for vendor ${userId}`,
      );
      return data as SmartWallet;
    } catch (error) {
      console.error("Error registering vendor smart wallet:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "Failed to register vendor wallet",
        500,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Gets a sponsor's WaaS wallet details
   *
   * @param userId Sponsor's user ID
   * @returns The WaaS wallet or null if not found
   */
  static async getSponsorWaasWallet(
    userId: string,
  ): Promise<WaasWallet | null> {
    const { data, error } = await supabase
      .from("waas_wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found
        return null;
      }
      throw new ApiError("Failed to fetch sponsor wallet", 500, error.message);
    }

    return data as WaasWallet;
  }

  /**
   * Gets a vendor's smart wallet details
   *
   * @param userId Vendor's user ID
   * @returns The smart wallet or null if not found
   */
  static async getVendorSmartWallet(
    userId: string,
  ): Promise<SmartWallet | null> {
    const { data, error } = await supabase
      .from("smart_wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found
        return null;
      }
      throw new ApiError("Failed to fetch vendor wallet", 500, error.message);
    }

    return data as SmartWallet;
  }

  /**
   * Refreshes a WaaS wallet's balances from Coinbase CDP API
   *
   * @param walletId WaaS wallet ID (in our database)
   * @returns The updated wallet with current balances
   */
  static async refreshWaasWalletBalance(walletId: string): Promise<WaasWallet> {
    // Get wallet details
    const { data: wallet, error } = await supabase
      .from("waas_wallets")
      .select("*")
      .eq("id", walletId)
      .single();

    if (error || !wallet) {
      throw new ApiError("Wallet not found", 404, error?.message);
    }

    try {
      // Get current balances from Coinbase CDP
      const { usdc, gas } = await coinbaseClient.getWalletBalance(
        wallet.coinbase_wallet_id,
        wallet.wallet_address,
      );

      // Update wallet in database
      const { data: updatedWallet, error: updateError } = await supabase
        .from("waas_wallets")
        .update({
          usdc_balance: usdc,
          gas_balance: gas,
          last_balance_sync_at: new Date(),
          updated_at: new Date(),
        })
        .eq("id", walletId)
        .select()
        .single();

      if (updateError) {
        throw new ApiError(
          "Failed to update wallet balance",
          500,
          updateError.message,
        );
      }

      return updatedWallet as WaasWallet;
    } catch (error) {
      console.error("Error refreshing wallet balance:", error);
      throw new ApiError(
        "Failed to refresh wallet balance",
        500,
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  /**
   * Sends USDC from a sponsor's WaaS wallet to a vendor's smart wallet
   *
   * @param sourceWalletId The source WaaS wallet ID (in our database)
   * @param destinationAddress The destination smart wallet address
   * @param amountUsdc The amount of USDC to send
   * @returns Transaction details
   */
  static async sendUsdc(
    sourceWalletId: string,
    destinationAddress: string,
    amountUsdc: number,
  ) {
    // Get source wallet details
    const { data: sourceWallet, error: sourceError } = await supabase
      .from("waas_wallets")
      .select("*")
      .eq("id", sourceWalletId)
      .single();

    if (sourceError || !sourceWallet) {
      throw new ApiError("Source wallet not found", 404, sourceError?.message);
    }

    try {
      // Send transaction via Coinbase CDP
      const { transactionId, status, hash } =
        await coinbaseClient.sendTransaction(
          sourceWallet.coinbase_wallet_id,
          sourceWallet.wallet_address,
          destinationAddress,
          amountUsdc,
        );

      return {
        coinbase_transaction_id: transactionId,
        status,
        onchain_transaction_hash: hash,
      };
    } catch (error) {
      console.error("Error sending USDC:", error);
      throw new ApiError(
        "Failed to send USDC",
        500,
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
