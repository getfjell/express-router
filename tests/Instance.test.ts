 
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance, isInstance } from '../src/Instance';
import { ItemRouter } from '../src/ItemRouter';
import { Item } from '@fjell/core';
import { Coordinate, Registry } from '@fjell/registry';
import type { Operations } from '../src/Operations';
import { Options } from '@fjell/lib';

// Mock the logger
vi.mock('@fjell/logging', () => ({
  default: {
    getLogger: vi.fn().mockReturnValue({
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
      get: vi.fn().mockReturnThis(),  // For nested logger.get() calls
    })
  }
}));

// Mock @fjell/registry
vi.mock('@fjell/registry', () => ({
  createInstance: vi.fn((registry, coordinate) => ({
    registry,
    coordinate
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

describe('Instance', () => {
  let mockRegistry: Registry;
  let mockCoordinate: Coordinate<"test", "container">;
  let mockRouter: ItemRouter<"test", "container">;
  let mockOperations: Operations<TestItem, "test", "container">;
  let mockOptions: Options<TestItem, "test", "container">;

  beforeEach(() => {
    mockRegistry = {
      type: 'express-router',
      createInstance: vi.fn(),
      register: vi.fn(),
      get: vi.fn(),
      instanceTree: {},
      getCoordinates: vi.fn().mockReturnValue([]),
      getStatistics: vi.fn().mockReturnValue({ totalCalls: 0, coordinateCalls: {} })
    } as Registry;

    mockCoordinate = {
      kta: ['test', 'container'],
      scopes: ['default']
    } as Coordinate<"test", "container">;

    mockRouter = new ItemRouter(
      {} as any,
      'test'
    ) as ItemRouter<"test", "container">;

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

  describe('createInstance', () => {
    it('should create an instance with registry, coordinate, router, operations, and options', () => {
      const instance = createInstance<TestItem, "test", "container">(
        mockRegistry,
        mockCoordinate,
        mockRouter,
        mockOperations,
        mockOptions
      );

      expect(instance).toBeDefined();
      expect(instance.registry).toBe(mockRegistry);
      expect(instance.coordinate).toBe(mockCoordinate);
      expect(instance.router).toBe(mockRouter);
      expect(instance.operations).toBe(mockOperations);
      expect(instance.options).toBe(mockOptions);
    });

    it('should include itemType property as not defined by default', () => {
      const instance = createInstance<TestItem, "test", "container">(
        mockRegistry,
        mockCoordinate,
        mockRouter,
        mockOperations,
        mockOptions
      );

      expect(instance.itemType).not.toBeDefined();
    });

    it('should call the base createInstance from @fjell/registry', async () => {
      const registryModule = await import('@fjell/registry');
      const mockCreateInstance = vi.mocked(registryModule.createInstance);

      createInstance<TestItem, "test", "container">(
        mockRegistry,
        mockCoordinate,
        mockRouter,
        mockOperations,
        mockOptions
      );

      expect(mockCreateInstance).toHaveBeenCalledWith(mockRegistry, mockCoordinate);
    });
  });

  describe('isInstance', () => {
    it('should return true for valid instance objects', () => {
      const validInstance = {
        registry: mockRegistry,
        coordinate: mockCoordinate,
        router: mockRouter,
        operations: mockOperations,
        options: mockOptions
      };

      expect(isInstance(validInstance)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isInstance(null)).toBe(false);
    });

    it('should return false for unassigned values', () => {
      expect(isInstance(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isInstance('string')).toBe(false);
      expect(isInstance(123)).toBe(false);
      expect(isInstance(true)).toBe(false);
    });

    it('should return false for objects missing registry', () => {
      const invalidInstance = {
        coordinate: mockCoordinate,
        router: mockRouter
      };

      expect(isInstance(invalidInstance)).toBe(false);
    });

    it('should return false for objects missing coordinate', () => {
      const invalidInstance = {
        registry: mockRegistry,
        router: mockRouter
      };

      expect(isInstance(invalidInstance)).toBe(false);
    });

    it('should return false for objects missing router', () => {
      const invalidInstance = {
        registry: mockRegistry,
        coordinate: mockCoordinate
      };

      expect(isInstance(invalidInstance)).toBe(false);
    });

    it('should return false for objects with null properties', () => {
      const invalidInstance1 = {
        registry: null,
        coordinate: mockCoordinate,
        router: mockRouter
      };

      const invalidInstance2 = {
        registry: mockRegistry,
        coordinate: null,
        router: mockRouter
      };

      const invalidInstance3 = {
        registry: mockRegistry,
        coordinate: mockCoordinate,
        router: null
      };

      expect(isInstance(invalidInstance1)).toBe(false);
      expect(isInstance(invalidInstance2)).toBe(false);
      expect(isInstance(invalidInstance3)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isInstance({})).toBe(false);
    });
  });
});
