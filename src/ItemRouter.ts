import {
  ActionError,
  ComKey,
  cPK,
  Item,
  ItemEvent,
  LocKey,
  LocKeyArray,
  PriKey,
  validatePK
} from "@fjell/core";
import { NotFoundError } from "@fjell/lib";
import { Instance } from "./Instance.js";
import deepmerge from "deepmerge";
import { NextFunction, Request, Response, Router } from "express";
import LibLogger from "./logger.js";
import { createErrorHandler, ErrorHandlerOptions } from "./errorHandler.js";

/**
 * Router-level action method signature - aligned with library ActionMethod pattern
 * Takes the resolved item key, action parameters, and HTTP context
 */
export interface RouterActionMethod<
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> {
  (
    ik: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    actionParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    context: { req: Request, res: Response }
  ): Promise<any>;
}

/**
 * Router-level facet method signature - aligned with library FacetMethod pattern
 * Takes the resolved item key, facet parameters, and HTTP context
 */
export interface RouterFacetMethod<
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> {
  (
    ik: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    facetParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    context: { req: Request, res: Response }
  ): Promise<any>;
}

/**
 * Router-level all action method signature - aligned with library AllActionMethod pattern
 * Takes action parameters, optional locations, and HTTP context
 */
export interface RouterAllActionMethod<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> {
  (
    allActionParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [],
    context: { req: Request, res: Response }
  ): Promise<any>;
}

/**
 * Router-level all facet method signature - aligned with library AllFacetMethod pattern
 * Takes facet parameters, optional locations, and HTTP context
 */
export interface RouterAllFacetMethod<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> {
  (
    allFacetParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [],
    context: { req: Request, res: Response }
  ): Promise<any>;
}

export type ItemRouterOptions<
  S extends string = string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = {
  /**
   * Handlers for item actions - aligned with library operation signatures
   * The key in the Record is the action name, method receives resolved item key and parameters
   */
  actions?: Record<string, RouterActionMethod<S, L1, L2, L3, L4, L5>>;

  /**
   * Handlers for item facets - aligned with library operation signatures
   * The key in the Record is the facet name, method receives resolved item key and parameters
   */
  facets?: Record<string, RouterFacetMethod<S, L1, L2, L3, L4, L5>>;

  /**
   * Handlers for all actions - aligned with library operation signatures
   * The key in the Record is the action name, method receives parameters and optional locations
   */
  allActions?: Record<string, RouterAllActionMethod<L1, L2, L3, L4, L5>>;

  /**
   * Handlers for all facets - aligned with library operation signatures
   * The key in the Record is the facet name, method receives parameters and optional locations
   */
  allFacets?: Record<string, RouterAllFacetMethod<L1, L2, L3, L4, L5>>;

  /**
   * Error handler configuration
   */
  errorHandler?: ErrorHandlerOptions;
};

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
  protected options: ItemRouterOptions<S, L1, L2, L3, L4, L5>;
  private childRouters: Record<string, Router> = {};
  protected logger;
  protected parentRoute?: ItemRouter<L1, L2, L3, L4, L5, never>;
  protected errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;

  constructor(
    lib: Instance<Item<S, L1, L2, L3, L4, L5>, S, L1, L2, L3, L4, L5>,
    keyType: S,
    options: ItemRouterOptions<S, L1, L2, L3, L4, L5> = {},
    parentRoute?: ItemRouter<L1, L2, L3, L4, L5, never>
  ) {
    this.lib = lib;
    this.keyType = keyType;
    this.options = options;
    this.parentRoute = parentRoute;
    this.logger = LibLogger.get("ItemRouter", keyType);
    this.errorHandler = createErrorHandler(options.errorHandler);
  }

  /**
   * Wrap async route handlers to catch errors and pass to error handler
   */
  protected wrapAsync(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn.call(this, req, res, next)).catch(next);
    };
  }

  public getPkType = (): S => {
    return this.keyType;
  }

  protected getPkParam = (): string => {
    return `${this.getPkType()}Pk`;
  }

  protected getLk(res: Response): LocKey<S> {
    const pkParam = this.getPkParam();
    const lkValue = res.locals[pkParam];
    this.logger.debug('Getting location key', {
      keyType: this.keyType,
      pkParam: pkParam,
      lkValue: lkValue,
      allLocals: res.locals
    });
    return { kt: this.keyType, lk: lkValue };
  }

  // this is meant to be consumed by children routers
  public getLKA(res: Response): LocKeyArray<S, L1, L2, L3, L4> {
    return [this.getLk(res)] as LocKeyArray<S, L1, L2, L3, L4>;
  }

  public getPk(res: Response): PriKey<S> {
    return cPK<S>(res.locals[this.getPkParam()], this.getPkType());
  }

  // Unless this is a contained router, the locations will always be an empty array.
  protected getLocations(res: Response): LocKeyArray<L1, L2, L3, L4, L5> | [] {
    return this.parentRoute ? this.parentRoute.getLKA(res) as LocKeyArray<L1, L2, L3, L4, L5> : [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getIk(res: Response): PriKey<S> | ComKey<S, L1, L2, L3, L4, L5> {
    throw new Error('Method not implemented in an abstract router');
  }

  protected postAllAction = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Posting All Action', { query: req?.query, params: req?.params, locals: res?.locals });
    const allActionKey = req.path.substring(req.path.lastIndexOf('/') + 1);

    try {
      // Check for router-level handler first
      if (this.options.allActions && this.options.allActions[allActionKey]) {
        this.logger.debug('Using router-level all action handler', { allActionKey });
        const result = await this.options.allActions[allActionKey](
          req.body as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
          this.getLocations(res),
          { req, res }
        );
        if (result != null) {
          res.json(result);
        }
        return;
      }

      // Check if allAction operation exists
      if (!libOperations.allAction) {
        res.status(500).json({ error: 'All Actions are not configured' });
        return;
      }

      // Fallback to library handler
      const result = await libOperations.allAction(allActionKey, req.body, this.getLocations(res));
      res.json(result);
    } catch (error: any) {
      this.logger.error('Error in postAllAction', { error });
      // Check if it's a validation error or action not found error
      if ((error.name === 'ValidationError' || error.message?.includes('not found')) && error.message) {
        res.status(500).json({ error: 'All Action is not configured' });
      } else {
        res.status(500).json(error);
      }
    }
  }

  protected getAllFacet = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Getting All Facet', { query: req?.query, params: req?.params, locals: res?.locals });
    const facetKey = req.path.substring(req.path.lastIndexOf('/') + 1);

    try {
      // Check for router-level handler first
      if (this.options.allFacets && this.options.allFacets[facetKey]) {
        this.logger.debug('Using router-level all facet handler', { facetKey });
        const result = await this.options.allFacets[facetKey](
          req.query as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
          this.getLocations(res),
          { req, res }
        );
        if (result != null) {
          res.json(result);
        }
        return;
      }

      // Check if allFacet operation exists
      if (!libOperations.allFacet) {
        res.status(500).json({ error: 'All Facets are not configured' });
        return;
      }

      // Fallback to library handler
      const combinedQueryParams = { ...(req.query || {}), ...(req.params || {}) } as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>;
      const result = await libOperations.allFacet(facetKey, combinedQueryParams, this.getLocations(res));
      res.json(result);
    } catch (error: any) {
      this.logger.error('Error in getAllFacet', { error });
      // Check if it's a validation error or facet not found error
      if ((error.name === 'ValidationError' || error.message?.includes('not found')) && error.message) {
        res.status(500).json({ error: 'All Facet is not configured' });
      } else {
        res.status(500).json(error);
      }
    }
  }

  protected postItemAction = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Posting Item Action', { query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);
    const actionKey = req.path.substring(req.path.lastIndexOf('/') + 1);

    try {
      // Check for router-level handler first
      if (this.options.actions && this.options.actions[actionKey]) {
        this.logger.debug('Using router-level action handler', { actionKey });
        const result = await this.options.actions[actionKey](
          ik,
          req.body as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
          { req, res }
        );
        if (result != null) {
          res.json(result);
        }
        return;
      }

      // Check if actions operation exists
      if (!libOperations.action) {
        res.status(500).json({ error: 'Item Actions are not configured' });
        return;
      }

      // Fallback to library handler
      const result = await libOperations.action(ik, actionKey, req.body);
      res.json(result);
    } catch (error: any) {
      this.logger.error('Error in postItemAction', { error });
      // Check if it's a validation error or action not found error
      if ((error.name === 'ValidationError' || error.message?.includes('not found')) && error.message) {
        res.status(500).json({ error: 'Item Action is not configured' });
      } else {
        res.status(500).json(error);
      }
    }
  }

  protected getItemFacet = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Getting Item Facet', { query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);
    const facetKey = req.path.substring(req.path.lastIndexOf('/') + 1);

    try {
      // Check for router-level handler first
      if (this.options.facets && this.options.facets[facetKey]) {
        this.logger.debug('Using router-level facet handler', { facetKey });
        const result = await this.options.facets[facetKey](
          ik,
          req.query as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
          { req, res }
        );
        if (result != null) {
          res.json(result);
        }
        return;
      }

      // Check if facets operation exists
      if (!libOperations.facet) {
        res.status(500).json({ error: 'Item Facets are not configured' });
        return;
      }

      // Fallback to library handler
      const combinedQueryParams = { ...(req.query || {}), ...(req.params || {}) } as Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>;
      const result = await libOperations.facet(ik, facetKey, combinedQueryParams);
      res.json(result);
    } catch (error: any) {
      this.logger.error('Error in getItemFacet', { error });
      // Check if it's a validation error or facet not found error
      if ((error.name === 'ValidationError' || error.message?.includes('not found')) && error.message) {
        res.status(500).json({ error: 'Item Facet is not configured' });
      } else {
        res.status(500).json(error);
      }
    }
  }

  private configure = (router: Router) => {
    if (!this.lib) {
      this.logger.error('Library is undefined in configure');
      throw new Error('Library is required for router configuration');
    }
    // Ensure options exists - library should have options but handle case where it doesn't
    const libOptions = (this.lib as any).options || {};
    this.logger.debug('Configuring Router', { pkType: this.getPkType(), hasOptions: !!libOptions });
    router.get('/', this.wrapAsync(this.findItems));
    router.post('/', this.wrapAsync(this.createItem));

    // Track registered routes to detect collisions
    const registeredAllActions = new Set<string>();
    const registeredAllFacets = new Set<string>();
    const registeredItemActions = new Set<string>();
    const registeredItemFacets = new Set<string>();

    // Configure router-level allActions first (highest precedence)
    this.logger.default('Router All Actions', { allActions: this.options.allActions });
    if (this.options.allActions) {
      Object.keys(this.options.allActions).forEach((actionKey) => {
        this.logger.debug('Configuring Router All Action %s', actionKey);
        router.post(`/${actionKey}`, this.wrapAsync(this.postAllAction));
        registeredAllActions.add(actionKey);
      });
    }

    // Configure library allActions, warn on conflicts
    this.logger.default('Library All Actions', { allActions: libOptions.allActions });
    if (libOptions.allActions) {
      Object.keys(libOptions.allActions).forEach((actionKey) => {
        if (registeredAllActions.has(actionKey)) {
          this.logger.warning('All Action name collision - router-level handler takes precedence', { actionKey });
        } else {
          this.logger.debug('Configuring Library All Action %s', actionKey);
          router.post(`/${actionKey}`, this.wrapAsync(this.postAllAction));
          registeredAllActions.add(actionKey);
        }
      });
    }

    // Configure router-level allFacets first (highest precedence)
    this.logger.default('Router All Facets', { allFacets: this.options.allFacets });
    if (this.options.allFacets) {
      Object.keys(this.options.allFacets).forEach((facetKey) => {
        this.logger.debug('Configuring Router All Facet %s', facetKey);
        router.get(`/${facetKey}`, this.wrapAsync(this.getAllFacet));
        registeredAllFacets.add(facetKey);
      });
    }

    // Configure library allFacets, warn on conflicts
    this.logger.default('Library All Facets', { allFacets: libOptions.allFacets });
    if (libOptions.allFacets) {
      Object.keys(libOptions.allFacets).forEach((facetKey) => {
        if (registeredAllFacets.has(facetKey)) {
          this.logger.warning('All Facet name collision - router-level handler takes precedence', { facetKey });
        } else {
          this.logger.debug('Configuring Library All Facet %s', facetKey);
          router.get(`/${facetKey}`, this.wrapAsync(this.getAllFacet));
          registeredAllFacets.add(facetKey);
        }
      });
    }

    const itemRouter = Router();
    itemRouter.get('/', this.wrapAsync(this.getItem));
    itemRouter.put('/', this.wrapAsync(this.updateItem));
    itemRouter.delete('/', this.wrapAsync(this.deleteItem));

    // Configure router-level item actions first (highest precedence)
    this.logger.default('Router Item Actions', { itemActions: this.options.actions });
    if (this.options.actions) {
      Object.keys(this.options.actions).forEach((actionKey) => {
        this.logger.debug('Configuring Router Item Action %s', actionKey);
        itemRouter.post(`/${actionKey}`, this.wrapAsync(this.postItemAction));
        registeredItemActions.add(actionKey);
      });
    }

    // Configure library item actions, warn on conflicts
    this.logger.default('Library Item Actions', { itemActions: libOptions.actions });
    if (libOptions.actions) {
      Object.keys(libOptions.actions).forEach((actionKey) => {
        if (registeredItemActions.has(actionKey)) {
          this.logger.warning('Item Action name collision - router-level handler takes precedence', { actionKey });
        } else {
          this.logger.debug('Configuring Library Item Action %s', actionKey);
          itemRouter.post(`/${actionKey}`, this.wrapAsync(this.postItemAction));
          registeredItemActions.add(actionKey);
        }
      });
    }

    // Configure router-level item facets first (highest precedence)
    this.logger.default('Router Item Facets', { itemFacets: this.options.facets });
    if (this.options.facets) {
      Object.keys(this.options.facets).forEach((facetKey) => {
        this.logger.debug('Configuring Router Item Facet %s', facetKey);
        itemRouter.get(`/${facetKey}`, this.wrapAsync(this.getItemFacet));
        registeredItemFacets.add(facetKey);
      });
    }

    // Configure library item facets, warn on conflicts
    this.logger.default('Library Item Facets', { itemFacets: libOptions.facets });
    if (libOptions.facets) {
      Object.keys(libOptions.facets).forEach((facetKey) => {
        if (registeredItemFacets.has(facetKey)) {
          this.logger.warning('Item Facet name collision - router-level handler takes precedence', { facetKey });
        } else {
          this.logger.debug('Configuring Library Item Facet %s', facetKey);
          itemRouter.get(`/${facetKey}`, this.wrapAsync(this.getItemFacet));
          registeredItemFacets.add(facetKey);
        }
      });
    }

    this.logger.debug('Configuring Item Operations under PK Param %s', this.getPkParam());
    router.use(`/:${this.getPkParam()}`, this.validatePrimaryKeyValue, itemRouter);

    if (this.childRouters) {
      this.configureChildRouters(itemRouter, this.childRouters);
    }

    // Apply error handler as last middleware
    router.use(this.errorHandler);

    return router;
  }

  private validatePrimaryKeyValue = (req: Request, res: Response, next: any) => {
    const pkParamValue = req.params[this.getPkParam()];
    if (this.validatePKParam(pkParamValue)) {
      res.locals[this.getPkParam()] = pkParamValue;
      next();
    } else {
      this.logger.error('Invalid Primary Key', { pkParamValue, path: req?.originalUrl });
      res.status(400).json({ error: 'Invalid Primary Key', path: req?.originalUrl });
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

    try {
      const removedItem = await libOperations.remove(ik);
      if (removedItem) {
        const item = validatePK(removedItem, this.getPkType());
        res.json(item);
      } else {
        res.status(204).send();
      }
    } catch (error: any) {
      // Check for NotFoundError from various packages
      // Also check error.cause since errors may be wrapped
      const originalError = error?.cause || error;
      const isNotFound =
        error instanceof NotFoundError ||
        originalError instanceof NotFoundError ||
        error?.name === 'NotFoundError' ||
        originalError?.name === 'NotFoundError' ||
        error?.errorInfo?.code === 'NOT_FOUND' ||
        originalError?.errorInfo?.code === 'NOT_FOUND' ||
        (error?.message && (
          error.message.includes('not found') ||
          error.message.includes('Cannot remove') ||
          error.message.includes('Cannot update') ||
          error.message.toLowerCase().includes('not found')
        )) ||
        (originalError?.message && (
          originalError.message.includes('not found') ||
          originalError.message.includes('Cannot remove') ||
          originalError.message.includes('Cannot update') ||
          originalError.message.toLowerCase().includes('not found')
        ));
      
      if (isNotFound) {
        res.status(404).json({ ik, message: "Item Not Found" });
      } else {
        this.logger.error('Error in deleteItem', { error });
        res.status(500).json({ ik, message: "General Error" });
      }
    }
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
      const fetchedItem = await libOperations.get(ik);
      if (!fetchedItem) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: `${this.keyType} not found`,
          operation: {
            type: 'get',
            name: 'get',
            params: { key: ik }
          },
          context: {
            itemType: this.keyType
          },
          details: { retryable: false },
          technical: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const item = validatePK(fetchedItem, this.getPkType());
      res.json(item);
    } catch (error: any) {
      // Check for NotFoundError from various packages
      // Also check error.cause since errors may be wrapped
      const originalError = error?.cause || error;
      const isNotFound =
        error instanceof NotFoundError ||
        originalError instanceof NotFoundError ||
        error?.name === 'NotFoundError' ||
        originalError?.name === 'NotFoundError' ||
        error?.errorInfo?.code === 'NOT_FOUND' ||
        originalError?.errorInfo?.code === 'NOT_FOUND' ||
        (error?.message && (
          error.message.includes('not found') ||
          error.message.includes('Cannot remove') ||
          error.message.includes('Cannot update') ||
          error.message.toLowerCase().includes('not found')
        )) ||
        (originalError?.message && (
          originalError.message.includes('not found') ||
          originalError.message.includes('Cannot remove') ||
          originalError.message.includes('Cannot update') ||
          originalError.message.toLowerCase().includes('not found')
        ));
      
      if (isNotFound) {
        res.status(404).json({ ik, message: "Item Not Found" });
      } else {
        this.logger.error('Error in getItem', { error });
        res.status(500).json({ ik, message: "General Error" });
      }
    }
  }

  protected updateItem = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.debug('Updating Item',
      { body: req?.body, query: req?.query, params: req?.params, locals: res?.locals });
    const ik = this.getIk(res);

    try {
      const itemToUpdate = this.convertDates(req.body as Partial<Item<S, L1, L2, L3, L4, L5>>);
      const retItem = validatePK(await libOperations.update(ik, itemToUpdate), this.getPkType());
      res.json(retItem);
    } catch (error: any) {
      // Check for NotFoundError from various packages
      // Also check error.cause since errors may be wrapped
      const originalError = error?.cause || error;
      const isNotFound =
        error instanceof NotFoundError ||
        originalError instanceof NotFoundError ||
        error?.name === 'NotFoundError' ||
        originalError?.name === 'NotFoundError' ||
        error?.errorInfo?.code === 'NOT_FOUND' ||
        originalError?.errorInfo?.code === 'NOT_FOUND' ||
        (error?.message && (
          error.message.includes('not found') ||
          error.message.includes('Cannot remove') ||
          error.message.includes('Cannot update') ||
          error.message.includes('Update Failed') ||
          error.message.toLowerCase().includes('not found')
        )) ||
        (originalError?.message && (
          originalError.message.includes('not found') ||
          originalError.message.includes('Cannot remove') ||
          originalError.message.includes('Cannot update') ||
          originalError.message.toLowerCase().includes('not found')
        ));
      
      if (isNotFound) {
        res.status(404).json({ ik, message: "Item Not Found" });
      } else {
        this.logger.error('Error in updateItem', { error });
        res.status(500).json({ ik, message: "General Error" });
      }
    }
  };

  public convertDates = (item: Partial<Item<S, L1, L2, L3, L4, L5>>): Partial<Item<S, L1, L2, L3, L4, L5>> => {
    this.logger.debug('Converting Dates', { item });
    const events = item.events as Record<string, ItemEvent> | undefined;
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
