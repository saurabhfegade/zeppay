import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/db';
import { SmartWallet } from '../../common/types/database.types';
import { ApiError } from '../lib/apiError';
import { cbWalletConnector } from '../../common/lib/wagmi';

// This is a server-side service that will interact with the Coinbase Wallet SDK
export class SmartWalletService {
  static NETWORK_ID = 'base-sepolia'; // Network ID for testnet

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
  static async createSmartWalletForVendor(userId: string): Promise<SmartWallet> {
    try {
      // Check if user already has a wallet
      const { data: existingWallet } = await supabase
        .from('smart_wallets')
        .select('*')
        .eq('user_id', userId)
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
        .from('smart_wallets')
        .insert(walletData)
        .select()
        .single();

      if (error) {
        console.error('Error storing smart wallet:', error);
        throw new ApiError('Failed to store wallet details', 500, error.message);
      }

      return data as SmartWallet;
    } catch (error) {
      console.error('Error creating smart wallet:', error);
      throw new ApiError('Failed to create vendor wallet', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Gets a vendor's smart wallet details
   * 
   * @param userId Vendor's user ID
   * @returns The smart wallet or null if not found
   */
  static async getVendorSmartWallet(userId: string): Promise<SmartWallet | null> {
    const { data, error } = await supabase
      .from('smart_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      throw new ApiError('Failed to fetch vendor wallet', 500, error.message);
    }

    return data as SmartWallet;
  }
} 