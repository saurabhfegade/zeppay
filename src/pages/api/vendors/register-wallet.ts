import { NextApiResponse } from 'next';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/backend/middlewares/auth.middleware';
import { handleError } from '@/backend/lib/error-handler';
import { WalletService } from '@/backend/services/walletService';
import { ApiError } from '@/backend/lib/apiError';
import { SmartWalletService } from '@/backend/services/smartWalletService';

const RegisterWalletSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
  network_id: z.string().optional(), // e.g., 'base-sepolia'
});

type RegisterWalletRequest = z.infer<typeof RegisterWalletSchema>;

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required and user ID missing.' });
      return;
    }

    const validationResult = RegisterWalletSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ message: 'Invalid request body', errors: validationResult.error.flatten().fieldErrors });
      return;
    }

    const { wallet_address, network_id } = validationResult.data as RegisterWalletRequest;

    // Use the network_id from request or default from WalletService
    const finalNetworkId = network_id || WalletService.NETWORK_ID;

    const newSmartWallet = await SmartWalletService.registerVendorSmartWallet(userId, wallet_address, finalNetworkId);
    res.status(201).json(newSmartWallet);
    return;

  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
        // Specific handling for 409 (Conflict) errors from WalletService
        res.status(409).json({ message: error.message, details: error.details });
        return;
    }
    handleError(error, res);
    return;
  }
}

export default withAuth(handler, ['vendor']); 