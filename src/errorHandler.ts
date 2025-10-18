import { NextFunction, Request, Response } from 'express';
import { ErrorInfo, isActionError } from '@fjell/core';
import LibLogger from './logger.js';

const logger = LibLogger.get('express-router', 'errorHandler');

export interface ErrorHandlerOptions {
  includeStackTrace?: boolean;
  logErrors?: boolean;
  customErrorMapper?: (error: any) => ErrorInfo | null;
}

export class FjellErrorHandler {
  constructor(private options: ErrorHandlerOptions = {}) {
    this.options = {
      includeStackTrace: process.env.NODE_ENV === 'development',
      logErrors: true,
      ...options
    };
  }

  /**
   * Get appropriate HTTP status code for error
   */
  private getHttpStatusForError(code: string): number {
    const statusMap: Record<string, number> = {
      'VALIDATION_ERROR': 400,
      'NOT_FOUND': 404,
      'PERMISSION_ERROR': 403,
      'UNAUTHORIZED': 401,
      'BUSINESS_LOGIC_ERROR': 422,
      'ACTION_NOT_FOUND': 404,
      'DUPLICATE_ERROR': 409,
      'RATE_LIMIT_EXCEEDED': 429,
      'INTERNAL_ERROR': 500,
    };

    return statusMap[code] || 500;
  }

  /**
   * Convert generic errors to ErrorInfo structure
   */
  private convertToErrorInfo(error: any, req: Request): ErrorInfo {
    // Check if custom mapper can handle this error
    if (this.options.customErrorMapper) {
      const mapped = this.options.customErrorMapper(error);
      if (mapped) {
        return this.enhanceErrorInfo(mapped, req);
      }
    }

    // Handle common HTTP errors
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      const technical: ErrorInfo['technical'] = {
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req)
      };
      
      if (this.options.includeStackTrace && error.stack) {
        technical.stackTrace = error.stack;
      }

      return {
        code: this.getErrorCodeForStatus(status),
        message: error.message || this.getDefaultMessageForStatus(status),
        operation: {
          type: this.getOperationTypeFromRequest(req),
          name: req.path,
          params: { ...req.body, ...req.query, ...req.params }
        },
        context: {
          itemType: this.extractItemType(req.path)
        },
        technical
      };
    }

    // Default error structure
    const technical: ErrorInfo['technical'] = {
      timestamp: new Date().toISOString(),
      requestId: this.getRequestId(req)
    };
    
    if (this.options.includeStackTrace && error.stack) {
      technical.stackTrace = error.stack;
    }
    
    if (error.cause) {
      technical.cause = error.cause;
    }

    return {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      operation: {
        type: this.getOperationTypeFromRequest(req),
        name: req.path,
        params: { ...req.body, ...req.query, ...req.params }
      },
      context: {
        itemType: this.extractItemType(req.path)
      },
      technical
    };
  }

  /**
   * Enhance error info with request context
   */
  private enhanceErrorInfo(errorInfo: ErrorInfo, req: Request): ErrorInfo {
    const technical: ErrorInfo['technical'] = {
      timestamp: errorInfo.technical?.timestamp || new Date().toISOString(),
      requestId: this.getRequestId(req)
    };

    if (this.options.includeStackTrace && errorInfo.technical?.stackTrace) {
      technical.stackTrace = errorInfo.technical.stackTrace;
    }

    if (errorInfo.technical?.cause) {
      technical.cause = errorInfo.technical.cause;
    }

    return {
      ...errorInfo,
      technical
    };
  }

  /**
   * Extract operation type from request
   */
  private getOperationTypeFromRequest(req: Request): ErrorInfo['operation']['type'] {
    const path = req.path.toLowerCase();
    const method = req.method.toLowerCase();

    // Pattern matching for operation types
    if (path.includes('/action/')) return 'action';
    if (path.includes('/allaction/')) return 'allAction';
    if (path.includes('/facet/')) return 'facet';
    if (path.includes('/allfacet/')) return 'allFacet';
    if (path.includes('/find/')) return method === 'get' ? 'findOne' : 'find';
    if (path.includes('/upsert')) return 'upsert';
    
    // Method-based detection
    switch (method) {
      case 'get':
        return path.match(/\/\d+$/) ? 'get' : 'all';
      case 'post':
        return 'create';
      case 'put':
      case 'patch':
        return 'update';
      case 'delete':
        return 'remove';
      default:
        return 'get';
    }
  }

  /**
   * Extract item type from path
   */
  private extractItemType(path: string): string {
    const segments = path.split('/').filter(s => s && !s.match(/^\d+$/));
    return segments[segments.length - 1] || 'unknown';
  }

  /**
   * Get request ID from headers or generate one
   */
  private getRequestId(req: Request): string {
    return (req.headers['x-request-id'] ||
            req.headers['x-trace-id'] ||
            `req-${Date.now()}`) as string;
  }

  /**
   * Get error code for HTTP status
   */
  private getErrorCodeForStatus(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'PERMISSION_ERROR',
      404: 'NOT_FOUND',
      409: 'DUPLICATE_ERROR',
      422: 'BUSINESS_LOGIC_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
    };
    return codeMap[status] || 'INTERNAL_ERROR';
  }

  /**
   * Get default message for HTTP status
   */
  private getDefaultMessageForStatus(status: number): string {
    const messageMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return messageMap[status] || 'Error';
  }

  /**
   * Express error handler middleware
   */
  handle = (err: any, req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
      return next(err);
    }

    let errorInfo: ErrorInfo;
    let statusCode: number;

    if (isActionError(err)) {
      // This is already a structured Fjell error
      errorInfo = this.enhanceErrorInfo(err.errorInfo, req);
      statusCode = this.getHttpStatusForError(errorInfo.code);
    } else {
      // Convert to ErrorInfo structure
      errorInfo = this.convertToErrorInfo(err, req);
      statusCode = this.getHttpStatusForError(errorInfo.code);
    }

    // Log the error if configured
    if (this.options.logErrors) {
      logger.error('Request error', {
        errorInfo,
        request: {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.body,
          query: req.query,
          params: req.params
        }
      });
    }

    // Send structured error response
    res.status(statusCode).json({
      success: false,
      error: errorInfo
    });
  };
}

/**
 * Export convenience function
 */
export function createErrorHandler(options?: ErrorHandlerOptions) {
  const handler = new FjellErrorHandler(options);
  return handler.handle;
}

