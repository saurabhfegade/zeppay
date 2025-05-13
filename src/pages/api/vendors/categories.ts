import { NextApiResponse } from 'next';
import { z } from 'zod';
import { CategoryService } from '../../../backend/services/categoryService';
import { withAuth, AuthenticatedRequest } from '../../../backend/middlewares/auth.middleware';
import { validateRequestBody } from '../../../backend/validation/requestValidation';
import { ApiError } from '../../../backend/lib/apiError';

// Validate request body for POST using Zod
const UpdateCategoriesSchema = z.object({
  category_ids: z.array(z.string().uuid()),
});

type UpdateCategoriesRequest = z.infer<typeof UpdateCategoriesSchema>;

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Ensure user is authenticated and is a vendor
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Only vendors can access this endpoint' });
  }

  try {
    // GET: Get vendor's categories
    if (req.method === 'GET') {
      const categories = await CategoryService.getVendorCategories(req.user.id);
      return res.status(200).json(categories);
    }
    
    // POST: Update vendor's categories
    else if (req.method === 'POST') {
      // Validate request body
      const data = await validateRequestBody<UpdateCategoriesRequest>(UpdateCategoriesSchema, req, res);
      if (!data) return; // Response already sent by validateRequestBody

      // Update vendor's categories
      const updatedCategories = await CategoryService.updateVendorCategories(
        req.user.id,
        data.category_ids
      );

      return res.status(200).json({
        message: 'Vendor categories updated successfully',
        categories: updatedCategories,
      });
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in vendor categories API route:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message, details: error.details });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the auth middleware with vendor role requirement
export default withAuth(handler, ['vendor']); 