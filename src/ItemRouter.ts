import {
  ComKey,
  cPK,
  Item,
  ItemEvent,
  ItemProperties,
  LocKey,
  LocKeyArray,
  PriKey,
  validatePK
} from "@fjell/core";
import { Instance, NotFoundError } from "@fjell/lib";
import deepmerge from "deepmerge";
import { Request, Response, Router } from "express";
import LibLogger from "./logger";

export type ItemRouterOptions = Record<string, never>;

export class ItemRouter<
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {

  protected lib: Instance<Item<S, L1, L2, L3, L4, L5>, S, L1, L2, L3, L4, L5>;
  private keyType: S;
  protected options: ItemRouterOptions;
  private childRouters: Record<string, Router> = {};
  protected logger;

  constructor(
    lib: Instance<Item<S, L1, L2, L3, L4, L5>, S, L1, L2, L3, L4, L5>,
    keyType: S,
    options: ItemRouterOptions = {}
  ) {
    this.lib = lib;
    this.keyType = keyType;
    this.options = options;
    this.logger = LibLogger.get("ItemRouter", keyType);
  }

  public getPkType = (): S => {
    return this.keyType;
  }

  protected getPkParam = (): string => {
    return `${this.getPkType()}Pk`;
  }

  protected getLk(res: Response): LocKey<S> {
    return { kt: this.keyType, lk: res.locals[this.getPkParam()] };
  }

  // this is meant to be consumed by children routers
  public getLKA(res: Response): LocKeyArray<S, L1, L2, L3, L4> {
    return [this.getLk(res)] as LocKeyArray<S, L1, L2, L3, L4>;
  }

  public getPk(res: Response): PriKey<S> {
    return cPK<S>(res.locals[this.getPkParam()], this.getPkType());
  }

  // Unless this is a contained router, the locations will always be an empty array.
  /* eslint-disable */
  protected getLocations(res: Response): LocKeyArray<L1, L2, L3, L4, L5> | [] {
    throw new Error('Method not implemented in an abstract router');
  }
  /* eslint-enable */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getIk(res: Response): PriKey<S> | ComKey<S, L1, L2, L3, L4, L5> {
    throw new Error('Method not implemented in an abstract router');
  }

  protected postAllAction = async (req: Request, res: Response) => {
    const libOptions = this.lib.definition.options;
    const libOperations = this.lib.operations;
    this.logger.debug('Posting All Action', { query: req?.query, params: req?.params, locals: res?.locals });
    const allActionKey = req.path.substring(req.path.lastIndexOf('/') + 1);
    if (!libOptions.allActions) {
      this.logger.error('Item Actions are not configured');
      res.status(500).json({ error: 'Item Actions are not configured' });
      return;
    }
    const allAction = libOptions.allActions[allActionKey];
    if (!allAction) {
      this.logger.error('All Action is not configured', { allActionKey });
      res.status(500).json({ error: 'Item Action is not configured' });
      return;
    }
    try {
      res.json(await libOperations.allAction(allActionKey, req.body));
    } catch (err: any) {
      this.logger.error('Error in All Action', { message: err?.message, stack: err?.stack });
      res.status(500).json(err);
    }
  }

  protected getAllFacet = async (req: Request, res: Response) => {
    const libOptions = this.lib.definition.options;
    const libOperations = this.lib.operations;
    this.logger.debug('Getting All Facet', { query: req?.query, params: req?.params, locals: res?.locals });
    const facetKey = req.path.substring(req.path.lastIndexOf('/') + 1);
    if (!libOptions.allFacets) {
      this.logger.error('Item Facets are not configured');
      res.status(500).json({ error: 'Item Facets are not configured' });
      return;
    }
    const facet = libOptions.allFacets[facetKey];
    if (!facet) {
      this.logger.error('Item Facet is not configured', { facetKey });
      res.status(500).json({ error: 'Item Facet is not configured' });
      return;
    }
    try {
      const combinedQueryParams = { ...req.query, ...req.params } as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>;
      res.json(await libOperations.allFacet(facetKey, combinedQueryParams));
    } catch (err: any) {
      this.logger.error('Error in All Facet', { message: err?.message, stack: err?.stack });
      res.status(500).json(err);
    }
  }

  protected postItemAction = async (req: Request, res: Response) => {
    const libOptions = this.lib.definition.options;
    const libOperations = this.lib.operations;
    this.logger.debug('Getting Item', { query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);
    const actionKey = req.path.substring(req.path.lastIndexOf('/') + 1);
    if (!libOptions.actions) {
      this.logger.error('Item Actions are not configured');
      res.status(500).json({ error: 'Item Actions are not configured' });
      return;
    }
    const action = libOptions.actions[actionKey];
    if (!action) {
      this.logger.error('Item Action is not configured', { actionKey });
      res.status(500).json({ error: 'Item Action is not configured' });
      return;
    }
    try {
      res.json(await libOperations.action(ik, actionKey, req.body));
    } catch (err: any) {
      this.logger.error('Error in Item Action', { message: err?.message, stack: err?.stack });
      res.status(500).json(err);
    }
  }

  protected getItemFacet = async (req: Request, res: Response) => {
    const libOptions = this.lib.definition.options;
    const libOperations = this.lib.operations;
    this.logger.debug('Getting Item', { query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);
    const facetKey = req.path.substring(req.path.lastIndexOf('/') + 1);
    if (!libOptions.facets) {
      this.logger.error('Item Facets are not configured');
      res.status(500).json({ error: 'Item Facets are not configured' });
      return;
    }
    const facet = libOptions.facets[facetKey];
    if (!facet) {
      this.logger.error('Item Facet is not configured', { facetKey });
      res.status(500).json({ error: 'Item Facet is not configured' });
      return;
    }
    try {
      const combinedQueryParams = { ...req.query, ...req.params } as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>;
      res.json(await libOperations.facet(ik, facetKey, combinedQueryParams));
    } catch (err: any) {
      this.logger.error('Error in Item Facet', { message: err?.message, stack: err?.stack });
      res.status(500).json(err);
    }
  }

  private configure = (router: Router) => {
    const libOptions = this.lib.definition.options;
    this.logger.debug('Configuring Router', { pkType: this.getPkType() });
    router.get('/', this.findItems);
    router.post('/', this.createItem);

    this.logger.default('All Actions supplied to Router', { allActions: libOptions.allActions });
    if (libOptions.allActions) {
      Object.keys(libOptions.allActions).forEach((actionKey) => {
        this.logger.debug('Configuring All Action %s', actionKey);
        // TODO: Ok, this is a bit of a hack, but we need to customize the types of the request handlers
        router.post(`/${actionKey}`, this.postAllAction);
      });
    }

    this.logger.default('All Facets supplied to Router', { allFacets: libOptions.allFacets });
    if (libOptions.allFacets) {
      Object.keys(libOptions.allFacets).forEach((facetKey) => {
        this.logger.debug('Configuring All Facet %s', facetKey);
        // TODO: Ok, this is a bit of a hack, but we need to customize the types of the request handlers
        router.get(`/${facetKey}`, this.getAllFacet);
      });
    }

    const itemRouter = Router();
    itemRouter.get('/', this.getItem);
    itemRouter.put('/', this.updateItem);
    itemRouter.delete('/', this.deleteItem);

    this.logger.default('Item Actions supplied to Router', { itemActions: libOptions.actions });
    if (libOptions.actions) {
      Object.keys(libOptions.actions).forEach((actionKey) => {
        this.logger.debug('Configuring Item Action %s', actionKey);
        // TODO: Ok, this is a bit of a hack, but we need to customize the types of the request handlers
        itemRouter.post(`/${actionKey}`, this.postItemAction)
      });
    }

    this.logger.default('Item Facets supplied to Router', { itemFacets: libOptions.facets });
    if (libOptions.facets) {
      Object.keys(libOptions.facets).forEach((facetKey) => {
        this.logger.debug('Configuring Item Facet %s', facetKey);
        // TODO: Ok, this is a bit of a hack, but we need to customize the types of the request handlers
        itemRouter.get(`/${facetKey}`, this.getItemFacet)
      });
    }

    this.logger.debug('Configuring Item Operations under PK Param %s', this.getPkParam());
    router.use(`/:${this.getPkParam()}`, this.validatePrimaryKeyValue, itemRouter);

    if (this.childRouters) {
      this.configureChildRouters(itemRouter, this.childRouters);
    }
    return router;
  }

  private validatePrimaryKeyValue = (req: Request, res: Response, next: any) => {
    const pkParamValue = req.params[this.getPkParam()];
    if (this.validatePKParam(pkParamValue)) {
      res.locals[this.getPkParam()] = pkParamValue;
      next();
    } else {
      this.logger.error('Invalid Primary Key', { pkParamValue, path: req?.originalUrl });
      res.status(500).json({ error: 'Invalid Primary Key', path: req?.originalUrl });
    }
  }

  private configureChildRouters = (router: Router, childRouters: Record<string, Router>) => {
    for (const path in childRouters) {
      this.logger.debug('Configuring Child Router at Path %s', path);

      router.use(`/${path}`, childRouters[path]);
    }
    return router;
  }

  public addChildRouter = (path: string, router: Router) => {
    this.childRouters[path] = router;
  }

  /* istanbul ignore next */
  public getRouter(): Router {
    const router = Router();
    this.configure(router);
    return router;
  }

  /* istanbul ignore next */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createItem = async (req: Request, res: Response): Promise<void> => {
    throw new Error('Method not implemented in an abstract router');
  };

  // TODO: Probably a better way to do this, but this postCreate hook only needs the item.
  /* istanbul ignore next */
  public postCreateItem = async (item: Item<S, L1, L2, L3, L4, L5>): Promise<Item<S, L1, L2, L3, L4, L5>> => {
    this.logger.debug('Post Create Item', { item });
    return item;
  };

  protected deleteItem = async (req: Request, res: Response): Promise<void> => {
    const libOperations = this.lib.operations;

    this.logger.debug('Deleting Item', { query: req.query, params: req.params, locals: res.locals });
    const ik = this.getIk(res);
    const removedItem = await libOperations.remove(ik);
    const item = validatePK(removedItem, this.getPkType());
    res.json(item);
  };

  /* eslint-disable */
  /* istanbul ignore next */
  protected findItems = async (req: Request, res: Response): Promise<void> => {
    throw new Error('Method not implemented in an abstract router');
  };
  /* eslint-enable */

  protected getItem = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Getting Item', { query: req.query, params: req.params, locals: res.locals });
    const ik = this.getIk(res);
    try {
      // TODO: What error does validate PK throw, when can that fail?
      const item = validatePK(await libOperations.get(ik), this.getPkType());
      res.json(item);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        this.logger.error('Item Not Found', { ik, message: err?.message, stack: err?.stack });
        res.status(404).json({
          ik,
          message: "Item Not Found",
        });
      } else {
        this.logger.error('General Error', { ik, message: err?.message, stack: err?.stack });
        res.status(500).json({
          ik,
          message: "General Error",
        });
      }
    }
  }

  protected updateItem = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Updating Item',
      { body: req?.body, query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);
    const itemToUpdate = this.convertDates(req.body as ItemProperties<S, L1, L2, L3, L4, L5>);
    const retItem = validatePK(await libOperations.update(ik, itemToUpdate), this.getPkType());
    res.json(retItem);
  };

  public convertDates = (item: Item<S, L1, L2, L3, L4, L5> | ItemProperties<S, L1, L2, L3, L4, L5>):
    Item<S, L1, L2, L3, L4, L5> | ItemProperties<S, L1, L2, L3, L4, L5> => {
    const events = item.events as Record<string, ItemEvent>;
    this.logger.debug('Converting Dates', { item });
    if (events) {
      Object.keys(events).forEach((key: string) => {
        Object.assign(events, {
          [key]: deepmerge(events[key], { at: events[key].at ? new Date(events[key].at) : null })
        });
      });
    }
    Object.assign(item, { events });
    return item;
  };

  // TODO: Maybe just simplify this and require that everything is a UUID?
  /**
   * This method might be an annoyance, but we need to capture a few cases where someone passes
   * a PK parameter that has an odd string in it.
   *
   * @param pkParamValue The value of the primary key parameter
   * @returns if the value is valid.
   */
  protected validatePKParam = (pkParamValue: string): boolean => {
    let validPkParam = true;
    if (pkParamValue.length <= 0) {
      this.logger.error('Primary Key is an Empty String', { pkParamValue });
      validPkParam = false;
    } else if (pkParamValue === 'undefined') {
      this.logger.error('Primary Key is the string \'undefined\'', { pkParamValue });
      validPkParam = false;
    }
    return validPkParam;
  }

}
