import { Item } from "@fjell/core";
import { ItemRouter } from "./ItemRouter.js";
import { InstanceFactory as BaseInstanceFactory, Registry, RegistryHub } from "@fjell/registry";
import { Operations, Options } from "@fjell/lib";
import { createInstance, Instance } from "./Instance.js";
import { Coordinate } from "@fjell/registry";
import LibLogger from "./logger.js";

const logger = LibLogger.get("InstanceFactory");

export type InstanceFactory<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (
  router: ItemRouter<S, L1, L2, L3, L4, L5>,
  operations: Operations<V, S, L1, L2, L3, L4, L5>,
  options?: Options<V, S, L1, L2, L3, L4, L5>
) => BaseInstanceFactory<S, L1, L2, L3, L4, L5> & { readonly _itemType?: V };

/**
 * Factory function for creating express-router instances
 */
export const createInstanceFactory = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    router: ItemRouter<S, L1, L2, L3, L4, L5>,
    operations: Operations<V, S, L1, L2, L3, L4, L5>,
    options?: Options<V, S, L1, L2, L3, L4, L5>
  ): BaseInstanceFactory<S, L1, L2, L3, L4, L5> => {
  return (coordinate: Coordinate<S, L1, L2, L3, L4, L5>, context: { registry: Registry, registryHub?: RegistryHub }) => {
    logger.debug("Creating express-router instance", { coordinate, registry: context.registry, router, operations, options });

    return createInstance(context.registry, coordinate, router, operations, options) as Instance<V, S, L1, L2, L3, L4, L5>;
  };
};
