import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/backend/middlewares/auth.middleware';
import { handleError } from '@/backend/lib/error-handler';
import { SmartWalletService } from '@/backend/services/smartWalletService';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const userId = req.user?.id;
    if (!userId) {
      // This case should ideally not be reached if withAuth is working correctly and a role is required.
      res.status(401).json({ message: 'Authentication required and user ID missing.' });
      return;
    }

    const walletStatus = await SmartWalletService.getVendorSmartWalletStatus(userId);
    res.status(200).json(walletStatus);
    return;
  } catch (error) {
    handleError(error, res);
    // handleError should end the response, so we might not need a return here,
    // but it's safer to ensure the function path ends.
    return;
  }
}

export default withAuth(handler, ['vendor']); 