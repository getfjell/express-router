import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextFunction, Request, Response } from 'express';
import { BusinessLogicError, DuplicateError, NotFoundError, ValidationError } from '@fjell/core';
import { createErrorHandler, FjellErrorHandler } from '../src/errorHandler.js';

describe('FjellErrorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let handler: FjellErrorHandler;

  beforeEach(() => {
    mockReq = {
      path: '/users/123',
      method: 'GET',
      headers: {},
      body: {},
      query: {},
      params: {}
    };

    mockRes = {
      headersSent: false,
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    mockNext = vi.fn();
  });

  describe('ActionError handling', () => {
    it('should handle NotFoundError and return 404', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      const error = new NotFoundError('User not found', 'user', 123);

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'User not found',
          context: expect.objectContaining({
            itemType: 'user'
          })
        })
      });
    });

    it('should handle ValidationError and return 400', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      const error = new ValidationError('Invalid email', ['email'], 'Use valid email format');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Invalid email',
          details: expect.objectContaining({
            validOptions: ['email']
          })
        })
      });
    });

    it('should handle DuplicateError and return 409', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      const error = new DuplicateError('User already exists', 123, 'email');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_ERROR',
          message: 'User already exists'
        })
      });
    });

    it('should handle BusinessLogicError and return 422', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      const error = new BusinessLogicError('Cannot process order', 'Check order status', false);

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'BUSINESS_LOGIC_ERROR',
          message: 'Cannot process order'
        })
      });
    });
  });

  describe('Generic error handling', () => {
    it('should handle Error with status code', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      const error: any = new Error('Bad request');
      error.status = 400;

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Bad request'
        })
      });
    });

    it('should handle unknown errors and return 500', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      const error = new Error('Something went wrong');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong'
        })
      });
    });
  });

  describe('Request context', () => {
    it('should include request ID from headers', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      mockReq.headers = { 'x-request-id': 'test-request-123' };
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          technical: expect.objectContaining({
            requestId: 'test-request-123'
          })
        })
      });
    });

    it('should generate request ID if not provided', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          technical: expect.objectContaining({
            requestId: expect.stringMatching(/^req-\d+$/)
          })
        })
      });
    });

    it('should include stack trace in development mode', () => {
      handler = new FjellErrorHandler({ includeStackTrace: true, logErrors: false });
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          technical: expect.objectContaining({
            stackTrace: expect.any(String)
          })
        })
      });
    });

    it('should not include stack trace in production mode', () => {
      handler = new FjellErrorHandler({ includeStackTrace: false, logErrors: false });
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      const call = (mockRes.json as any).mock.calls[0][0];
      expect(call.error.technical.stackTrace).toBeUndefined();
    });
  });

  describe('Headers already sent', () => {
    it('should call next() if headers already sent', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      mockRes.headersSent = true;
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('Custom error mapper', () => {
    it('should use custom error mapper if provided', () => {
      const customMapper = vi.fn().mockReturnValue({
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
        operation: { type: 'get', name: 'custom', params: {} },
        context: { itemType: 'custom' },
        technical: { timestamp: new Date().toISOString() }
      });

      handler = new FjellErrorHandler({ customErrorMapper: customMapper, logErrors: false });
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(customMapper).toHaveBeenCalledWith(error);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'CUSTOM_ERROR',
          message: 'Custom error message'
        })
      });
    });

    it('should fallback to default handling if custom mapper returns null', () => {
      const customMapper = vi.fn().mockReturnValue(null);

      handler = new FjellErrorHandler({ customErrorMapper: customMapper, logErrors: false });
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(customMapper).toHaveBeenCalledWith(error);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR'
        })
      });
    });
  });

  describe('Operation type detection', () => {
    it('should detect action operation', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      mockReq.path = '/users/123/action/approve';
      mockReq.method = 'POST';
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          operation: expect.objectContaining({
            type: 'action'
          })
        })
      });
    });

    it('should detect facet operation', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      mockReq.path = '/users/123/facet/statistics';
      mockReq.method = 'GET';
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          operation: expect.objectContaining({
            type: 'facet'
          })
        })
      });
    });

    it('should detect create operation', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      mockReq.path = '/users';
      mockReq.method = 'POST';
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          operation: expect.objectContaining({
            type: 'create'
          })
        })
      });
    });

    it('should detect update operation', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      mockReq.path = '/users/123';
      mockReq.method = 'PUT';
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          operation: expect.objectContaining({
            type: 'update'
          })
        })
      });
    });

    it('should detect remove operation', () => {
      handler = new FjellErrorHandler({ logErrors: false });
      mockReq.path = '/users/123';
      mockReq.method = 'DELETE';
      const error = new Error('Test error');

      handler.handle(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          operation: expect.objectContaining({
            type: 'remove'
          })
        })
      });
    });
  });

  describe('createErrorHandler', () => {
    it('should create error handler with default options', () => {
      const handler = createErrorHandler();
      expect(handler).toBeInstanceOf(Function);
    });

    it('should create error handler with custom options', () => {
      const handler = createErrorHandler({ includeStackTrace: false });
      expect(handler).toBeInstanceOf(Function);
    });
  });
});

