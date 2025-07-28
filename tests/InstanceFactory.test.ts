/* eslint-disable no-undefined */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstanceFactory } from '../src/InstanceFactory';
import { createInstance } from '../src/Instance';
import { ItemRouter } from '../src/ItemRouter';
import { Item } from '@fjell/core';
import { Coordinate, Registry, RegistryHub } from '@fjell/registry';
import { Operations, Options } from '@fjell/lib';

// Mock the logger
vi.mock('../src/logger', () => ({
  default: {
    get: vi.fn().mockReturnValue({
      debug: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      default: vi.fn(),
      trace: vi.fn(),
      emergency: vi.fn(),
      alert: vi.fn(),
      critical: vi.fn(),
      notice: vi.fn(),
      time: vi.fn().mockReturnThis(),
      end: vi.fn(),
      log: vi.fn(),
    })
  }
}));

// Mock the Instance module
vi.mock('../src/Instance', () => ({
  createInstance: vi.fn((registry, coordinate, router, operations, options) => ({
    registry,
    coordinate,
    router,
    operations,
    options,
    itemType: undefined
  }))
}));

// Mock ItemRouter
vi.mock('../src/ItemRouter', () => ({
  ItemRouter: vi.fn().mockImplementation(() => ({
    getPkType: () => 'test',
    configure: vi.fn(),
    getRouter: vi.fn()
  }))
}));

type TestItem = Item<"test", "container">;

describe('InstanceFactory', () => {
  let mockRouter: ItemRouter<"test", "container">;
  let mockRegistry: Registry;
  let mockRegistryHub: RegistryHub;
  let mockCoordinate: Coordinate<"test", "container">;
  let mockOperations: Operations<TestItem, "test", "container">;
  let mockOptions: Options<TestItem, "test", "container">;

  beforeEach(() => {
    mockRouter = new ItemRouter(
      {} as any,
      'test'
    ) as ItemRouter<"test", "container">;

    mockRegistry = {
      type: 'express-router',
      createInstance: vi.fn(),
      register: vi.fn(),
      get: vi.fn(),
      instanceTree: {},
      getCoordinates: vi.fn().mockReturnValue([]),
      getStatistics: vi.fn().mockReturnValue({ totalCalls: 0, coordinateCalls: {} })
    } as Registry;

    mockRegistryHub = {
      type: 'registry-hub',
      registries: {},
      getRegistry: vi.fn(),
      registerRegistry: vi.fn(),
      createRegistry: vi.fn(),
      get: vi.fn(),
      getRegisteredTypes: vi.fn(),
      unregisterRegistry: vi.fn(),
      getAllCoordinates: vi.fn().mockReturnValue([])
    } as RegistryHub;

    mockCoordinate = {
      kta: ['test', 'container'],
      scopes: ['default']
    } as Coordinate<"test", "container">;

    mockOperations = {
      all: vi.fn(),
      find: vi.fn(),
      get: vi.fn(),
      one: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      remove: vi.fn(),
      findOne: vi.fn(),
      finders: {},
      action: vi.fn(),
      actions: {},
      facet: vi.fn(),
      facets: {},
      allAction: vi.fn(),
      allActions: {},
      allFacet: vi.fn(),
      allFacets: {}
    } as unknown as Operations<TestItem, "test", "container">;

    mockOptions = {
      hooks: {},
      validators: {},
      finders: {},
      actions: {},
      allActions: {},
      facets: {},
      allFacets: {}
    } as Options<TestItem, "test", "container">;

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('createInstanceFactory', () => {
    it('should create an instance factory for ItemRouter', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter, mockOperations, mockOptions);

      expect(factory).toBeDefined();
      expect(typeof factory).toBe('function');
    });

    it('should return an instance when factory is called', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter, mockOperations, mockOptions);
      const instance = factory(mockCoordinate, { registry: mockRegistry });

      expect(instance).toBeDefined();
      expect(createInstance).toHaveBeenCalledWith(mockRegistry, mockCoordinate, mockRouter, mockOperations, mockOptions);
    });

    it('should return an instance with registry hub when factory is called', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter, mockOperations, mockOptions);
      const instance = factory(mockCoordinate, { registry: mockRegistry, registryHub: mockRegistryHub });

      expect(instance).toBeDefined();
      expect(createInstance).toHaveBeenCalledWith(
        mockRegistry,
        mockCoordinate,
        mockRouter,
        mockOperations,
        mockOptions
      );
    });

    it('should handle multiple coordinates', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter, mockOperations, mockOptions);

      const coordinate1 = {
        kta: ['test', 'container'],
        scopes: ['scope1']
      } as Coordinate<"test", "container">;

      const coordinate2 = {
        kta: ['test', 'container'],
        scopes: ['scope2']
      } as Coordinate<"test", "container">;

      factory(coordinate1, { registry: mockRegistry });
      factory(coordinate2, { registry: mockRegistry });

      expect(createInstance).toHaveBeenCalledTimes(2);
      expect(createInstance).toHaveBeenNthCalledWith(1, mockRegistry, coordinate1, mockRouter, mockOperations, mockOptions);
      expect(createInstance).toHaveBeenNthCalledWith(2, mockRegistry, coordinate2, mockRouter, mockOperations, mockOptions);
    });

    it('should create instances with different registries', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter, mockOperations, mockOptions);

      const registry1 = { ...mockRegistry, type: 'express-router-1' };
      const registry2 = { ...mockRegistry, type: 'express-router-2' };

      const context1 = { registry: registry1 };
      const context2 = { registry: registry2 };

      factory(mockCoordinate, context1);
      factory(mockCoordinate, context2);

      expect(createInstance).toHaveBeenCalledTimes(2);
      expect(createInstance).toHaveBeenNthCalledWith(1, registry1, mockCoordinate, mockRouter, mockOperations, mockOptions);
      expect(createInstance).toHaveBeenNthCalledWith(2, registry2, mockCoordinate, mockRouter, mockOperations, mockOptions);
    });

    it('should return instances that match the InstanceFactory type', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter, mockOperations, mockOptions);
      const context = { registry: mockRegistry };

      const instance = factory(mockCoordinate, context);

      // The factory should return an instance that can be cast to the correct type
      expect(instance).toHaveProperty('registry');
      expect(instance).toHaveProperty('coordinate');
      expect(instance).toHaveProperty('router');
    });
  });

  describe('InstanceFactory type', () => {
    it('should define the correct type signature', () => {
      // This test ensures the TypeScript types are correct
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter, mockOperations, mockOptions);

      // The factory should be a function that takes a router and returns a BaseInstanceFactory
      expect(typeof factory).toBe('function');
    });
  });
});
