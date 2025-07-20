/* eslint-disable no-undefined */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstanceFactory } from '@/InstanceFactory';
import { createInstance } from '@/Instance';
import { ItemRouter } from '@/ItemRouter';
import { Item } from '@fjell/core';
import { Coordinate, Registry, RegistryHub } from '@fjell/registry';

// Mock the logger
vi.mock('@/logger', () => ({
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
vi.mock('@/Instance', () => ({
  createInstance: vi.fn((registry, coordinate, router) => ({
    registry,
    coordinate,
    router,
    itemType: undefined
  }))
}));

// Mock ItemRouter
vi.mock('@/ItemRouter', () => ({
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
      instanceTree: {}
    } as Registry;

    mockRegistryHub = {
      type: 'registry-hub',
      registries: {},
      getRegistry: vi.fn(),
      registerRegistry: vi.fn(),
      createRegistry: vi.fn(),
      get: vi.fn(),
      getRegisteredTypes: vi.fn(),
      unregisterRegistry: vi.fn()
    } as RegistryHub;

    mockCoordinate = {
      kta: ['test', 'container'],
      scopes: ['default']
    } as Coordinate<"test", "container">;

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('createInstanceFactory', () => {
    it('should create an instance factory function', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);

      expect(factory).toBeDefined();
      expect(typeof factory).toBe('function');
    });

    it('should return a function that creates instances when called', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);
      const context = { registry: mockRegistry, registryHub: mockRegistryHub };

      const instance = factory(mockCoordinate, context);

      expect(instance).toBeDefined();
      expect(createInstance).toHaveBeenCalledWith(mockRegistry, mockCoordinate, mockRouter);
    });

    it('should work with context that only has registry (no registryHub)', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);
      const context = { registry: mockRegistry };

      const instance = factory(mockCoordinate, context);

      expect(instance).toBeDefined();
      expect(createInstance).toHaveBeenCalledWith(mockRegistry, mockCoordinate, mockRouter);
    });

    it('should pass the router to the created instance', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);
      const context = { registry: mockRegistry, registryHub: mockRegistryHub };

      const instance = factory(mockCoordinate, context);

      expect(createInstance).toHaveBeenCalledWith(
        mockRegistry,
        mockCoordinate,
        mockRouter
      );
      expect(instance).toHaveProperty('router', mockRouter);
    });

    it('should log debug information when creating an instance', async () => {
      const mockLogger = vi.mocked(await import('@/logger')).default.get();
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);
      const context = { registry: mockRegistry, registryHub: mockRegistryHub };

      factory(mockCoordinate, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Creating express-router instance",
        { coordinate: mockCoordinate, registry: mockRegistry, router: mockRouter }
      );
    });

    it('should create instances with different coordinates', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);
      const context = { registry: mockRegistry };

      const coordinate1 = {
        kta: ['test', 'container'],
        scopes: ['scope1']
      } as Coordinate<"test", "container">;

      const coordinate2 = {
        kta: ['test', 'container'],
        scopes: ['scope2']
      } as Coordinate<"test", "container">;

      factory(coordinate1, context);
      factory(coordinate2, context);

      expect(createInstance).toHaveBeenCalledTimes(2);
      expect(createInstance).toHaveBeenNthCalledWith(1, mockRegistry, coordinate1, mockRouter);
      expect(createInstance).toHaveBeenNthCalledWith(2, mockRegistry, coordinate2, mockRouter);
    });

    it('should create instances with different registries', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);

      const registry1 = { ...mockRegistry, type: 'express-router-1' };
      const registry2 = { ...mockRegistry, type: 'express-router-2' };

      const context1 = { registry: registry1 };
      const context2 = { registry: registry2 };

      factory(mockCoordinate, context1);
      factory(mockCoordinate, context2);

      expect(createInstance).toHaveBeenCalledTimes(2);
      expect(createInstance).toHaveBeenNthCalledWith(1, registry1, mockCoordinate, mockRouter);
      expect(createInstance).toHaveBeenNthCalledWith(2, registry2, mockCoordinate, mockRouter);
    });

    it('should return instances that match the InstanceFactory type', () => {
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);
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
      const factory = createInstanceFactory<TestItem, "test", "container">(mockRouter);

      // The factory should be a function that takes a router and returns a BaseInstanceFactory
      expect(typeof factory).toBe('function');
    });
  });
});
