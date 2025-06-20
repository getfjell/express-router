import { Item, ItemQuery, paramsToQuery, PriKey, QueryParams, validatePK } from "@fjell/core";
import { Primary } from "@fjell/lib";
import { ItemRouter, ItemRouterOptions } from "@/ItemRouter";
import { Request, Response } from "express";
import LibLogger from "@/logger";

const logger = LibLogger.get('PItemRouter');

interface ParsedQuery {
  [key: string]: undefined | string | string[] | ParsedQuery | ParsedQuery[];
}

export class PItemRouter<T extends Item<S>, S extends string> extends ItemRouter<S> {

  constructor(lib: Primary.Operations<T, S>, keyType: S, options: ItemRouterOptions = {}) {
    super(lib, keyType, options);
  }

  public getIk(res: Response): PriKey<S> {
    const pri = this.getPk(res) as PriKey<S>;
    return pri
  }

  public createItem = async (req: Request, res: Response) => {
    logger.default('Creating Item 2', { body: req.body, query: req.query, params: req.params, locals: res.locals });
    const itemToCreate = this.convertDates(req.body as Item<S>);
    let item =
      validatePK(await this.lib.create(itemToCreate), this.getPkType()) as Item<S>;
    item = await this.postCreateItem(item);
    res.json(item);
  };

  protected findItems = async (req: Request, res: Response) => {
    logger.default('Finding Items', { query: req.query, params: req.params, locals: res.locals });

    let items: Item<S>[] = [];

    const query: ParsedQuery = req.query as unknown as ParsedQuery;
    const finder = query['finder'] as string;
    const finderParams = query['finderParams'] as string;

    if (finder) {
      // If finder is defined?  Call a finder.
      logger.default('Finding Items with a finder', { finder, finderParams });
      items = await this.lib.find(finder, JSON.parse(finderParams));
    } else {
      logger.default('Finding Items with a query', { query: req.query });
      // TODO: This is once of the more important places to perform some validaation and feedback
      const itemQuery: ItemQuery = paramsToQuery(req.query as QueryParams);
      items = await this.lib.all(itemQuery);
    }

    res.json(items.map((item: Item<S>) => validatePK(item, this.getPkType())));
  };

}
