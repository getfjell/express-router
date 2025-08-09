import { Item, ItemQuery, paramsToQuery, PriKey, QueryParams, validatePK } from "@fjell/core";
import { Request, Response } from "express";
import { ItemRouter, ItemRouterOptions } from "./ItemRouter.js";
import { Library } from "@fjell/lib";

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
      this.logger.error('Error caught in createItem', {
        errorName: error.name,
        errorMessage: error.message,
        body: req.body
      });

      // Check if this is a validation error (from fjell-lib, custom validators, or database constraints)
      if (error.name === 'CreateValidationError' ||
        error.name === 'ValidationError' ||
        error.name === 'SequelizeValidationError' ||
        error.message?.includes('validation') ||
        error.message?.includes('Validation failed') ||
        error.message?.includes('required') ||
        error.message?.includes('must be') ||
        error.message?.includes('cannot be') ||
        error.message?.includes('notNull Violation') ||
        error.message?.includes('cannot be null') ||
        error.message?.includes('Required field')) {
        this.logger.error('Validation error in createItem', {
          error: error.message,
          body: req.body
        });
        res.status(400).json({
          success: false,
          error: error.message || 'Validation failed'
        });
      } else {
        this.logger.error('General error in createItem', {
          error: error.message,
          stack: error.stack,
          body: req.body
        });
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  };

  protected findItems = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.default('Finding Items', { query: req.query, params: req.params, locals: res.locals });

    let items: Item<S>[] = [];

    const query: ParsedQuery = req.query as unknown as ParsedQuery;
    const finder = query['finder'] as string;
    const finderParams = query['finderParams'] as string;
    const one = query['one'] as string;

    if (finder) {
      // If finder is defined?  Call a finder.
      this.logger.default('Finding Items with Finder %s %j one:%s', finder, finderParams, one);

      if (one === 'true') {
        const item = await (this.lib as any).findOne(finder, JSON.parse(finderParams));
        items = item ? [item] : [];
      } else {
        items = await libOperations.find(finder, JSON.parse(finderParams));
      }
    } else {
      // TODO: This is once of the more important places to perform some validaation and feedback
      const itemQuery: ItemQuery = paramsToQuery(req.query as QueryParams);
      this.logger.default('Finding Items with a query %j', itemQuery);
      items = await libOperations.all(itemQuery);
    }

    res.json(items.map((item: Item<S>) => validatePK(item, this.getPkType())));
  };

}
