import { Item, ItemQuery, paramsToQuery, PriKey, QueryParams, validatePK } from "@fjell/core";
import { Primary } from "@fjell/lib";
import { ItemRouter, ItemRouterOptions } from "@/ItemRouter";
import { Request, Response } from "express";

interface ParsedQuery {
  [key: string]: undefined | string | string[] | ParsedQuery | ParsedQuery[];
}

export class PItemRouter<T extends Item<S>, S extends string> extends ItemRouter<S> {

  constructor(lib: Primary.Instance<T, S>, keyType: S, options: ItemRouterOptions = {}) {
    super(lib as any, keyType, options);
  }

  public getIk(res: Response): PriKey<S> {
    const pri = this.getPk(res) as PriKey<S>;
    return pri
  }

  public createItem = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Creating Item', { body: req.body, query: req.query, params: req.params, locals: res.locals });
    const itemToCreate = this.convertDates(req.body as Item<S>);
    let item = validatePK(await libOperations.create(itemToCreate), this.getPkType()) as Item<S>;
    item = await this.postCreateItem(item);
    this.logger.debug('Created Item %j', item);
    res.json(item);
  };

  protected findItems = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Finding Items', { query: req.query, params: req.params, locals: res.locals });

    let items: Item<S>[] = [];

    const query: ParsedQuery = req.query as unknown as ParsedQuery;
    const finder = query['finder'] as string;
    const finderParams = query['finderParams'] as string;
    const one = query['one'] as string;

    if (finder) {
      // If finder is defined?  Call a finder.
      this.logger.debug('Finding Items with Finder %s %j one:%s', finder, finderParams, one);

      if (one === 'true') {
        const item = await (this.lib as any).findOne(finder, JSON.parse(finderParams));
        items = item ? [item] : [];
      } else {
        items = await libOperations.find(finder, JSON.parse(finderParams));
      }
    } else {
      // TODO: This is once of the more important places to perform some validaation and feedback
      const itemQuery: ItemQuery = paramsToQuery(req.query as QueryParams);
      this.logger.debug('Finding Items with a query %j', itemQuery);
      items = await libOperations.all(itemQuery);
    }

    res.json(items.map((item: Item<S>) => validatePK(item, this.getPkType())));
  };

}
