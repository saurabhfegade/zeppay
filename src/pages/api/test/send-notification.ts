import { NextApiRequest, NextApiResponse } from 'next';
import { TelegramService } from '../../../backend/services/telegramService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting test notification process...');
    
    // Test phone number registration status
    const testPhoneNumber = '+1 857-397-5585';
    const isRegistered = await TelegramService.isPhoneNumberRegistered(testPhoneNumber);
    console.log(`Phone number ${testPhoneNumber} registration status:`, isRegistered);

    if (!isRegistered) {
      return res.status(400).json({
        error: 'Phone number not registered',
        message: 'Please follow these steps:',
        steps: [
          '1. Open Telegram and find @ZeppayAssistBot',
          '2. Send /start command to the bot',
          '3. Use the "Share Phone Number" button that appears',
          '4. Try this test endpoint again after registration'
        ]
      });
    }
    
    // Send test notification
    console.log('Sending test notification...');
    await TelegramService.sendTestSponsorshipNotification();
    
    console.log('Test notification process completed');
    res.status(200).json({ 
      message: 'Test notification sent successfully',
      phoneNumber: testPhoneNumber,
      isRegistered: true
    });
  } catch (error) {
    console.error('Error in test notification process:', error);
    
    // Cleanup on error
    await TelegramService.cleanup();
    
    res.status(500).json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error',
      botTokenPresent: !!process.env.TELEGRAM_BOT_TOKEN
    });
  }
} 