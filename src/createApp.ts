import express, { Express } from 'express';
import { ErrorHandlerOptions } from './errorHandler.js';

export interface FjellAppOptions {
  errorHandler?: ErrorHandlerOptions;
  jsonLimit?: string;
  urlencoded?: boolean;
  cors?: boolean | any;
}

/**
 * Create an Express app configured for Fjell with standard middleware
 */
export function createFjellApp(options: FjellAppOptions = {}): Express {
  const app = express();

  // Standard middleware
  app.use(express.json({ limit: options.jsonLimit || '10mb' }));
  
  if (options.urlencoded !== false) {
    app.use(express.urlencoded({ extended: true }));
  }

  if (options.cors) {
    // Dynamic import for optional CORS dependency
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cors = require('cors');
      app.use(cors(options.cors === true ? {} : options.cors));
    } catch {
      console.warn('CORS requested but cors package not installed. Run: npm install cors');
    }
  }

  // Add request ID middleware
  app.use((req, res, next) => {
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
  });

  return app;
}

