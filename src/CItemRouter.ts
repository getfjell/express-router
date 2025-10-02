import {
  ComKey, Item, ItemQuery, LocKey, LocKeyArray, paramsToQuery, PriKey, QueryParams, validatePK
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
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        this.logger.error('Item Not Found for Create', { message: err?.message, stack: err?.stack });
        res.status(404).json({
          message: "Item Not Found",
        });
      } else {
        this.logger.error('General Error in Create', { message: err?.message, stack: err?.stack });
        res.status(500).json({
          message: "General Error",
        });
      }
    }
  };

  protected findItems = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    const query: ParsedQuery = req.query as unknown as ParsedQuery;
    const finder = query['finder'] as string;
    const finderParams = query['finderParams'] as string;
    const one = query['one'] as string;

    let items: Item<S, L1, L2, L3, L4, L5>[] = [];

    if (finder) {
      // If finder is defined?  Call a finder.
      this.logger.default('Finding Items with Finder', { finder, finderParams, one });

      try {
        const parsedParams = finderParams ? JSON.parse(finderParams) : {};
        if (one === 'true') {
          const item = await (this.lib as any).findOne(finder, parsedParams, this.getLocations(res));
          items = item ? [item] : [];
        } else {
          items = await libOperations.find(finder, parsedParams, this.getLocations(res));
        }
      } catch (parseError: any) {
        this.logger.error('Error parsing finderParams JSON', { finder, finderParams, error: parseError.message });
        res.status(400).json({
          error: 'Invalid JSON in finderParams',
          message: parseError.message
        });
        return;
      }
    } else {
      // TODO: This is once of the more important places to perform some validaation and feedback
      const itemQuery: ItemQuery = paramsToQuery(req.query as QueryParams);
      this.logger.default('Finding Items with Query: %j', itemQuery);
      items = await libOperations.all(itemQuery, this.getLocations(res));
      this.logger.default('Found %d Items with Query', items.length);
    }

    res.json(items.map((item: Item<S, L1, L2, L3, L4, L5>) => validatePK(item, this.getPkType())));
  };

}
