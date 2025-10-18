import { ErrorInfo } from '@fjell/core';

/**
 * Successful API response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Error API response structure
 */
export interface ErrorResponse {
  success: false;
  error: ErrorInfo;
}

/**
 * Generic API response type
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

