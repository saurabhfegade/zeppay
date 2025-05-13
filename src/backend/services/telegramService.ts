import { ApiError } from '../lib/apiError';

interface TelegramMessageOptions {
  amount?: number;
  vendorName?: string;
  category?: string;
  sponsorName?: string;
  transactionDetails?: {
    id: string;
    amount: number;
    vendor: string;
    category: string;
  };
}

export class TelegramService {
  private static botToken: string = process.env.TELEGRAM_BOT_TOKEN || '';
  private static apiBaseUrl: string = 'https://api.telegram.org/bot';

  /**
   * Sends an OTP to a beneficiary via Telegram
   * 
   * @param phoneNumber Beneficiary's phone number (used to identify them in Telegram)
   * @param otp The OTP to send
   * @param options Additional options for the message
   */
  static async sendOTP(phoneNumber: string, otp: string, options: TelegramMessageOptions = {}): Promise<boolean> {
    try {
      // In a real implementation, you would have a mapping from phone numbers to Telegram chat IDs
      // For now, we'll simulate success but log what would happen
      
      if (!this.botToken) {
        console.warn('WARNING: TELEGRAM_BOT_TOKEN is not set. OTP would not be sent.');
        return true; // Simulate success for testing
      }

      const message = this.formatOTPMessage(otp, options);
      console.log(`[TELEGRAM] Would send to ${phoneNumber}: ${message}`);
      
      // If we had the chat ID, we would call the Telegram API:
      // const chatId = await this.getChatIdFromPhoneNumber(phoneNumber);
      // return await this.sendMessage(chatId, message);
      
      return true; // Simulate success for testing
    } catch (error) {
      console.error('Error sending OTP via Telegram:', error);
      return false; // Failed to send
    }
  }

  /**
   * Sends a sponsorship notification to a beneficiary
   * 
   * @param phoneNumber Beneficiary's phone number
   * @param amountUsdc Amount of USDC allocated
   * @param sponsorName Name of the sponsor
   * @param categories Array of category names
   */
  static async sendSponsorshipNotification(
    phoneNumber: string,
    amountUsdc: number,
    sponsorName: string,
    categories: string[]
  ): Promise<boolean> {
    try {
      if (!this.botToken) {
        console.warn('WARNING: TELEGRAM_BOT_TOKEN is not set. Notification would not be sent.');
        return true; // Simulate success for testing
      }

      const message = `🎉 You've received a new sponsorship!\n\n${sponsorName} has allocated ${amountUsdc} USDC for you to spend on: ${categories.join(', ')}.`;
      console.log(`[TELEGRAM] Would send to ${phoneNumber}: ${message}`);
      
      return true; // Simulate success for testing
    } catch (error) {
      console.error('Error sending sponsorship notification via Telegram:', error);
      return false; // Failed to send
    }
  }

  /**
   * Sends a transaction confirmation to a beneficiary
   * 
   * @param phoneNumber Beneficiary's phone number
   * @param transactionId Transaction ID
   * @param amountUsdc Amount of USDC spent
   * @param vendorName Name of the vendor
   * @param categoryName Category of the purchase
   */
  static async sendTransactionConfirmation(
    phoneNumber: string,
    transactionId: string,
    amountUsdc: number,
    vendorName: string,
    categoryName: string
  ): Promise<boolean> {
    try {
      if (!this.botToken) {
        console.warn('WARNING: TELEGRAM_BOT_TOKEN is not set. Confirmation would not be sent.');
        return true; // Simulate success for testing
      }

      const message = `✅ Transaction Confirmed\n\nYou just spent ${amountUsdc} USDC at ${vendorName} for ${categoryName}.\nTransaction ID: ${transactionId.substring(0, 8)}...`;
      console.log(`[TELEGRAM] Would send to ${phoneNumber}: ${message}`);
      
      return true; // Simulate success for testing
    } catch (error) {
      console.error('Error sending transaction confirmation via Telegram:', error);
      return false; // Failed to send
    }
  }

  /**
   * Formats an OTP message with transaction details
   * 
   * @param otp The OTP
   * @param options Additional message options
   * @returns Formatted message
   */
  private static formatOTPMessage(otp: string, options: TelegramMessageOptions): string {
    let message = `🔐 Your verification code is: ${otp}\n\n`;
    
    if (options.amount && options.vendorName && options.category) {
      message += `This code is for a purchase of ${options.amount} USDC at ${options.vendorName} for ${options.category}.\n\n`;
    }
    
    message += "Please share this code with the vendor to complete your transaction. The code expires in 5 minutes.";
    
    return message;
  }

  /**
   * Sends a message to a specific Telegram chat
   * 
   * @param chatId Telegram chat ID
   * @param message Message to send
   * @returns Success status
   */
  private static async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error('Error calling Telegram API:', error);
      return false;
    }
  }

  /**
   * Gets a Telegram chat ID from a phone number
   * This is a placeholder - in a real implementation, you would:
   * 1. Have a database table mapping phone numbers to Telegram chat IDs
   * 2. Implement a process for users to link their phone number to the bot
   * 
   * @param phoneNumber The phone number to lookup
   * @returns The Telegram chat ID
   */
  private static async getChatIdFromPhoneNumber(phoneNumber: string): Promise<string> {
    // Placeholder implementation - in a real app, you would look this up in your database
    throw new ApiError('Method not implemented', 501);
  }
} 