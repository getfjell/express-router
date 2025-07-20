
/* eslint-disable no-undefined */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance, isInstance } from '@/Instance';
import { ItemRouter } from '@/ItemRouter';
import { Item } from '@fjell/core';
import { Coordinate, Registry } from '@fjell/registry';

// Mock the logger
vi.mock('@fjell/logging', () => ({
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

// Mock @fjell/registry
vi.mock('@fjell/registry', () => ({
  createInstance: vi.fn((registry, coordinate) => ({
    registry,
    coordinate
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

describe('Instance', () => {
  let mockRegistry: Registry;
  let mockCoordinate: Coordinate<"test", "container">;
  let mockRouter: ItemRouter<"test", "container">;

  beforeEach(() => {
    mockRegistry = {
      type: 'express-router',
      createInstance: vi.fn(),
      register: vi.fn(),
      get: vi.fn(),
      instanceTree: {}
    } as Registry;

    mockCoordinate = {
      kta: ['test', 'container'],
      scopes: ['default']
    } as Coordinate<"test", "container">;

    mockRouter = new ItemRouter(
      {} as any,
      'test'
    ) as ItemRouter<"test", "container">;
  });

  describe('createInstance', () => {
    it('should create an instance with registry, coordinate, and router', () => {
      const instance = createInstance<TestItem, "test", "container">(
        mockRegistry,
        mockCoordinate,
        mockRouter
      );

      expect(instance).toBeDefined();
      expect(instance.registry).toBe(mockRegistry);
      expect(instance.coordinate).toBe(mockCoordinate);
      expect(instance.router).toBe(mockRouter);
    });

    it('should include itemType property as not defined by default', () => {
      const instance = createInstance<TestItem, "test", "container">(
        mockRegistry,
        mockCoordinate,
        mockRouter
      );

      expect(instance.itemType).not.toBeDefined();
    });

    it('should call the base createInstance from @fjell/registry', async () => {
      const registryModule = await import('@fjell/registry');
      const mockCreateInstance = vi.mocked(registryModule.createInstance);

      createInstance<TestItem, "test", "container">(
        mockRegistry,
        mockCoordinate,
        mockRouter
      );

      expect(mockCreateInstance).toHaveBeenCalledWith(mockRegistry, mockCoordinate);
    });
  });

  describe('isInstance', () => {
    it('should return true for valid instance objects', () => {
      const validInstance = {
        registry: mockRegistry,
        coordinate: mockCoordinate,
        router: mockRouter
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
