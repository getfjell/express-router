/* eslint-disable no-undefined */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRegistry, createRegistryFactory, Registry } from '@/Registry';
import { RegistryHub } from '@fjell/registry';

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

// Mock @fjell/registry
const mockBaseRegistry = {
  type: 'express-router',
  createInstance: vi.fn(),
  register: vi.fn(),
  get: vi.fn(),
  instanceTree: {}
};

vi.mock('@fjell/registry', () => ({
  createRegistry: vi.fn(() => mockBaseRegistry)
}));

describe('Registry', () => {
  let mockRegistryHub: RegistryHub;

  beforeEach(() => {
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

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('createRegistry', () => {
    it('should create a registry without registryHub', () => {
      const registry = createRegistry();

      expect(registry).toBeDefined();
      expect(registry.type).toBe('express-router');
    });

    it('should create a registry with registryHub', () => {
      const registry = createRegistry(mockRegistryHub);

      expect(registry).toBeDefined();
      expect(registry.type).toBe('express-router');
    });

    it('should call createRegistry from @fjell/registry with correct parameters', async () => {
      const { createRegistry: mockCreateRegistry } = vi.mocked(await import('@fjell/registry'));

      createRegistry(mockRegistryHub);

      expect(mockCreateRegistry).toHaveBeenCalledWith('express-router', mockRegistryHub);
    });

    it('should call createRegistry from @fjell/registry without registryHub', async () => {
      const { createRegistry: mockCreateRegistry } = vi.mocked(await import('@fjell/registry'));

      createRegistry();

      expect(mockCreateRegistry).toHaveBeenCalledWith('express-router', undefined);
    });

    it('should return a registry with correct type property', () => {
      const registry = createRegistry();

      expect(registry).toHaveProperty('type', 'express-router');
    });

    it('should return a registry that extends BaseRegistry', () => {
      const registry = createRegistry();

      // Check that it has the expected BaseRegistry properties
      expect(registry).toHaveProperty('createInstance');
      expect(registry).toHaveProperty('register');
      expect(registry).toHaveProperty('get');
      expect(registry).toHaveProperty('instanceTree');
    });
  });

  describe('createRegistryFactory', () => {
    it('should create a registry factory function', () => {
      const factory = createRegistryFactory();

      expect(factory).toBeDefined();
      expect(typeof factory).toBe('function');
    });

    it('should create registry when called with correct type', () => {
      const factory = createRegistryFactory();

      const registry = factory('express-router', mockRegistryHub);

      expect(registry).toBeDefined();
      expect(registry.type).toBe('express-router');
    });

    it('should create registry without registryHub', () => {
      const factory = createRegistryFactory();

      const registry = factory('express-router');

      expect(registry).toBeDefined();
      expect(registry.type).toBe('express-router');
    });

    it('should throw error for incorrect type', () => {
      const factory = createRegistryFactory();

      expect(() => {
        factory('wrong-type', mockRegistryHub);
      }).toThrow("Express Router registry factory can only create 'express-router' type registries, got: wrong-type");
    });

    it('should log debug information when creating registry', async () => {
      const mockLogger = vi.mocked(await import('@/logger')).default.get();
      const factory = createRegistryFactory();

      factory('express-router', mockRegistryHub);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Creating express-router registry",
        { type: 'express-router', registryHub: mockRegistryHub }
      );
    });

    it('should call createRegistry from @fjell/registry with correct parameters', async () => {
      const { createRegistry: mockCreateRegistry } = vi.mocked(await import('@fjell/registry'));
      const factory = createRegistryFactory();

      factory('express-router', mockRegistryHub);

      expect(mockCreateRegistry).toHaveBeenCalledWith('express-router', mockRegistryHub);
    });

    it('should return a registry that can be cast to the Registry interface', () => {
      const factory = createRegistryFactory();

      const registry = factory('express-router', mockRegistryHub) as Registry;

      expect(registry.type).toBe('express-router');
      expect(registry).toHaveProperty('createInstance');
      expect(registry).toHaveProperty('register');
      expect(registry).toHaveProperty('get');
      expect(registry).toHaveProperty('instanceTree');
    });

    it('should work with different registryHub instances', () => {
      const factory = createRegistryFactory();

      const registryHub1 = { ...mockRegistryHub, type: 'hub-1' } as RegistryHub;
      const registryHub2 = { ...mockRegistryHub, type: 'hub-2' } as RegistryHub;

      const registry1 = factory('express-router', registryHub1);
      const registry2 = factory('express-router', registryHub2);

      expect(registry1).toBeDefined();
      expect(registry2).toBeDefined();
      expect(registry1.type).toBe('express-router');
      expect(registry2.type).toBe('express-router');
    });

    it('should throw error with descriptive message for various wrong types', () => {
      const factory = createRegistryFactory();

      const wrongTypes = ['cache', 'client-api', 'lib', 'random-type'];

      wrongTypes.forEach(wrongType => {
        expect(() => {
          factory(wrongType, mockRegistryHub);
        }).toThrow(`Express Router registry factory can only create 'express-router' type registries, got: ${wrongType}`);
      });
    });
  });

  describe('Registry interface', () => {
    it('should have the correct type property', () => {
      const registry = createRegistry();

      // Type check to ensure Registry interface is properly implemented
      expect(registry.type).toBe('express-router');
    });

    it('should extend BaseRegistry interface', () => {
      const registry = createRegistry();

      // Ensure it has all BaseRegistry properties
      expect(registry).toHaveProperty('createInstance');
      expect(registry).toHaveProperty('register');
      expect(registry).toHaveProperty('get');
      expect(registry).toHaveProperty('instanceTree');
    });
  });
});
