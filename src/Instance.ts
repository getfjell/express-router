import LibLogger from "./logger.js";
import { Item } from "@fjell/core";
import { Instance as BaseInstance, Coordinate, createInstance as createBaseInstance, Registry } from "@fjell/registry";
import type { Operations } from "./Operations.js";
import { Options } from "@fjell/lib";
import { ItemRouter } from "./ItemRouter.js";

const logger = LibLogger.get("Instance");

/**
 * The Express Router Instance interface represents a router model instance that extends the base Instance
 * from @fjell/registry and adds express router operations for handling HTTP requests.
 *
 * The interface extends the base Instance (which provides coordinate and registry) with:
 * - router: Provides methods for routing HTTP requests and handling CRUD operations
 * - operations: Provides methods for interacting with the data model (get, find, all, etc.)
 * - options: Provides hooks, validators, finders, actions, and facets
 *
 * @template V - The type of the data model item, extending Item
 * @template S - The string literal type representing the model's key type
 * @template L1-L5 - Optional string literal types for location hierarchy levels
 */
export interface Instance<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends BaseInstance<S, L1, L2, L3, L4, L5> {
  /** The router object that provides methods for handling HTTP requests */
  router: ItemRouter<S, L1, L2, L3, L4, L5>;
  /** The operations object that provides methods for interacting with the data model */
  operations: Operations<V, S, L1, L2, L3, L4, L5>;
  /** The options object that provides hooks, validators, finders, actions, and facets */
  options: Options<V, S, L1, L2, L3, L4, L5>;
  /** The data model item type (for type safety) */
  readonly itemType?: V;
}

export const createInstance = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    registry: Registry,
    coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
    router: ItemRouter<S, L1, L2, L3, L4, L5>,
    operations: Operations<V, S, L1, L2, L3, L4, L5>,
    options?: Options<V, S, L1, L2, L3, L4, L5>,
  ): Instance<V, S, L1, L2, L3, L4, L5> => {
  logger.debug("createInstance", { coordinate, router, registry, operations, options });
  const baseInstance = createBaseInstance(registry, coordinate);
  return { ...baseInstance, router, operations, options: options || {} as Options<V, S, L1, L2, L3, L4, L5> };
}

export const isInstance = (instance: any): instance is Instance<any, any, any, any, any, any, any> => {
  return instance != null &&
    typeof instance === 'object' &&
    instance.coordinate != null &&
    instance.router != null &&
    instance.registry != null &&
    instance.operations != null &&
    instance.options != null;
}
