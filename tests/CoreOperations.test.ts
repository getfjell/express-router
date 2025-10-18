import { describe, expect, it, vi } from 'vitest';
import { CItemRouter, PItemRouter } from '../src';
import type { Operations } from '@fjell/core';
import type { Item } from '@fjell/core';

vi.mock('@fjell/logging', () => ({
  default: {
    get: vi.fn().mockReturnThis(),
    getLogger: vi.fn().mockReturnThis(),
    default: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    emergency: vi.fn(),
    alert: vi.fn(),
    critical: vi.fn(),
    notice: vi.fn(),
    time: vi.fn().mockReturnThis(),
    end: vi.fn(),
    log: vi.fn(),
  }
}));

describe('Express Router Core Operations Compatibility', () => {
  it('should accept core Operations interface for PItemRouter', () => {
    // Create a mock operations object that implements core Operations interface
    const mockOperations: Operations<Item<'test'>, 'test'> = {
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as any),
      get: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as any),
      upsert: vi.fn().mockResolvedValue({} as any),
      remove: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      action: vi.fn().mockResolvedValue([{} as any, []]),
      allAction: vi.fn().mockResolvedValue([[], []]),
      facet: vi.fn().mockResolvedValue({}),
      allFacet: vi.fn().mockResolvedValue({}),
    };

    const mockLib = {
      operations: mockOperations,
      options: {}
    };

    // Create router with core operations
    const router = new PItemRouter(mockLib as any, 'test');
    expect(router).toBeDefined();
    expect(router.getPkType()).toBe('test');
  });

  it('should accept core Operations interface for CItemRouter', () => {
    // Create mock operations for contained item
    const mockOperations: Operations<Item<'comment', 'post'>, 'comment', 'post'> = {
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as any),
      get: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as any),
      upsert: vi.fn().mockResolvedValue({} as any),
      remove: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      action: vi.fn().mockResolvedValue([{} as any, []]),
      allAction: vi.fn().mockResolvedValue([[], []]),
      facet: vi.fn().mockResolvedValue({}),
      allFacet: vi.fn().mockResolvedValue({}),
    };

    const mockLib = {
      operations: mockOperations,
      options: {}
    };

    // Create parent router for contained item
    const parentOperations: Operations<Item<'post'>, 'post'> = {
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as any),
      get: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as any),
      upsert: vi.fn().mockResolvedValue({} as any),
      remove: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      action: vi.fn().mockResolvedValue([{} as any, []]),
      allAction: vi.fn().mockResolvedValue([[], []]),
      facet: vi.fn().mockResolvedValue({}),
      allFacet: vi.fn().mockResolvedValue({}),
    };

    const parentLib = {
      operations: parentOperations,
      options: {}
    };

    const parentRouter = new PItemRouter(parentLib as any, 'post');

    // Create child router with core operations
    const router = new CItemRouter(mockLib as any, 'comment', parentRouter);
    expect(router).toBeDefined();
    expect(router.getPkType()).toBe('comment');
    expect(router.hasParent()).toBe(true);
  });

  it('should create routes for all core Operations methods', () => {
    const mockOperations: Operations<Item<'test'>, 'test'> = {
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as any),
      get: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as any),
      upsert: vi.fn().mockResolvedValue({} as any),
      remove: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      action: vi.fn().mockResolvedValue([{} as any, []]),
      allAction: vi.fn().mockResolvedValue([[], []]),
      facet: vi.fn().mockResolvedValue({}),
      allFacet: vi.fn().mockResolvedValue({}),
    };

    const mockLib = {
      operations: mockOperations,
      options: {}
    };

    const router = new PItemRouter(mockLib as any, 'test');
    const expressRouter = router.getRouter();

    // Router should have routes configured
    expect(expressRouter).toBeDefined();
    expect(expressRouter.stack).toBeDefined();
    expect(expressRouter.stack.length).toBeGreaterThan(0);
  });

  it('should work with operations from @fjell/lib', () => {
    // This test verifies that the router works with any Operations implementation
    // including those from @fjell/lib which extends @fjell/core Operations

    const mockLibOperations = {
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as any),
      get: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as any),
      upsert: vi.fn().mockResolvedValue({} as any),
      remove: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      action: vi.fn().mockResolvedValue([{} as any, []]),
      allAction: vi.fn().mockResolvedValue([[], []]),
      facet: vi.fn().mockResolvedValue({}),
      allFacet: vi.fn().mockResolvedValue({}),
      // @fjell/lib may have additional methods beyond core Operations
      // but the router should work with just the core interface
    };

    const mockLib = {
      operations: mockLibOperations as any,
      options: {}
    };

    const router = new PItemRouter(mockLib as any, 'test');
    const expressRouter = router.getRouter();

    expect(router).toBeDefined();
    expect(expressRouter).toBeDefined();
  });

  it('should type-check Operations from different sources', () => {
    // This test demonstrates that Operations from @fjell/core and @fjell/lib
    // are compatible and interchangeable

    type CoreOperations = Operations<Item<'test'>, 'test'>;
    
    const mockOperations: CoreOperations = {
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as any),
      get: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as any),
      upsert: vi.fn().mockResolvedValue({} as any),
      remove: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      action: vi.fn().mockResolvedValue([{} as any, []]),
      allAction: vi.fn().mockResolvedValue([[], []]),
      facet: vi.fn().mockResolvedValue({}),
      allFacet: vi.fn().mockResolvedValue({}),
    };

    // This should compile and work
    const mockLib = {
      operations: mockOperations,
      options: {}
    };

    const router = new PItemRouter(mockLib as any, 'test');
    
    expect(router).toBeDefined();
    expect(typeof router.getPkType()).toBe('string');
  });
});

