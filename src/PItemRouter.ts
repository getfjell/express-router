import { AllOperationResult, AllOptions, Item, ItemQuery, paramsToQuery, PriKey, QueryParams, validatePK } from "@fjell/core";
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
    const libOperations = this.lib.operations;
    this.logger.default('Finding Items', { query: req.query, params: req.params, locals: res.locals });

    try {
      const query: ParsedQuery = req.query as unknown as ParsedQuery;
      const finder = query['finder'] as string;
      const finderParams = query['finderParams'] as string;
      const one = query['one'] as string;

      if (finder) {
        // If finder is defined?  Call a finder.
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

        let items: Item<S>[] = [];
        if (one === 'true') {
          const item = await (this.lib as any).findOne(finder, parsedParams);
          items = item ? [item] : [];
        } else {
          items = await libOperations.find(finder, parsedParams);
        }

        // For finder queries, wrap in AllOperationResult format for consistency
        const validatedItems = items.map((item: Item<S>) => validatePK(item, this.getPkType()));
        const result: AllOperationResult<Item<S>> = {
          items: validatedItems,
          metadata: {
            total: validatedItems.length,
            returned: validatedItems.length,
            offset: 0,
            hasMore: false
          }
        };
        res.json(result);
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
      this.logger.error('Error in findItems', { error });
      if (error instanceof NotFoundError || error?.name === 'NotFoundError') {
        res.status(404).json({ error: error.message || 'Item not found' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  };

}
