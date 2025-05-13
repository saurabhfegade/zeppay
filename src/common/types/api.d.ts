export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
  pagination?: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[] | string> | string; // For Zod validation errors or general error messages
  context?: Record<string, unknown>;
  name?: string; // e.g. AuthError name
  error?: string; // original error stringified
} 