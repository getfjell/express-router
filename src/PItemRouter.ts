import { AllOptions, FindOperationResult, FindOptions, Item, ItemQuery, paramsToQuery, PriKey, QueryParams, validatePK } from "@fjell/core";
import { Request, Response } from "express";
import { ItemRouter, ItemRouterOptions } from "./ItemRouter.js";
import { Library, NotFoundError } from "@fjell/lib";

interface ParsedQuery {
  [key: string]: undefined | string | string[] | ParsedQuery | ParsedQuery[];
}

export class PItemRouter<T extends Item<S>, S extends string> extends ItemRouter<S> {

  constructor(lib: Library<T, S>, keyType: S, options: ItemRouterOptions<S, never, never, never, never, never> = {}) {
    super(lib as any, keyType, options);
  }

  public getIk(res: Response): PriKey<S> {
    const pri = this.getPk(res) as PriKey<S>;
    return pri
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createItem = async (req: Request, res: Response, next?: any) => {
    const libOperations = this.lib.operations;
    this.logger.default('Creating Item', { body: req.body, query: req.query, params: req.params, locals: res.locals });

    try {
      const itemToCreate = this.convertDates(req.body as Item<S>);
      let item = validatePK(await libOperations.create(itemToCreate), this.getPkType()) as Item<S>;
      item = await this.postCreateItem(item);
      this.logger.default('Created Item %j', item);
      res.status(201).json(item);
    } catch (error: any) {
      // Check for validation errors - check multiple patterns
      // Also check error.cause since errors may be wrapped
      const originalError = error?.cause || error;

      // Log error details for debugging
      this.logger.error('Error in createItem', {
        error,
        errorName: error?.name,
        errorMessage: error?.message,
        originalErrorName: originalError?.name,
        originalErrorMessage: originalError?.message,
        errorCode: error?.errorInfo?.code,
        originalErrorCode: originalError?.errorInfo?.code
      });
      const isValidationError =
        error.name === 'CreateValidationError' ||
        originalError?.name === 'CreateValidationError' ||
        error.name === 'ValidationError' ||
        originalError?.name === 'ValidationError' ||
        error.name === 'SequelizeValidationError' ||
        originalError?.name === 'SequelizeValidationError' ||
        error?.errorInfo?.code === 'VALIDATION_ERROR' ||
        originalError?.errorInfo?.code === 'VALIDATION_ERROR' ||
        (error.message && (
          error.message.includes('validation') ||
          error.message.includes('required') ||
          error.message.includes('cannot be null') ||
          error.message.includes('notNull Violation') ||
          error.message.includes('Required field') ||
          error.message.includes('Referenced item does not exist') ||
          error.message.includes('Foreign key constraint') ||
          error.message.includes('Operation failed') ||
          error.message.includes('preCreate') ||
          error.message.includes('preUpdate') ||
          error.message.includes('Create Validation Failed')
        )) ||
        (originalError?.message && (
          originalError.message.includes('validation') ||
          originalError.message.includes('required') ||
          originalError.message.includes('cannot be null') ||
          originalError.message.includes('notNull Violation') ||
          originalError.message.includes('Required field') ||
          originalError.message.includes('Referenced item does not exist') ||
          originalError.message.includes('Foreign key constraint') ||
          originalError.message.includes('preCreate') ||
          originalError.message.includes('preUpdate') ||
          originalError.message.includes('Create Validation Failed')
        ));

      if (isValidationError) {
        const errorMessage = originalError?.message || error.message || "Validation failed";
        res.status(400).json({ success: false, error: errorMessage });
      } else {
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
      }
    }
  };

  protected findItems = async (req: Request, res: Response) => {
    console.log('=== FIND ITEMS CALLED ===');
    console.log('Query:', JSON.stringify(req.query));
    console.log('Path:', req.path);
    console.log('Method:', req.method);

    const libOperations = this.lib.operations;
    this.logger.default('Finding Items', { query: req.query, params: req.params, locals: res.locals });

    try {
      const query: ParsedQuery = req.query as unknown as ParsedQuery;
      const finder = query['finder'] as string;
      const finderParams = query['finderParams'] as string;
      const one = query['one'] as string;

      if (finder) {
        // If finder is defined?  Call a finder.
        console.log('=== FINDER REQUEST ===');
        console.log('Finder:', finder);
        console.log('Finder Params:', finderParams);
        console.log('One:', one);
        this.logger.default('Finding Items with Finder %s %j one:%s', finder, finderParams, one);

        let parsedParams: any;
        try {
          parsedParams = finderParams ? JSON.parse(finderParams) : {};
        } catch (parseError: any) {
          res.status(400).json({
            error: 'Invalid JSON in finderParams',
            message: parseError.message
          });
          return;
        }

        // Parse pagination options from query parameters
        const findOptions: FindOptions | undefined =
          (req.query.limit || req.query.offset) ? {
            ...(req.query.limit && { limit: parseInt(req.query.limit as string, 10) }),
            ...(req.query.offset && { offset: parseInt(req.query.offset as string, 10) }),
          } : (void 0);

        if (one === 'true') {
          const item = await (this.lib as any).findOne(finder, parsedParams);
          // Wrap findOne result in FindOperationResult format
          const validatedItem = item ? (validatePK(item, this.getPkType()) as Item<S>) : null;
          const result: FindOperationResult<Item<S>> = {
            items: validatedItem ? [validatedItem] : [],
            metadata: {
              total: validatedItem ? 1 : 0,
              returned: validatedItem ? 1 : 0,
              offset: 0,
              hasMore: false
            }
          };
          res.json(result);
        } else {
          // Call find() with pagination options - it returns FindOperationResult
          console.log('=== CALLING libOperations.find ===');
          console.log('Finder:', finder);
          console.log('Parsed Params:', JSON.stringify(parsedParams));
          console.log('Find Options:', JSON.stringify(findOptions));

          let result: FindOperationResult<Item<S>>;
          try {
            console.log('About to call libOperations.find...');
            result = await libOperations.find(finder, parsedParams, [], findOptions);
            console.log('libOperations.find SUCCESS - got result:', {
              itemCount: result?.items?.length,
              total: result?.metadata?.total
            });
          } catch (findError: any) {
            console.error('=== ERROR IN libOperations.find ===');
            console.error('Error:', findError);
            console.error('Error Message:', findError?.message);
            console.error('Error Stack:', findError?.stack);
            this.logger.error('Error calling libOperations.find', {
              finder,
              parsedParams,
              findOptions,
              errorMessage: findError?.message,
              errorName: findError?.name,
              errorStack: findError?.stack,
              errorCause: findError?.cause
            });
            throw findError;
          }

          // Validate items - validatePK can handle arrays
          console.log('=== VALIDATING ITEMS ===');
          console.log('Item count:', result.items?.length);

          let validatedItems: Item<S>[];
          try {
            validatedItems = validatePK(result.items, this.getPkType()) as Item<S>[];
            console.log('Validation SUCCESS - validated items:', validatedItems.length);
          } catch (validationError: any) {
            console.error('=== ERROR IN VALIDATION ===');
            console.error('Validation Error:', validationError);
            console.error('Error Message:', validationError?.message);
            console.error('Error Stack:', validationError?.stack);
            this.logger.error('Error validating items from find result', {
              finder,
              itemCount: result.items?.length,
              firstItem: result.items?.[0],
              errorMessage: validationError?.message,
              errorName: validationError?.name,
              errorStack: validationError?.stack
            });
            throw validationError;
          }

          console.log('=== SENDING RESPONSE ===');
          console.log('Items:', validatedItems.length);
          console.log('Metadata:', JSON.stringify(result.metadata));

          res.json({
            items: validatedItems,
            metadata: result.metadata
          });

          console.log('=== RESPONSE SENT ===');
        }
      } else {
        // TODO: This is once of the more important places to perform some validaation and feedback
        const itemQuery: ItemQuery = paramsToQuery(req.query as QueryParams);
        this.logger.default('Finding Items with a query %j', itemQuery);

        // Parse pagination options from query params
        const allOptions: AllOptions = {};
        if (req.query.limit) {
          allOptions.limit = parseInt(req.query.limit as string, 10);
        }
        if (req.query.offset) {
          allOptions.offset = parseInt(req.query.offset as string, 10);
        }

        // libOperations.all() now returns AllOperationResult<V>
        const result = await libOperations.all(itemQuery, [], allOptions);

        // Validate PKs on returned items
        const validatedItems = result.items.map((item: Item<S>) => validatePK(item, this.getPkType()));

        // Return full AllOperationResult structure with validated items
        res.json({
          items: validatedItems,
          metadata: result.metadata
        });
      }
    } catch (error: any) {
      // Enhanced error logging to capture the actual error details
      const originalError = error?.cause || error;
      const errorMessage = error?.message || originalError?.message || String(error) || 'Internal server error';
      // Extract all error properties that can be serialized
      const errorProps: Record<string, any> = {};
      if (error) {
        Object.getOwnPropertyNames(error).forEach(key => {
          try {
            const value = (error as any)[key];
            // Only include serializable values
            if (typeof value !== 'function' && typeof value !== 'object') {
              errorProps[key] = value;
            } else if (key === 'stack' || key === 'message' || key === 'cause') {
              errorProps[key] = value;
            }
          } catch {
            // Skip properties that can't be accessed
          }
        });
      }

      const errorDetails = {
        errorMessage,
        errorName: error?.name || originalError?.name,
        errorCode: error?.code || originalError?.code,
        errorStack: error?.stack || originalError?.stack,
        errorString: String(error),
        errorType: error?.constructor?.name,
        errorProps,
        errorCause: error?.cause ? {
          message: error.cause?.message,
          name: error.cause?.name,
          stack: error.cause?.stack
        } : void 0,
        finder: (req.query as any)?.finder,
        finderParams: (req.query as any)?.finderParams,
        requestPath: req.path,
        requestMethod: req.method
      };

      // Log with multiple levels to ensure we see it
      // Serialize error properly - errors don't serialize well, so log each property separately
      console.error('=== ERROR IN findItems ===');
      console.error('Error object:', error);
      console.error('Error message:', errorMessage);
      console.error('Error name:', error?.name);
      console.error('Error code:', error?.code);
      console.error('Error stack:', error?.stack);
      console.error('Error cause:', error?.cause);
      console.error('Error string:', String(error));
      console.error('Full error details:', JSON.stringify(errorDetails, null, 2));
      console.error('=== END ERROR ===\n\n');

      // Log to structured logger with serializable data only (don't pass errorDetails directly)
      this.logger.error('Error in findItems', {
        errorMessage,
        errorName: errorDetails.errorName,
        errorCode: errorDetails.errorCode,
        errorStack: errorDetails.errorStack,
        errorType: errorDetails.errorType,
        errorProps: errorDetails.errorProps,
        errorCause: errorDetails.errorCause,
        finder: errorDetails.finder,
        finderParams: errorDetails.finderParams,
        requestPath: errorDetails.requestPath,
        requestMethod: errorDetails.requestMethod
      });

      if (error instanceof NotFoundError || error?.name === 'NotFoundError') {
        res.status(404).json({ error: errorMessage });
      } else {
        // Include more details in development, but keep it generic in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        res.status(500).json({
          error: errorMessage,
          ...(isDevelopment && {
            details: errorDetails.errorName,
            stack: errorDetails.errorStack
          })
        });
      }
    }
  };

}
