import { supabase } from '../lib/db';
import { ApiError } from '../lib/apiError';
import { 
  ExecutedTransaction, 
  PendingTransaction, 
  PendingTransactionStatus,
  TransactionStatus
} from '../../common/types/database.types';
import { SponsorshipService } from './sponsorshipService';
import { WalletService } from './walletService';
import { TelegramService } from './telegramService';
// import { NotificationService } from './notificationService'; // For later telegram implementation
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class TransactionService {
  // OTP expiry time in minutes
  private static OTP_EXPIRY_MINUTES = 5;

  /**
   * Initiates a transaction from a vendor to a beneficiary
   * This is the first step in the transaction flow where the vendor selects a beneficiary and creates a transaction
   * 
   * @param vendorUserId Vendor's user ID
   * @param beneficiaryPhoneNumber Beneficiary's phone number
   * @param amountUsdc Amount of USDC to transfer
   * @param categoryId Category ID for the transaction
   * @param vendorNotes Optional notes from the vendor
   * @returns The created pending transaction with OTP details
   */
  static async initiateTransaction(
    vendorUserId: string,
    beneficiaryPhoneNumber: string,
    amountUsdc: number,
    categoryId: string,
    vendorNotes?: string
  ) {
    try {
      // Find beneficiary by phone number
      const { data: beneficiary, error: beneficiaryError } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('phone_number_for_telegram', beneficiaryPhoneNumber)
        .single();

      if (beneficiaryError || !beneficiary) {
        throw new ApiError('Beneficiary not found', 404);
      }

      // Validate category exists
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError || !category) {
        throw new ApiError('Category not found', 404);
      }

      // Validate vendor is approved for this category
      const { data: vendorCategory, error: vendorCategoryError } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('vendor_id', vendorUserId)
        .eq('category_id', categoryId)
        .single();

      if (vendorCategoryError || !vendorCategory) {
        throw new ApiError('Vendor is not approved for this category', 403);
      }

      // Find an active sponsorship for this beneficiary and category with sufficient funds
      const sponsorships = await SponsorshipService.getActiveSponsorshipsForBeneficiary(
        beneficiary.id,
        categoryId
      );

      if (!sponsorships || sponsorships.length === 0) {
        throw new ApiError('No active sponsorships found for this beneficiary and category', 404);
      }

      // Find a sponsorship with sufficient remaining USDC
      const eligibleSponsorship = sponsorships.find(s => s.remaining_usdc >= amountUsdc);
      if (!eligibleSponsorship) {
        throw new ApiError('No sponsorship with sufficient funds found', 400);
      }

      // Verify the sponsor's WaaS wallet has sufficient funds
      try {
        const waasWallet = await WalletService.refreshWaasWalletBalance(eligibleSponsorship.sponsor_waas_wallet_id);
        if (waasWallet.usdc_balance < amountUsdc) {
          throw new ApiError('Sponsor wallet has insufficient USDC balance', 400);
        }
        if (waasWallet.gas_balance <= 0) {
          throw new ApiError('Sponsor wallet has insufficient gas for transaction', 400);
        }
      } catch (error) {
        console.error('Error checking sponsor wallet balance:', error);
        throw new ApiError('Failed to verify sponsor wallet balance', 500);
      }

      // Generate OTP
      const otp = this.generateOTP();
      const otpHash = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      // Set OTP expiry time
      const now = new Date();
      const otpExpiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60000);

      // Create pending transaction
      const pendingTransactionData = {
        id: uuidv4(),
        vendor_user_id: vendorUserId,
        beneficiary_id: beneficiary.id,
        category_id: categoryId,
        selected_sponsorship_id: eligibleSponsorship.id,
        amount_usdc: amountUsdc,
        otp_hash: otpHash,
        otp_sent_at: now,
        otp_expires_at: otpExpiresAt,
        status: 'pending_otp' as PendingTransactionStatus,
        vendor_notes: vendorNotes,
        created_at: now,
      };

      const { data: pendingTransaction, error: pendingTransactionError } = await supabase
        .from('pending_transactions')
        .insert(pendingTransactionData)
        .select()
        .single();

      if (pendingTransactionError) {
        throw new ApiError('Failed to create pending transaction', 500, pendingTransactionError.message);
      }

      // Get vendor name for the OTP message
      const { data: vendorData } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', vendorUserId)
        .single();

      // Get category name for the OTP message
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();

      // Send OTP via Telegram
      const otpSent = await TelegramService.sendOTP(
        beneficiaryPhoneNumber,
        otp,
        {
          amount: amountUsdc,
          vendorName: vendorData?.display_name || 'Vendor',
          category: categoryData?.name || 'Purchase'
        }
      );

      if (!otpSent) {
        console.warn('Failed to send OTP via Telegram. Falling back to display message.');
      }

      // Return transaction details with OTP display message as fallback
      const otpDisplayMessage = `OTP: ${otp}\nAmount: ${amountUsdc} USDC\nVendor: ${vendorData?.display_name || 'Vendor'}\nCategory: ${categoryData?.name || 'Purchase'}\nExpires in: ${this.OTP_EXPIRY_MINUTES} minutes`;

      return {
        pending_transaction_id: pendingTransaction.id,
        beneficiary_phone: beneficiaryPhoneNumber,
        amount_usdc: amountUsdc,
        otp_sent_via_telegram: otpSent,
        otp_display_message: otpDisplayMessage, // Fallback message if Telegram fails
        otp_expires_at: otpExpiresAt,
        otp, // In development only, remove in production
      };
    } catch (error) {
      console.error('Error initiating transaction:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to initiate transaction', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Confirms a transaction with OTP
   * This is the second step in the transaction flow after the beneficiary provides the OTP to the vendor
   * 
   * @param pendingTransactionId Pending transaction ID
   * @param otp OTP provided by the beneficiary
   * @returns The created executed transaction
   */
  static async confirmTransaction(pendingTransactionId: string, otp: string) {
    try {
      // Get the pending transaction
      const { data: pendingTransaction, error: pendingTransactionError } = await supabase
        .from('pending_transactions')
        .select('*')
        .eq('id', pendingTransactionId)
        .single();

      if (pendingTransactionError || !pendingTransaction) {
        throw new ApiError('Pending transaction not found', 404);
      }

      // Check if transaction is still in pending_otp status
      if (pendingTransaction.status !== 'pending_otp') {
        throw new ApiError(`Transaction cannot be confirmed in status: ${pendingTransaction.status}`, 400);
      }

      // Check if OTP has expired
      const now = new Date();
      if (new Date(pendingTransaction.otp_expires_at) < now) {
        // Update pending transaction status to expired
        await supabase
          .from('pending_transactions')
          .update({ status: 'expired' })
          .eq('id', pendingTransactionId);

        throw new ApiError('OTP has expired', 400);
      }

      // Verify OTP
      const otpHash = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      if (otpHash !== pendingTransaction.otp_hash) {
        // Update pending transaction status to failed_verification
        await supabase
          .from('pending_transactions')
          .update({ status: 'failed_verification' })
          .eq('id', pendingTransactionId);

        throw new ApiError('Invalid OTP', 400);
      }

      // Update pending transaction status to otp_verified
      await supabase
        .from('pending_transactions')
        .update({ status: 'otp_verified' })
        .eq('id', pendingTransactionId);

      // CRITICAL: Re-verify sponsorship balance and wallet balance
      const { data: sponsorship, error: sponsorshipError } = await supabase
        .from('sponsorships')
        .select('*')
        .eq('id', pendingTransaction.selected_sponsorship_id)
        .single();

      if (sponsorshipError || !sponsorship) {
        throw new ApiError('Sponsorship not found', 404);
      }

      if (sponsorship.status !== 'active') {
        throw new ApiError('Sponsorship is no longer active', 400);
      }

      if (sponsorship.remaining_usdc < pendingTransaction.amount_usdc) {
        throw new ApiError('Insufficient funds in sponsorship', 400);
      }

      // Get vendor's smart wallet
      const vendorWallet = await WalletService.getVendorSmartWallet(pendingTransaction.vendor_user_id);
      if (!vendorWallet) {
        throw new ApiError('Vendor wallet not found', 404);
      }

      // Re-verify sponsor WaaS wallet balance
      try {
        const waasWallet = await WalletService.refreshWaasWalletBalance(sponsorship.sponsor_waas_wallet_id);
        if (waasWallet.usdc_balance < pendingTransaction.amount_usdc) {
          throw new ApiError('Sponsor wallet has insufficient USDC balance', 400);
        }
        if (waasWallet.gas_balance <= 0) {
          throw new ApiError('Sponsor wallet has insufficient gas for transaction', 400);
        }
      } catch (error) {
        console.error('Error checking sponsor wallet balance:', error);
        throw new ApiError('Failed to verify sponsor wallet balance', 500);
      }

      // Create executed transaction record
      const executedTransactionData = {
        id: uuidv4(),
        pending_transaction_id: pendingTransactionId,
        sponsorship_id: pendingTransaction.selected_sponsorship_id,
        source_waas_wallet_id: sponsorship.sponsor_waas_wallet_id,
        vendor_user_id: pendingTransaction.vendor_user_id,
        destination_smart_wallet_id: vendorWallet.id,
        beneficiary_id: pendingTransaction.beneficiary_id,
        category_id: pendingTransaction.category_id,
        amount_usdc_transferred: pendingTransaction.amount_usdc,
        status: 'initiated' as TransactionStatus,
        created_at: now,
        updated_at: now,
      };

      const { data: executedTransaction, error: executedTransactionError } = await supabase
        .from('executed_transactions')
        .insert(executedTransactionData)
        .select()
        .single();

      if (executedTransactionError) {
        throw new ApiError('Failed to create executed transaction record', 500, executedTransactionError.message);
      }

      // Update sponsorship balance optimistically
      await SponsorshipService.updateSponsorshipBalance(
        sponsorship.id,
        pendingTransaction.amount_usdc
      );

      // Initiate the actual USDC transfer using Coinbase CDP
      try {
        const transactionResult = await WalletService.sendUsdc(
          sponsorship.sponsor_waas_wallet_id,
          vendorWallet.wallet_address,
          pendingTransaction.amount_usdc
        );

        // Update executed transaction with Coinbase transaction details
        await supabase
          .from('executed_transactions')
          .update({
            coinbase_transaction_id: transactionResult.coinbase_transaction_id,
            status: 'pending_confirmation',
            updated_at: new Date(),
          })
          .eq('id', executedTransaction.id);

        // Get beneficiary for notification
        const { data: beneficiary } = await supabase
          .from('beneficiaries')
          .select('*')
          .eq('id', pendingTransaction.beneficiary_id)
          .single();

        // Get vendor details for notification
        const { data: vendor } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', pendingTransaction.vendor_user_id)
          .single();

        // Get category details for notification
        const { data: category } = await supabase
          .from('categories')
          .select('name')
          .eq('id', pendingTransaction.category_id)
          .single();

        // Send transaction confirmation notification via Telegram
        if (beneficiary) {
          // Send confirmation via Telegram
          await TelegramService.sendTransactionConfirmation(
            beneficiary.phone_number_for_telegram,
            executedTransaction.id,
            executedTransaction.amount_usdc_transferred,
            vendor?.display_name || 'Vendor',
            category?.name || 'Purchase',
            transactionResult.coinbase_transaction_id
          );
        }

        return {
          transaction: executedTransaction,
          message: 'Transaction confirmed and USDC transfer initiated'
        };
      } catch (error) {
        // Update executed transaction to reflect failure
        await supabase
          .from('executed_transactions')
          .update({
            status: 'platform_failed',
            platform_notes: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date(),
          })
          .eq('id', executedTransaction.id);

        // If the transaction fails, we should revert the sponsorship balance update
        // This is a simplification for the hackathon
        // In production, we'd use proper database transactions
        await supabase
          .from('sponsorships')
          .update({
            remaining_usdc: sponsorship.remaining_usdc,
            updated_at: new Date(),
          })
          .eq('id', sponsorship.id);

        throw new ApiError('Failed to execute USDC transfer', 500, error instanceof Error ? error.message : undefined);
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to confirm transaction', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Updates an executed transaction status based on blockchain confirmation
   * This would be called by a webhook handler when receiving updates from Coinbase CDP
   * 
   * @param coinbaseTransactionId Coinbase transaction ID
   * @param onchainTransactionHash On-chain transaction hash
   * @param status New transaction status
   * @returns The updated executed transaction
   */
  static async updateTransactionStatus(
    coinbaseTransactionId: string,
    onchainTransactionHash: string,
    status: TransactionStatus
  ) {
    try {
      // Find the executed transaction
      const { data: transaction, error } = await supabase
        .from('executed_transactions')
        .select('*')
        .eq('coinbase_transaction_id', coinbaseTransactionId)
        .single();

      if (error || !transaction) {
        throw new ApiError('Transaction not found', 404);
      }

      // Update the transaction status
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('executed_transactions')
        .update({
          status,
          onchain_transaction_hash: onchainTransactionHash,
          updated_at: new Date(),
        })
        .eq('id', transaction.id)
        .select()
        .single();

      if (updateError) {
        throw new ApiError('Failed to update transaction status', 500, updateError.message);
      }

      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update transaction status', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Gets transactions for a sponsor
   * 
   * @param sponsorUserId Sponsor's user ID
   * @returns Array of executed transactions with details
   */
  static async getTransactionsForSponsor(sponsorUserId: string) {
    try {
      // Get all executed transactions that were funded by this sponsor
      const { data: transactions, error } = await supabase
        .from('executed_transactions')
        .select(`
          *,
          sponsorships!inner(
            id,
            sponsor_user_id
          )
        `)
        .eq('sponsorships.sponsor_user_id', sponsorUserId);

      if (error) {
        throw new ApiError('Failed to fetch transactions', 500, error.message);
      }

      if (!transactions || transactions.length === 0) {
        return [];
      }

      // Enrich with beneficiary, vendor, and category details
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          // Get beneficiary details
          const { data: beneficiary } = await supabase
            .from('beneficiaries')
            .select('*')
            .eq('id', transaction.beneficiary_id)
            .single();

          // Get vendor details
          const { data: vendor } = await supabase
            .from('users')
            .select('id, display_name, email')
            .eq('id', transaction.vendor_user_id)
            .single();

          // Get category details
          const { data: category } = await supabase
            .from('categories')
            .select('*')
            .eq('id', transaction.category_id)
            .single();

          return {
            ...transaction,
            beneficiary,
            vendor,
            category,
          };
        })
      );

      return enrichedTransactions;
    } catch (error) {
      console.error('Error fetching transactions for sponsor:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch transactions', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Gets transactions for a vendor
   * 
   * @param vendorUserId Vendor's user ID
   * @returns Array of executed transactions with details
   */
  static async getTransactionsForVendor(vendorUserId: string) {
    try {
      // Get all executed transactions for this vendor
      const { data: transactions, error } = await supabase
        .from('executed_transactions')
        .select('*')
        .eq('vendor_user_id', vendorUserId);

      if (error) {
        throw new ApiError('Failed to fetch transactions', 500, error.message);
      }

      if (!transactions || transactions.length === 0) {
        return [];
      }

      // Enrich with beneficiary, sponsor, and category details
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          // Get beneficiary details
          const { data: beneficiary } = await supabase
            .from('beneficiaries')
            .select('*')
            .eq('id', transaction.beneficiary_id)
            .single();

          // Get sponsorship details
          const { data: sponsorship } = await supabase
            .from('sponsorships')
            .select('*, sponsor:sponsor_user_id(id, display_name, email)')
            .eq('id', transaction.sponsorship_id)
            .single();

          // Get category details
          const { data: category } = await supabase
            .from('categories')
            .select('*')
            .eq('id', transaction.category_id)
            .single();

          return {
            ...transaction,
            beneficiary,
            sponsorship,
            category,
          };
        })
      );

      return enrichedTransactions;
    } catch (error) {
      console.error('Error fetching transactions for vendor:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch transactions', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Generates a 6-digit OTP
   * 
   * @returns 6-digit OTP string
   */
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
} 