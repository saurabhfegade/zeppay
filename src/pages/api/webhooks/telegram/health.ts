import { NextApiRequest, NextApiResponse } from 'next';
import { TelegramService } from '../../../../backend/services/telegramService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if bot is initialized and polling
    const isActive = await TelegramService.isActive();
    
    if (isActive) {
      return res.status(200).json({ 
        status: 'healthy',
        message: 'Telegram bot is active and polling'
      });
    } else {
      // Try to initialize if not active
      await TelegramService.initialize();
      return res.status(200).json({ 
        status: 'recovered',
        message: 'Telegram bot was restarted and is now active'
      });
    }
  } catch (error) {
    console.error('Error checking bot health:', error);
    return res.status(500).json({ 
      status: 'unhealthy',
      error: 'Failed to verify bot status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 