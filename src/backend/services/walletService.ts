import { supabase } from '../lib/db';
import { ApiError } from '../lib/apiError';
import { SmartWallet, WaasWallet } from '../../common/types/database.types';
import { v4 as uuidv4 } from 'uuid';
import { coinbaseClient } from '../lib/coinbase';

// This would come from an actual Coinbase Developer Platform SDK in production
// For hackathon purposes, we'll simulate the API calls
interface CoinbaseWalletApiClient {
  createWallet: (userId: string) => Promise<{ walletId: string, address: string }>;
  getWalletBalance: (walletId: string, address: string) => Promise<{ usdc: number, gas: number }>;
  sendTransaction: (
    sourceWalletId: string, 
    sourceAddress: string, 
    destinationAddress: string, 
    amount: number
  ) => Promise<{ transactionId: string, status: string }>;
}

// Simulated CDP client for hackathon purposes
const coinbaseWalletApi: CoinbaseWalletApiClient = {
  createWallet: async (userId: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return {
      walletId: `waas_${uuidv4()}`,
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
    };
  },
  
  getWalletBalance: async (walletId: string, address: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock balances - in a real implementation, this would query the blockchain
    return {
      usdc: 1000, // 1000 USDC
      gas: 0.1,   // 0.1 ETH (or BASE) for gas
    };
  },
  
  sendTransaction: async (sourceWalletId: string, sourceAddress: string, destinationAddress: string, amount: number) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate a successful transaction
    return {
      transactionId: `tx_${uuidv4()}`,
      status: 'pending_confirmation',
    };
  },
};

// In a real implementation, this would use Base SDKs to create and manage smart wallets
const baseSmartWalletApi = {
  createWallet: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock smart wallet address
    return {
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
    };
  },
};

export class WalletService {
  static NETWORK_ID = 'base-sepolia'; // Network ID for testnet

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
        .from('waas_wallets')
        .select('*')
        .eq('user_id', userId)
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
        .from('waas_wallets')
        .insert(walletData)
        .select()
        .single();

      if (error) {
        console.error('Error storing WaaS wallet:', error);
        throw new ApiError('Failed to store wallet details', 500, error.message);
      }

      return data as WaasWallet;
    } catch (error) {
      console.error('Error creating WaaS wallet:', error);
      throw new ApiError('Failed to create sponsor wallet', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Creates a smart wallet for a vendor
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

      // MOCK IMPLEMENTATION for testing purposes
      // In production, this would be replaced with the real Smart Wallet implementation
      console.log(`Creating mock smart wallet for vendor ${userId} for testing`);
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
   * Gets a sponsor's WaaS wallet details
   * 
   * @param userId Sponsor's user ID
   * @returns The WaaS wallet or null if not found
   */
  static async getSponsorWaasWallet(userId: string): Promise<WaasWallet | null> {
    const { data, error } = await supabase
      .from('waas_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      throw new ApiError('Failed to fetch sponsor wallet', 500, error.message);
    }

    return data as WaasWallet;
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

  /**
   * Refreshes a WaaS wallet's balances from Coinbase CDP API
   * 
   * @param walletId WaaS wallet ID (in our database)
   * @returns The updated wallet with current balances
   */
  static async refreshWaasWalletBalance(walletId: string): Promise<WaasWallet> {
    // Get wallet details
    const { data: wallet, error } = await supabase
      .from('waas_wallets')
      .select('*')
      .eq('id', walletId)
      .single();

    if (error || !wallet) {
      throw new ApiError('Wallet not found', 404, error?.message);
    }

    try {
      // Get current balances from Coinbase CDP
      const { usdc, gas } = await coinbaseClient.getWalletBalance(
        wallet.coinbase_wallet_id,
        wallet.wallet_address
      );

      // Update wallet in database
      const { data: updatedWallet, error: updateError } = await supabase
        .from('waas_wallets')
        .update({
          usdc_balance: usdc,
          gas_balance: gas,
          last_balance_sync_at: new Date(),
          updated_at: new Date(),
        })
        .eq('id', walletId)
        .select()
        .single();

      if (updateError) {
        throw new ApiError('Failed to update wallet balance', 500, updateError.message);
      }

      return updatedWallet as WaasWallet;
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
      throw new ApiError('Failed to refresh wallet balance', 500, error instanceof Error ? error.message : undefined);
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
    amountUsdc: number
  ) {
    // Get source wallet details
    const { data: sourceWallet, error: sourceError } = await supabase
      .from('waas_wallets')
      .select('*')
      .eq('id', sourceWalletId)
      .single();

    if (sourceError || !sourceWallet) {
      throw new ApiError('Source wallet not found', 404, sourceError?.message);
    }

    try {
      // Send transaction via Coinbase CDP
      const { transactionId, status, hash } = await coinbaseClient.sendTransaction(
        sourceWallet.coinbase_wallet_id,
        sourceWallet.wallet_address,
        destinationAddress,
        amountUsdc
      );

      return {
        coinbase_transaction_id: transactionId,
        status,
        onchain_transaction_hash: hash,
      };
    } catch (error) {
      console.error('Error sending USDC:', error);
      throw new ApiError('Failed to send USDC', 500, error instanceof Error ? error.message : undefined);
    }
  }
} 