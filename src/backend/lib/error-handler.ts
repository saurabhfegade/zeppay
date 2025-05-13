import { NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { AuthError } from '@supabase/supabase-js';

interface AppErrorArgs {
  message: string;
  statusCode?: number;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly originalError?: unknown;
  public readonly context?: Record<string, unknown>;

  constructor({ message, statusCode = 500, originalError, context }: AppErrorArgs) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(res: NextApiResponse, error: unknown): void {
  console.error('[API Error]:', error); // Log the full error for server-side inspection

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ 
      message: error.message, 
      context: error.context,
      error: error.originalError ? String(error.originalError) : undefined,
    });
  } else if (error instanceof ZodError) {
    res.status(400).json({ 
      message: 'Validation failed', 
      errors: error.flatten().fieldErrors 
    });
  } else if (error instanceof AuthError) {
    // Supabase AuthError often has a specific status code
    const statusCode = error.status || (error.message.includes('Invalid login credentials') ? 401 : 400);
    res.status(statusCode).json({ 
      message: error.message || 'Authentication error', 
      name: error.name 
    });
  } else if (error instanceof Error) {
    res.status(500).json({ 
      message: 'An unexpected error occurred', 
      error: error.message 
    });
  } else {
    res.status(500).json({ message: 'An unknown error occurred' });
  }
} 