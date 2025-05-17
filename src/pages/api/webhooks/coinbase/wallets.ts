import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../backend/lib/db';
import crypto from 'crypto';

/**
 * Webhook handler for Coinbase WaaS transaction status updates
 * 
 * This endpoint receives status updates from Coinbase CDP about wallet transactions
 * and updates our database records accordingly
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify the webhook signature if provided
    // In production, you should validate that the request is actually from Coinbase
    // using the webhook signature in the headers
    const signature = req.headers['x-coinbase-signature'] as string;
    const webhookSecret = process.env.COINBASE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // Verify signature with HMAC
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const calculatedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');
      
      if (calculatedSignature !== signature) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      console.warn('Webhook signature verification skipped - webhook secret not configured');
    }

    // 2. Process the webhook payload
    const webhookEvent = req.body;
    
    console.log('Received Coinbase webhook event:', 
      webhookEvent.type, 
      webhookEvent.transaction_hash || '(no tx hash)'
    );
    
    // 3. Handle different event types
    if (webhookEvent.type === 'transaction.confirmed' || webhookEvent.type === 'transaction.success') {
      await handleTransactionSuccess(webhookEvent);
    } else if (webhookEvent.type === 'transaction.failed') {
      await handleTransactionFailure(webhookEvent);
    } else {
      console.log('Unhandled webhook event type:', webhookEvent.type);
    }

    // 4. Always return success to Coinbase (to prevent retries)
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Coinbase webhook:', error);
    // Still return 200 to prevent Coinbase from retrying
    return res.status(200).json({ received: true, error: 'Error processing webhook' });
  }
}

/**
 * Handles a successful transaction
 * 
 * @param webhookEvent The webhook event data
 */
async function handleTransactionSuccess(webhookEvent: any) {
  const transactionHash = webhookEvent.transaction_hash;
  if (!transactionHash) {
    console.error('No transaction hash in success webhook');
    return;
  }
  
  try {
    // Find the executed_transaction with this coinbase_transaction_id
    const { data: transactions, error } = await supabase
      .from('executed_transactions')
      .select('*')
      .eq('coinbase_transaction_id', transactionHash);
    
    if (error) {
      console.error('Error finding transaction:', error);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.warn(`No matching transaction found for hash: ${transactionHash}`);
      return;
    }
    
    // Update the transaction status
    const { error: updateError } = await supabase
      .from('executed_transactions')
      .update({
        status: 'completed_onchain',
        onchain_transaction_hash: transactionHash,
        updated_at: new Date()
      })
      .eq('coinbase_transaction_id', transactionHash);
    
    if (updateError) {
      console.error('Error updating transaction status:', updateError);
      return;
    }
    
    console.log(`Transaction ${transactionHash} marked as completed_onchain`);
    
    // Additional logic as needed - e.g., update wallet balances
  } catch (error) {
    console.error('Error handling transaction success:', error);
  }
}

/**
 * Handles a failed transaction
 * 
 * @param webhookEvent The webhook event data
 */
async function handleTransactionFailure(webhookEvent: any) {
  const transactionHash = webhookEvent.transaction_hash;
  if (!transactionHash) {
    console.error('No transaction hash in failure webhook');
    return;
  }
  
  try {
    // Find the executed_transaction with this coinbase_transaction_id
    const { data: transactions, error } = await supabase
      .from('executed_transactions')
      .select('*')
      .eq('coinbase_transaction_id', transactionHash);
    
    if (error) {
      console.error('Error finding transaction:', error);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.warn(`No matching transaction found for hash: ${transactionHash}`);
      return;
    }
    
    // Get the first transaction
    const transaction = transactions[0];
    
    // Update the transaction status
    const { error: updateError } = await supabase
      .from('executed_transactions')
      .update({
        status: 'failed_onchain',
        updated_at: new Date(),
        platform_notes: webhookEvent.reason || 'Transaction failed on blockchain'
      })
      .eq('coinbase_transaction_id', transactionHash);
    
    if (updateError) {
      console.error('Error updating transaction status:', updateError);
      return;
    }
    
    console.log(`Transaction ${transactionHash} marked as failed_onchain`);
    
    // Revert sponsorship balance since the transaction failed
    try {
      // Find the sponsorship
      const { data: sponsorship } = await supabase
        .from('sponsorships')
        .select('*')
        .eq('id', transaction.sponsorship_id)
        .single();
      
      if (sponsorship) {
        // Revert the balance (add the amount back)
        const { error: sponsorshipError } = await supabase
          .from('sponsorships')
          .update({
            remaining_usdc: sponsorship.remaining_usdc + transaction.amount_usdc_transferred,
            updated_at: new Date()
          })
          .eq('id', transaction.sponsorship_id);
        
        if (sponsorshipError) {
          console.error('Error reverting sponsorship balance:', sponsorshipError);
        } else {
          console.log(`Reverted ${transaction.amount_usdc_transferred} USDC to sponsorship ${transaction.sponsorship_id}`);
        }
      }
    } catch (sponsorshipError) {
      console.error('Error handling sponsorship balance revert:', sponsorshipError);
    }
  } catch (error) {
    console.error('Error handling transaction failure:', error);
  }
} 