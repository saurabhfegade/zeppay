import { NextApiRequest, NextApiResponse } from 'next';
import { TelegramService } from '../../../../backend/services/telegramService';

// Track initialization state
let botInitialized = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Telegram webhook handler called, method:', req.method);
    console.log('Bot initialization state:', botInitialized);

    // Initialize bot if not already initialized
    if (!botInitialized) {
      console.log('Attempting to initialize bot...');
      const success = await TelegramService.initialize();
      botInitialized = success;
      console.log('Bot initialization result:', success);
    }

    // Handle webhook events
    if (req.method === 'POST') {
      console.log('Processing webhook POST request');
      // The bot is already handling updates through polling
      // This endpoint can be used for future webhook implementation
      res.status(200).json({ status: 'ok', initialized: botInitialized });
    } else {
      // Health check endpoint
      const isActive = await TelegramService.isActive();
      console.log('Health check - Bot active:', isActive);
      
      if (!isActive && botInitialized) {
        console.log('Bot marked as initialized but not active, reinitializing...');
        const success = await TelegramService.initialize();
        botInitialized = success;
        console.log('Reinitialization result:', success);
      }

      res.status(200).json({ 
        status: isActive ? 'healthy' : 'unhealthy',
        initialized: botInitialized,
        active: isActive
      });
    }
  } catch (error) {
    console.error('Error in Telegram webhook handler:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
      initialized: botInitialized
    });
  }
} 