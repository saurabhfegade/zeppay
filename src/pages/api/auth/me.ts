import type { NextApiResponse } from 'next';
import { withAuth, NextApiRequestWithUser } from '../../../backend/middlewares/with-auth';
import { handleError, AppError } from '../../../backend/lib/error-handler'; // Import AppError
import type { User } from '../../../common/types/db';
import type { ApiErrorResponse, ApiSuccessResponse } from '../../../common/types/api';

async function meHandler(
  req: NextApiRequestWithUser,
  res: NextApiResponse<ApiSuccessResponse<User> | ApiErrorResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    // Use AppError for consistency with other error handling
    return handleError(res, new AppError({ message: `Method ${req.method} Not Allowed`, statusCode: 405 }));
  }

  // The user object is attached to the request by the withAuth middleware
  const { user } = req;

  // We can re-fetch or use the user object directly. For this example, we use it directly.
  // If you need to ensure the data is absolutely fresh, you might re-fetch from the DB here.
  return res.status(200).json({ success: true, data: user, message: 'Successfully fetched user details' });
}

export default withAuth(meHandler); 