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
import { Operations } from "@fjell/lib";
import deepmerge from "deepmerge";
import { Request, RequestHandler, Response, Router } from "express";
import LibLogger from "./logger";

export type ItemRouterOptions = Record<string, never>;

// TODO: body is in the request, it's not needed in the parameters
export type ActionMethod = <
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(req: Request, res: Response, item: Item<S, L1, L2, L3, L4, L5>, params: any, body: any) =>
  Promise<Item<S, L1, L2, L3, L4, L5>>;

// TODO: body is in the request, it's not needed in the parameters
export type AllActionMethods = Array<RequestHandler>;

export class ItemRouter<
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {

  protected lib: Operations<Item<S, L1, L2, L3, L4, L5>, S, L1, L2, L3, L4, L5>;
  private keyType: S;
  protected options: ItemRouterOptions;
  private childRouters: Record<string, Router> = {};
  private logger;
  private itemActions: Record<string, ActionMethod> | undefined;

  constructor(
    lib: Operations<Item<S, L1, L2, L3, L4, L5>, S, L1, L2, L3, L4, L5>,
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

  protected postItemAction = async (req: Request, res: Response) => {
    this.logger.default('Getting Item', { query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);
    const actionKey = req.path.substring(req.path.lastIndexOf('/') + 1);
    if (!this.itemActions) {
      this.logger.error('Item Actions are not configured');
      return res.status(500).json({ error: 'Item Actions are not configured' });
    }
    try {
      const item =
          validatePK(await this.lib.get(ik), this.getPkType()) as Item<S, L1, L2, L3, L4, L5>;
      return res.json(await this.itemActions[actionKey](req, res, item, req.params, req.body));
    } catch (err: any) {
      this.logger.error('Error in Item Action', { message: err?.message, stack: err?.stack });
      return res.status(500).json(err);
    }
  }

  private configure = (router: Router) => {
    this.logger.default('Configuring Router', { pkType: this.getPkType() });
    router.get('/', this.findItems);
    router.post('/', this.createItem);

    const allActions = this.configureAllActions();
    this.logger.info('All Actions supplied to Router', { allActions });
    if (allActions) {
      Object.keys(allActions).forEach((actionKey) => {
        this.logger.default('Configuring All Action', { actionKey });
        // TODO: Ok, this is a bit of a hack, but we need to customize the types of the request handlers
        router.post(`/${actionKey}`, ...allActions[actionKey]);
      });
    }

    const itemRouter = Router();
    itemRouter.get('/', this.getItem);
    itemRouter.put('/', this.updateItem);
    itemRouter.delete('/', this.deleteItem);

    this.itemActions = this.configureItemActions();
    this.logger.info('Item Actions supplied to Router', { itemActions:this.itemActions });
    if (this.itemActions) {
      Object.keys(this.itemActions).forEach((actionKey) => {
        this.logger.default('Configuring Item Action', { actionKey });
        // TODO: Ok, this is a bit of a hack, but we need to customize the types of the request handlers
        itemRouter.post(`/${actionKey}`, this.postItemAction)
      });
    }

    this.logger.default('Configuring Item Operations under PK Param', { pkParam: this.getPkParam() });
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
      this.logger.error('Invalid Primary Key', { pkParamValue, path: req?.path });
      res.status(500).json({ error: 'Invalid Primary Key', path: req?.path });
    }
  }

  private configureChildRouters = (router: Router, childRouters: Record<string, Router>) => {
    for (const path in childRouters) {
      this.logger.default('Configuring Child Router at Path', { path });

      router.use(`/${path}`, childRouters[path]);
    }
    return router;
  }

  public addChildRouter = (path: string, router: Router) => {
    this.childRouters[path] = router;
  }

  /* istanbul ignore next */
  protected configureItemActions(): Record<string, ActionMethod> {
    this.logger.debug('ARouter - No Item Actions Configured');
    return {};
  }

  /* istanbul ignore next */
  protected configureAllActions(): Record<string, AllActionMethods> {
    this.logger.debug('ARouter - No All Actions Configured');
    return {};
  }

  /* istanbul ignore next */
  public getRouter() {
    const router = Router();
    this.configure(router);
    return router;
  }

  /* istanbul ignore next */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createItem = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    throw new Error('Method not implemented in an abstract router');
  };

  // TODO: Probably a better way to do this, but this postCreate hook only needs the item.
  /* istanbul ignore next */
  public postCreateItem = async (item: Item<S, L1, L2, L3, L4, L5>): Promise<Item<S, L1, L2, L3, L4, L5>> => {
    this.logger.default('Post Create Item', { item });
    return item;
  };

  protected deleteItem = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    this.logger.default('Deleting Item', { query: req.query, params: req.params, locals: res.locals });
    const ik = this.getIk(res);
    const removedItem = await this.lib.remove(ik);
    const item = validatePK(removedItem, this.getPkType());
    return res.json(item);
  };

  /* eslint-disable */
  /* istanbul ignore next */
  protected findItems = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    throw new Error('Method not implemented in an abstract router');
  };
  /* eslint-enable */

  protected getItem = async (req: Request, res: Response) => {
    this.logger.default('Getting Item', { query: req.query, params: req.params, locals: res.locals });
    const ik = this.getIk(res);
    try {
      const item = validatePK(await this.lib.get(ik), this.getPkType());
      return res.json(item);
    } catch (err: any) {
      this.logger.error('Error in Get Item Returning 404', { message: err?.message, stack: err?.stack });
      return res.status(404).json(err);
    }
  }

  protected updateItem = async (req: Request, res: Response) => {
    this.logger.default('Updating Item',
      { body: req?.body, query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);
    const itemToUpdate = this.convertDates(req.body as ItemProperties<S, L1, L2, L3, L4, L5>);
    const retItem = validatePK(await this.lib.update(ik, itemToUpdate), this.getPkType());
    return res.json(retItem);
  };

  public convertDates = (item: Item<S, L1, L2, L3, L4, L5> | ItemProperties<S, L1, L2, L3, L4, L5>):
    Item<S, L1, L2, L3, L4, L5> | ItemProperties<S, L1, L2, L3, L4, L5> => {
    const events = item.events as Record<string, ItemEvent>;
    this.logger.default('Converting Dates', { item });
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
