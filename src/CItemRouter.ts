import {
  ComKey, Item, ItemQuery, LocKey, LocKeyArray, paramsToQuery, PriKey, QueryParams, validatePK
} from "@fjell/core";
import { Request, Response } from "express";
import { ItemRouter, ItemRouterOptions } from "@/ItemRouter";
import LibLogger from "@/logger";
import { Contained } from "@fjell/lib";

const logger = LibLogger.get('CItemRouter');
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

  private parentRoute: ItemRouter<L1, L2, L3, L4, L5, never>;

  constructor(
    lib: Contained.Operations<T, S, L1, L2, L3, L4, L5>,
    type: S,
    parentRoute: ItemRouter<L1, L2, L3, L4, L5, never>,
    options: ItemRouterOptions = {},
  ) {
    super(lib, type, options);
    this.parentRoute = parentRoute;
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
    lka = lka.concat(this.parentRoute.getLKA(res) as LocKey<S | L1 | L2 | L3 | L4>[]);
    return lka as LocKeyArray<S, L1, L2, L3, L4>;
  }

  public getLocations(res: Response): LocKeyArray<L1, L2, L3, L4, L5> {
    return this.parentRoute.getLKA(res) as LocKeyArray<L1, L2, L3, L4, L5>;
  }

  protected createItem = async (req: Request, res: Response) => {
    logger.trace('Creating Item 2',
      { body: req?.body, query: req?.query, params: req?.params, locals: res?.locals });
    const itemToCreate = this.convertDates(req.body as Item<S, L1, L2, L3, L4, L5>);
    let item =
      validatePK(await this.lib.create(
        itemToCreate, { locations: this.getLocations(res) }), this.getPkType()) as Item<S, L1, L2, L3, L4, L5>;
    item = await this.postCreateItem(item);
    res.json(item);
  };

  protected findItems = async (req: Request, res: Response) => {
    logger.trace('Finding Items', { query: req.query, params: req.params, locals: res.locals });

    const query: ParsedQuery = req.query as unknown as ParsedQuery;
    const finder = query['finder'] as string;
    const finderParams = query['finderParams'] as string;
    const one = query['one'] as string;

    let items: Item<S, L1, L2, L3, L4, L5>[] = [];

    if (finder) {
      // If finder is defined?  Call a finder.
      logger.trace('Finding Items with a finder', { finder, finderParams, one });

      if (one === 'true') {
        const item = await (this.lib as any).findOne(finder, JSON.parse(finderParams), this.getLocations(res));
        items = item ? [item] : [];
      } else {
        items = await this.lib.find(finder, JSON.parse(finderParams), this.getLocations(res));
      }
    } else {
      logger.trace('Finding Items with a query', { query: req.query });
      // TODO: This is once of the more important places to perform some validaation and feedback
      const itemQuery: ItemQuery = paramsToQuery(req.query as QueryParams);
      items = await this.lib.all(itemQuery, this.getLocations(res));
    }

    res.json(items.map((item: Item<S, L1, L2, L3, L4, L5>) => validatePK(item, this.getPkType())));
  };

}
