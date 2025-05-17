import { ApiError } from '../lib/apiError';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import { SponsorshipService } from '../services/sponsorshipService';
import { Category } from '../../common/types/database.types';

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
  private static bot: TelegramBot | null = null;
  private static isInitializing: boolean = false;
  private static initializationPromise: Promise<boolean> | null = null;
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  /**
   * Get the bot instance, initializing it if necessary
   */
  private static async getBot(): Promise<TelegramBot> {
    if (this.bot && await this.isActive()) {
      return this.bot;
    }

    await this.initialize();
    if (!this.bot) {
      throw new ApiError('Failed to initialize bot', 500);
    }
    return this.bot;
  }

  /**
   * Normalize phone number to consistent format
   */
  private static normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except plus sign
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // If number doesn't start with +, add it if it's an international format
    if (!normalized.startsWith('+') && normalized.length > 10) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  /**
   * Store chat ID mapping in database
   */
  private static async storeChatId(phoneNumber: string, chatId: string): Promise<boolean> {
    try {
      const normalized = this.normalizePhoneNumber(phoneNumber);
      const { error } = await this.supabase
        .from('telegram_chat_mappings')
        .upsert({
          phone_number: normalized,
          chat_id: chatId
        });

      if (error) {
        console.error('Error storing chat ID:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error storing chat ID:', error);
      return false;
    }
  }

  /**
   * Get chat ID from database
   */
  private static async getChatIdFromDb(phoneNumber: string): Promise<string | null> {
    try {
      const normalized = this.normalizePhoneNumber(phoneNumber);
      const { data, error } = await this.supabase
        .from('telegram_chat_mappings')
        .select('chat_id')
        .eq('phone_number', normalized)
        .single();

      if (error || !data) {
        console.warn(`No chat ID found for phone number: ${phoneNumber}`);
        return null;
      }

      return data.chat_id;
    } catch (error) {
      console.error('Error fetching chat ID:', error);
      return null;
    }
  }

  /**
   * Initialize the Telegram bot and set up command handlers
   */
  static async initialize(): Promise<boolean> {
    // If already initialized and polling, return
    if (this.bot) {
      try {
        const isPolling = await this.bot.isPolling();
        if (isPolling) {
          console.log('Bot already initialized and polling');
          return true;
        }
      } catch (error) {
        console.warn('Error checking polling status:', error);
      }
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.isInitializing = true;
    this.initializationPromise = new Promise(async (resolve) => {
      try {
        console.log('Initializing Telegram bot...');
        
        if (!this.botToken) {
          console.error('ERROR: TELEGRAM_BOT_TOKEN is not set in environment variables');
          throw new ApiError('TELEGRAM_BOT_TOKEN is not set', 500);
        }

        // Stop any existing bot instance
        await this.cleanup();

        // Create new bot instance
        this.bot = new TelegramBot(this.botToken, { 
          polling: true,
          filepath: false // Disable file downloads
        });
        
        // Set up command handlers
        await this.setupCommandHandlers();

        console.log('Telegram bot initialized successfully ✅');
        resolve(true);
      } catch (error) {
        console.error('Failed to initialize Telegram bot:', error);
        this.bot = null;
        resolve(false);
      } finally {
        this.isInitializing = false;
        this.initializationPromise = null;
      }
    });

    return this.initializationPromise;
  }

  /**
   * Cleanup bot resources
   */
  static async cleanup() {
    if (this.bot) {
      try {
        await (this.bot as TelegramBot).stopPolling();
        this.bot = null;
        console.log('Bot polling stopped and instance cleaned up');
      } catch (error) {
        console.error('Error during bot cleanup:', error);
      }
    }
  }

  /**
   * Set up command handlers for the bot
   */
  private static async setupCommandHandlers() {
    const bot = await this.getBot();
    if (!bot) return;

    // Clear existing handlers to prevent duplicates
    bot.removeAllListeners();

    // Handle contact sharing (phone number registration)
    bot.on('contact', async (msg) => {
      if (!msg.contact || !msg.chat) return;
      
      const chatId = msg.chat.id;
      const phoneNumber = this.normalizePhoneNumber(msg.contact.phone_number);
      
      // Store the chat ID mapping in database
      const stored = await this.storeChatId(phoneNumber, chatId.toString());
      console.log(`${stored ? 'Successfully registered' : 'Failed to register'} phone number ${phoneNumber} with chat ID ${chatId}`);
      
      // Confirm registration
      await bot.sendMessage(chatId, 
        `✅ Thank you! Your phone number has been registered.\n\n` +
        `You will now receive notifications for:\n` +
        `- New sponsorships\n` +
        `- Transaction OTPs\n` +
        `- Transaction confirmations\n\n` +
        `Use /help to see available commands.`,
        {
          reply_markup: {
            remove_keyboard: true
          }
        }
      );
    });

    // Start command
    bot.onText(/\/start/, async (msg: Message) => {
      console.log('Received /start command');
      const chatId = msg.chat.id;
      const welcomeMessage = `👋 Welcome to ZepPay!\n\n` +
        `I'll help you manage your sponsorships and transactions.\n\n` +
        `To get started, please share your phone number using the button below.\n\n` +
        `Available commands:\n` +
        `/balance - Check your available funds\n` +
        `/help - Get help with using the bot`;

      await bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
          keyboard: [[{
            text: '📱 Share Phone Number',
            request_contact: true
          }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    });

    // Help command
    bot.onText(/\/help/, async (msg: Message) => {
      console.log('Received /help command');
      const chatId = msg.chat.id;
      const helpMessage = `🤖 ZepPay Bot Help\n\n` +
        `Commands:\n` +
        `/start - Start the bot\n` +
        `/balance - Check your available funds\n` +
        `/help - Show this help message\n\n` +
        `When a vendor initiates a transaction, I'll send you an OTP to confirm it.`;

      await bot.sendMessage(chatId, helpMessage);
    });

    // Balance command
    bot.onText(/\/balance/, async (msg: Message) => {
      console.log('Received /balance command');
      const chatId = msg.chat.id;
      
      try {
        // Get phone number from chat ID
        console.log('Looking up chat ID mapping:', chatId.toString());
        const { data: mapping, error: mappingError } = await this.supabase
          .from('telegram_chat_mappings')
          .select('phone_number')
          .eq('chat_id', chatId.toString())
          .single();

        if (mappingError) {
          console.error('Error fetching chat ID mapping:', mappingError);
        }

        if (!mapping) {
          console.log('No chat ID mapping found for:', chatId);
          await bot.sendMessage(chatId, 
            `❌ Your phone number is not registered.\n\nPlease use /start to register your phone number first.`
          );
          return;
        }

        console.log('Found phone mapping:', mapping);

        // Get beneficiary ID - try both with and without plus sign
        const normalizedPhone = this.normalizePhoneNumber(mapping.phone_number);
        console.log('Looking up beneficiary with normalized phone:', normalizedPhone);
        
        // Try to find beneficiary with multiple phone formats
        const phoneFormats = [
          normalizedPhone,
          normalizedPhone.startsWith('+') ? normalizedPhone.substring(1) : `+${normalizedPhone}`,
        ];
        
        const { data: beneficiary, error: beneficiaryError } = await this.supabase
          .from('beneficiaries')
          .select('id, phone_number_for_telegram')
          .in('phone_number_for_telegram', phoneFormats)
          .single();

        if (beneficiaryError) {
          console.error('Error fetching beneficiary:', beneficiaryError);
        }

        if (!beneficiary) {
          console.log('No beneficiary found for phone formats:', phoneFormats);
          await bot.sendMessage(chatId,
            `❌ No sponsorships found.\n\nYou don't have any active sponsorships yet.`
          );
          return;
        }

        console.log('Found beneficiary:', beneficiary);

        // Get active sponsorships for the beneficiary
        console.log('Fetching active sponsorships for beneficiary ID:', beneficiary.id);
        const sponsorships = await SponsorshipService.getActiveSponsorshipsForBeneficiary(beneficiary.id);
        console.log('Found sponsorships:', JSON.stringify(sponsorships, null, 2));

        if (!sponsorships || sponsorships.length === 0) {
          console.log('No active sponsorships found for beneficiary:', beneficiary.id);
          await bot.sendMessage(chatId,
            `❌ No active sponsorships found.\n\nYou don't have any active sponsorships with remaining balance.`
          );
          return;
        }

        // Format sponsorships message
        let message = `💰 Your Available Balances\n\n`;
        
        for (const sponsorship of sponsorships) {
          const sponsorName = sponsorship.sponsor?.display_name || 'Anonymous Sponsor';
          const categories = sponsorship.categories.map((c: Category) => c.name).join(', ');
          const expiryInfo = sponsorship.expires_at 
            ? `\nExpires: ${new Date(sponsorship.expires_at).toLocaleDateString()}`
            : '';
          
          message += `From: ${sponsorName}\n` +
                    `Amount: ${sponsorship.remaining_usdc} USDC\n` +
                    `Categories: ${categories}${expiryInfo}\n\n`;
        }

        message += `Total Active Sponsorships: ${sponsorships.length}`;

        await bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Error fetching balance:', error);
        await bot.sendMessage(chatId,
          `❌ Sorry, there was an error fetching your balance. Please try again later.`
        );
      }
    });

    // Set up commands in Telegram
    await bot.setMyCommands([
      { command: 'start', description: 'Start the bot and register your phone number' },
      { command: 'balance', description: 'Check your available funds' },
      { command: 'help', description: 'Get help with using the bot' }
    ]);

    console.log('Bot command handlers set up successfully');
  }

  /**
   * Send a message to a beneficiary
   */
  private static async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const bot = await this.getBot();
      const chatId = await this.getChatIdFromDb(phoneNumber);
      
      if (!chatId) {
        console.warn(`No chat ID found for phone number: ${phoneNumber}. Please ask the beneficiary to start the bot with /start and share their phone number.`);
        return false;
      }

      await bot.sendMessage(chatId, message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Sends an OTP to a beneficiary via Telegram
   */
  static async sendOTP(phoneNumber: string, otp: string, options: TelegramMessageOptions = {}): Promise<boolean> {
    try {
      const message = this.formatOTPMessage(otp, options);
      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending OTP via Telegram:', error);
      return false;
    }
  }

  /**
   * Send a test sponsorship notification
   */
  static async sendTestSponsorshipNotification() {
    const testPhoneNumber = '+1 857-397-5585';
    const testAmount = 3;
    const testSponsor = 'Test Sponsor 112';
    const testCategories = ['Groceries'];

    console.log('Sending test sponsorship notification...');
    const result = await this.sendSponsorshipNotification(
      testPhoneNumber,
      testAmount,
      testSponsor,
      testCategories
    );

    if (result) {
      console.log('Test sponsorship notification sent successfully');
    } else {
      console.log('Failed to send test sponsorship notification. Make sure the phone number is registered with the bot.');
    }
  }

  /**
   * Sends a sponsorship notification to a beneficiary
   */
  static async sendSponsorshipNotification(
    phoneNumber: string,
    amountUsdc: number,
    sponsorName: string,
    categories: string[]
  ): Promise<boolean> {
    try {
      const message = `🎉 You've received a new sponsorship!\n\n${sponsorName} has allocated ${amountUsdc} USDC for you to spend on: ${categories.join(', ')}.`;
      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending sponsorship notification via Telegram:', error);
      return false;
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
    categoryName: string,
    cdpTransactionHash?: string
  ): Promise<boolean> {
    try {
      if (!this.botToken) {
        console.error('ERROR: TELEGRAM_BOT_TOKEN is not set. Cannot send confirmation.');
        return false;
      }

      let message = `✅ Transaction Confirmed\n\nYou just spent ${amountUsdc} USDC at ${vendorName} for ${categoryName}.\nTransaction ID: ${transactionId}`;
      if (cdpTransactionHash) {
        message += `\nCDP Transaction: ${cdpTransactionHash}`;
      }
      
      console.log(`[TELEGRAM] Sending confirmation to ${phoneNumber}: ${message}`);
      
      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending transaction confirmation via Telegram:', error);
      return false;
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
   * Checks if a phone number is registered
   */
  static async isPhoneNumberRegistered(phoneNumber: string): Promise<boolean> {
    const chatId = await this.getChatIdFromDb(phoneNumber);
    return !!chatId;
  }

  /**
   * Checks if the bot is initialized and polling
   */
  static async isActive(): Promise<boolean> {
    if (!this.bot) {
      return false;
    }

    try {
      const isPolling = await this.bot.isPolling();
      return isPolling;
    } catch (error) {
      console.warn('Error checking polling status:', error);
      return false;
    }
  }
} 