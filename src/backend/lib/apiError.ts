/**
 * Custom API error class for consistent error handling
 */
export class ApiError extends Error {
  statusCode: number;
  details?: string;

  constructor(message: string, statusCode: number = 500, details?: string) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }

  /**
   * Converts the error to a format suitable for API responses
   */
  toResponse() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }

  /**
   * Factory method for creating a Bad Request error (400)
   */
  static badRequest(message: string, details?: string) {
    return new ApiError(message, 400, details);
  }

  /**
   * Factory method for creating an Unauthorized error (401)
   */
  static unauthorized(message: string = 'Authentication required', details?: string) {
    return new ApiError(message, 401, details);
  }

  /**
   * Factory method for creating a Forbidden error (403)
   */
  static forbidden(message: string = 'Insufficient permissions', details?: string) {
    return new ApiError(message, 403, details);
  }

  /**
   * Factory method for creating a Not Found error (404)
   */
  static notFound(message: string = 'Resource not found', details?: string) {
    return new ApiError(message, 404, details);
  }

  /**
   * Factory method for creating an Internal Server Error (500)
   */
  static internal(message: string = 'Internal server error', details?: string) {
    return new ApiError(message, 500, details);
  }
} 