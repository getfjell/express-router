import LibLogger from './logger';
import {
  Registry as BaseRegistry,
  createRegistry as createBaseRegistry,
  RegistryFactory,
  RegistryHub
} from '@fjell/registry';

const logger = LibLogger.get("Registry");

/**
 * Extended Registry interface for express-router-specific functionality
 */
export interface Registry extends BaseRegistry {
  type: 'express-router';
}

/**
 * Factory function for creating express-router registries
 */
export const createRegistryFactory = (): RegistryFactory => {
  return (type: string, registryHub?: RegistryHub): BaseRegistry => {
    if (type !== 'express-router') {
      throw new Error(`Express Router registry factory can only create 'express-router' type registries, got: ${type}`);
    }

    logger.debug("Creating express-router registry", { type, registryHub });

    const baseRegistry = createBaseRegistry(type, registryHub);

    // Cast to Registry for type safety
    return baseRegistry as Registry;
  };
};

/**
 * Creates a new express-router registry instance
 */
export const createRegistry = (registryHub?: RegistryHub): Registry => {
  const baseRegistry = createBaseRegistry('express-router', registryHub);

  return {
    ...baseRegistry,
  } as Registry;
};
