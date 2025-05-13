import { NextApiRequest, NextApiResponse } from 'next';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validates request body against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @param req Next.js API request
 * @param res Next.js API response
 * @returns The validated data if valid, or sends a 400 response and returns null if invalid
 */
export async function validateRequestBody<T>(
  schema: ZodSchema<T>,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<T | null> {
  try {
    const data = schema.parse(req.body);
    return data;
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      
      res.status(400).json({
        error: 'Invalid request data',
        details: formattedErrors,
      });
    } else {
      console.error('Validation error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
    return null;
  }
}

/**
 * Middleware for validating request bodies
 * 
 * @param schema Zod schema to validate against
 * @param handler API route handler
 * @returns Next.js API handler
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextApiRequest, res: NextApiResponse, validatedData: T) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const validatedData = await validateRequestBody(schema, req, res);
    if (validatedData) {
      return handler(req, res, validatedData);
    }
  };
} 