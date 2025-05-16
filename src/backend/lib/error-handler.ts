import { NextApiResponse } from 'next';
import { ApiError } from './apiError';

export function handleError(error: unknown, res: NextApiResponse) {
  if (error instanceof ApiError) {
    // If it's an ApiError, use its properties
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details && { details: error.details }), // Conditionally add details
    });
  } else if (error instanceof Error) {
    // For generic errors, log them and return a 500
    console.error('Unhandled API Error:', error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  } else {
    // For non-error exceptions
    console.error('Unhandled non-error exception:', error);
    return res.status(500).json({ message: 'An unexpected error occurred' });
  }
} 