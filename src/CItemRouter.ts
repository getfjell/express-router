import {
  AllOperationResult, AllOptions, ComKey, Item, ItemQuery, LocKey, LocKeyArray, paramsToQuery, PriKey, QueryParams, validatePK
} from "@fjell/core";
import { Library, NotFoundError } from "@fjell/lib";
import { Request, Response } from "express";
import { ItemRouter, ItemRouterOptions } from "./ItemRouter.js";

interface ParsedQuery {
  [key: string]: undefined | string | string[] | ParsedQuery | ParsedQuery[];
}

export class CItemRouter<
  T extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends ItemRouter<S, L1, L2, L3, L4, L5> {

  constructor(
    lib: Library<T, S, L1, L2, L3, L4, L5>,
    type: S,
    parentRoute: ItemRouter<L1, L2, L3, L4, L5, never>,
    options: ItemRouterOptions<S, L1, L2, L3, L4, L5> = {},
  ) {
    super(lib as any, type, options, parentRoute);
  }

  public hasParent(): boolean {
    return !!this.parentRoute;
  }

  public getIk(res: Response): ComKey<S, L1, L2, L3, L4, L5> {
    const pri = this.getPk(res) as PriKey<S>;
    const loc = this.getLocations(res) as LocKeyArray<L1, L2, L3, L4, L5>;
    return { kt: pri.kt, pk: pri.pk, loc }
  }

  public getLKA(res: Response): LocKeyArray<S, L1, L2, L3, L4> {
    /**
     * A location key array is passed to a child router to provide contextfor the items it will
     * be working with.  It is always a concatenation of "My LKA" + "Parent LKA" which will
     * bubble all the way up to the root Primary.
     */
    let lka: LocKey<S | L1 | L2 | L3 | L4>[] = [this.getLk(res)];
    lka = lka.concat(this.parentRoute!.getLKA(res) as LocKey<S | L1 | L2 | L3 | L4>[]);
    return lka as LocKeyArray<S, L1, L2, L3, L4>;
  }

  public getLocations(res: Response): LocKeyArray<L1, L2, L3, L4, L5> {
    return this.parentRoute!.getLKA(res) as LocKeyArray<L1, L2, L3, L4, L5>;
  }

  public createItem = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.default('Creating Item', { body: req?.body, query: req?.query, params: req?.params, locals: res?.locals });
    
    try {
      const itemToCreate = this.convertDates(req.body as Item<S, L1, L2, L3, L4, L5>);
      let item = validatePK(await libOperations.create(
        itemToCreate, { locations: this.getLocations(res) }), this.getPkType()) as Item<S, L1, L2, L3, L4, L5>;
      item = await this.postCreateItem(item);
      this.logger.default('Created Item %j', item);
      res.status(201).json(item);
    } catch (error: any) {
      this.logger.error('Error in createItem', { error });
      // Check for validation errors
      if (error.name === 'CreateValidationError' || error.name === 'ValidationError' ||
          error.name === 'SequelizeValidationError' ||
          (error.message && (error.message.includes('validation') ||
           error.message.includes('required') ||
           error.message.includes('cannot be null') ||
           error.message.includes('notNull Violation')))) {
        res.status(400).json({ message: "Validation Error" });
      } else {
        res.status(500).json({ message: "General Error" });
      }
    }
  };

  protected findItems = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    const query: ParsedQuery = req.query as unknown as ParsedQuery;
    const finder = query['finder'] as string;
    const finderParams = query['finderParams'] as string;
    const one = query['one'] as string;

    try {
      if (finder) {
        // If finder is defined?  Call a finder.
        this.logger.default('Finding Items with Finder', { finder, finderParams, one });

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

        let items: Item<S, L1, L2, L3, L4, L5>[] = [];
        if (one === 'true') {
          const item = await (this.lib as any).findOne(finder, parsedParams, this.getLocations(res));
          items = item ? [item] : [];
        } else {
          items = await libOperations.find(finder, parsedParams, this.getLocations(res));
        }

        // For finder queries, wrap in AllOperationResult format for consistency
        const validatedItems = items.map((item: Item<S, L1, L2, L3, L4, L5>) => validatePK(item, this.getPkType()));
        const result: AllOperationResult<Item<S, L1, L2, L3, L4, L5>> = {
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
        const locations = this.getLocations(res);
        this.logger.debug('Finding Items with Query: %j', itemQuery);
        this.logger.debug('Location keys being passed: %j', locations);
        
        // Parse pagination options from query params
        const allOptions: AllOptions = {};
        if (req.query.limit) {
          allOptions.limit = parseInt(req.query.limit as string, 10);
        }
        if (req.query.offset) {
          allOptions.offset = parseInt(req.query.offset as string, 10);
        }
        
        // libOperations.all() now returns AllOperationResult<V>
        const result = await libOperations.all(itemQuery, locations, allOptions);
        this.logger.debug('Found %d Items with Query', result.items.length);

        // Validate PKs on returned items
        const validatedItems = result.items.map((item: Item<S, L1, L2, L3, L4, L5>) => validatePK(item, this.getPkType()));
        
        // Return full AllOperationResult structure with validated items
        res.json({
          items: validatedItems,
          metadata: result.metadata
        });
      }
    } catch (error: any) {
      this.logger.error('Error in findItems', { error });
      if (error instanceof NotFoundError || error?.name === 'NotFoundError') {
        res.status(404).json({ error: error.message || 'Parent item not found' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  };

}
