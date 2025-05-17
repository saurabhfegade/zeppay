import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/db";
import { SmartWallet } from "../../common/types/database.types";
import { ApiError } from "../lib/apiError";
import { BLOCKCHAIN_NETWORK_ID } from "../../../config"; // Import from config

// This is a server-side service that will interact with the Coinbase Wallet SDK
export class SmartWalletService {
  static NETWORK_ID = BLOCKCHAIN_NETWORK_ID || "base-sepolia"; // Fallback for safety

  /**
   * Creates a smart wallet for a vendor
   *
   * Note: This will be called during the signup process.
   * In a production environment, this would interact with a frontend component
   * that uses the Coinbase Wallet SDK to create the wallet.
   *
   * For this implementation, we're creating a mock smart wallet with a placeholder address,
   * but in production, you would use the client-side SDK to create the wallet.
   *
   * @param userId Vendor's user ID
   * @returns The created smart wallet
   */
  static async createSmartWalletForVendor(
    userId: string,
  ): Promise<SmartWallet> {
    try {
      // Check if user already has a wallet
      const { data: existingWallet } = await supabase
        .from("smart_wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingWallet) {
        return existingWallet as SmartWallet;
      }

      // In a real implementation, you would:
      // 1. Redirect the user to a page where they can create a smart wallet using the SDK
      // 2. Use the connector to create the wallet: await cbWalletConnector.connect()
      // 3. Get the wallet address from the connection

      // For now, we'll create a mock wallet with a placeholder address
      const mockAddress = `0x${Math.random().toString(16).slice(2, 42)}`;

      // Store wallet details in database
      const walletData = {
        id: uuidv4(),
        user_id: userId,
        wallet_address: mockAddress,
        network_id: this.NETWORK_ID,
        is_platform_created: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { data, error } = await supabase
        .from("smart_wallets")
        .insert(walletData)
        .select()
        .single();

      if (error) {
        console.error("Error storing smart wallet:", error);
        throw new ApiError(
          "Failed to store wallet details",
          500,
          error.message,
        );
      }

      return data as SmartWallet;
    } catch (error) {
      console.error("Error creating smart wallet:", error);
      throw new ApiError(
        "Failed to create vendor wallet",
        500,
        error instanceof Error ? error.message : undefined,
      );
    }
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
    try {
      const { data, error } = await supabase
        .from("smart_wallets")
        .select("*")
        .eq("user_id", userId)
        // If a vendor can have multiple wallets on different networks, you might need to specify network_id here
        // For now, assuming one primary wallet or the first one found for the configured network
        .eq("network_id", this.NETWORK_ID)
        .maybeSingle(); // Use maybeSingle to return null if not found, instead of error

      if (error) {
        console.error("Error fetching vendor smart wallet:", error);
        throw new ApiError("Failed to fetch smart wallet", 500, error.message);
      }
      return data;
    } catch (error) {
      console.error("Error in getVendorSmartWallet:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "Failed to retrieve smart wallet",
        500,
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  /**
   * Gets the smart wallet status for a vendor.
   *
   * @param vendorUserId Vendor's user ID
   * @returns Object indicating if a wallet exists and the wallet address if it does.
   */
  static async getVendorSmartWalletStatus(
    vendorUserId: string,
  ): Promise<{ hasWallet: boolean; walletAddress?: string | null }> {
    const { data, error } = await supabase
      .from("smart_wallets")
      .select("wallet_address")
      .eq("user_id", vendorUserId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is not an error here
      console.error("Error fetching vendor smart wallet status:", error);
      throw new ApiError(
        "Failed to fetch vendor smart wallet status",
        500,
        error.message,
      );
    }

    if (data && data.wallet_address) {
      return { hasWallet: true, walletAddress: data.wallet_address };
    }

    return { hasWallet: false };
  }

  /**
   * Registers a client-generated smart wallet for a vendor.
   *
   * @param vendorUserId Vendor's user ID
   * @param walletAddress The address of the smart wallet generated by the client SDK
   * @param networkId The network ID for the wallet
   * @returns The created smart wallet record
   */
  static async registerVendorSmartWallet(
    userId: string,
    walletAddress: string,
    networkId: string = this.NETWORK_ID, // Use static property
  ): Promise<SmartWallet> {
    try {
      // Check if user already has a wallet with the same address on the same network
      const { data: existingWalletByAddress, error: fetchError } =
        await supabase
          .from("smart_wallets")
          .select("*")
          .eq("user_id", userId)
          .eq("wallet_address", walletAddress)
          .eq("network_id", networkId)
          .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116: 0 rows
        console.error(
          "Error checking for existing smart wallet by address:",
          fetchError,
        );
        throw new ApiError(
          "Failed to check for existing smart wallet",
          500,
          fetchError.message,
        );
      }

      if (existingWalletByAddress) {
        // Optionally, update the updated_at timestamp or other details if needed
        const { data: updatedWallet, error: updateError } = await supabase
          .from("smart_wallets")
          .update({ updated_at: new Date() })
          .eq("id", existingWalletByAddress.id)
          .select()
          .single();
        if (updateError) {
          console.error(
            "Error updating existing smart wallet timestamp:",
            updateError,
          );
          // Non-critical, so we can still return the wallet
        }
        return updatedWallet || existingWalletByAddress;
      }

      // Create new smart wallet record
      const walletData = {
        id: uuidv4(),
        user_id: userId,
        wallet_address: walletAddress,
        network_id: networkId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { data, error: insertError } = await supabase
        .from("smart_wallets")
        .insert(walletData)
        .select()
        .single();

      if (insertError) {
        console.error("Error storing smart wallet:", insertError);
        throw new ApiError(
          "Failed to store smart wallet details",
          500,
          insertError.message,
        );
      }
      return data as SmartWallet;
    } catch (error) {
      console.error("Error in registerVendorSmartWallet:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "Failed to register smart wallet",
        500,
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
