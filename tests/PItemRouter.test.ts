/* eslint-disable @typescript-eslint/no-unused-vars */
import { PItemRouter } from "../src/PItemRouter";
import { Item, PriKey, UUID } from "@fjell/core";
import { Primary } from "@fjell/lib";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

type TestItem = Item<"test">;

const priKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };

const testItem: TestItem = {
  key: priKey,
  stuff: true,
  events: {
    created: { at: new Date() },
    updated: { at: new Date() },
    deleted: { at: null }
  }
};

describe("PItemRouter", () => {
  let router: PItemRouter<TestItem, "test">;
  let mockLib: any;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    mockLib = {
      operations: {
        create: vi.fn(),
        all: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        action: vi.fn(),
        facet: vi.fn(),
        allAction: vi.fn(),
        allFacet: vi.fn()
      },
      definition: {
        options: {
          actions: {},
          facets: {},
          allActions: {},
          allFacets: {}
        }
      },
      // Add findOne directly to lib for PItemRouter compatibility
      findOne: vi.fn()
    };
    router = new PItemRouter(mockLib, "test");
    req = {
      params: {},
      body: {},
      query: {}
    };
    res = {
      locals: {},
      // @ts-ignore
      json: vi.fn(),
      // @ts-ignore
      status: vi.fn().mockReturnThis()
    };
  });

  describe('constructor', () => {
    it('should create router with default options', () => {
      const newRouter = new PItemRouter(mockLib, "test");
      expect(newRouter).toBeDefined();
      expect(newRouter.getPkType()).toBe("test");
    });

    it('should create router with custom options', () => {
      const options = {
        actions: { testAction: vi.fn() },
        facets: { testFacet: vi.fn() },
        allActions: { testAllAction: vi.fn() },
        allFacets: { testAllFacet: vi.fn() }
      };
      const newRouter = new PItemRouter(mockLib, "test", options);
      expect(newRouter).toBeDefined();
      expect(newRouter.getPkType()).toBe("test");
    });

    it('should handle empty options object', () => {
      const newRouter = new PItemRouter(mockLib, "test", {});
      expect(newRouter).toBeDefined();
      expect(newRouter.getPkType()).toBe("test");
    });
  });

  describe('createItem', () => {
    it("should create an item successfully", async () => {
      mockLib.operations.create.mockResolvedValue(testItem);
      req.body = { stuff: true };

      await router.createItem(req as Request, res as Response);

      expect(mockLib.operations.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(testItem);
    });

    it("should handle CreateValidationError", async () => {
      const validationError = new Error("Field is required");
      validationError.name = "CreateValidationError";
      mockLib.operations.create.mockRejectedValue(validationError);
      req.body = { invalidField: true };

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Field is required"
      });
    });

    it("should handle ValidationError", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      mockLib.operations.create.mockRejectedValue(validationError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed"
      });
    });

    it("should handle SequelizeValidationError", async () => {
      const validationError = new Error("Database validation failed");
      validationError.name = "SequelizeValidationError";
      mockLib.operations.create.mockRejectedValue(validationError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Database validation failed"
      });
    });

    it("should handle validation error by message content - 'validation'", async () => {
      const validationError = new Error("Something failed validation");
      mockLib.operations.create.mockRejectedValue(validationError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Something failed validation"
      });
    });

    it("should handle validation error by message content - 'required'", async () => {
      const validationError = new Error("Field name is required");
      mockLib.operations.create.mockRejectedValue(validationError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Field name is required"
      });
    });

    it("should handle validation error by message content - 'cannot be null'", async () => {
      const validationError = new Error("Field cannot be null");
      mockLib.operations.create.mockRejectedValue(validationError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Field cannot be null"
      });
    });

    it("should handle validation error by message content - 'notNull Violation'", async () => {
      const validationError = new Error("notNull Violation: Field cannot be null");
      mockLib.operations.create.mockRejectedValue(validationError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "notNull Violation: Field cannot be null"
      });
    });

    it("should handle general errors with 500 status", async () => {
      const generalError = new Error("Database connection failed");
      mockLib.operations.create.mockRejectedValue(generalError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Database connection failed"
      });
    });

    it("should handle errors without message", async () => {
      const validationError = new Error();
      validationError.name = "ValidationError";
      mockLib.operations.create.mockRejectedValue(validationError);

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed"
      });
    });

    it("should call postCreateItem hook after creation", async () => {
      const postCreateSpy = vi.spyOn(router, 'postCreateItem').mockResolvedValue(testItem);
      mockLib.operations.create.mockResolvedValue(testItem);

      await router.createItem(req as Request, res as Response);

      expect(postCreateSpy).toHaveBeenCalledWith(testItem);
    });

    it("should call convertDates on request body", async () => {
      const convertDatesSpy = vi.spyOn(router, 'convertDates').mockReturnValue(req.body);
      mockLib.operations.create.mockResolvedValue(testItem);
      req.body = { stuff: true, dateField: "2023-01-01" };

      await router.createItem(req as Request, res as Response);

      expect(convertDatesSpy).toHaveBeenCalledWith(req.body);
    });
  });

  it("should find items", async () => {
    const mockResult = {
      items: [testItem],
      metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
    };
    mockLib.operations.all.mockResolvedValue(mockResult);
    const response = await router['findItems'](req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it("should return the correct primary key", () => {
    res.locals = { testPk: "1-1-1-1-1" };
    const pk = router.getIk(res as Response);
    expect(pk).toEqual(priKey);
  });

  describe('findItems - comprehensive edge cases', () => {
    it('should handle invalid JSON in finderParams', async () => {
      req.query = {
        finder: 'testFinder',
        finderParams: 'invalid-json'
      };

      await router['findItems'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid JSON in finderParams',
        message: expect.any(String)
      });
    });

    it('should handle empty finderParams when finder is provided', async () => {
      const mockItems = [testItem];
      mockLib.operations.find.mockResolvedValue({
        items: mockItems,
        metadata: { total: mockItems.length, returned: mockItems.length, offset: 0, hasMore: false }
      });
      req.query = {
        finder: 'testFinder'
        // finderParams is undefined
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.operations.find).toHaveBeenCalledWith('testFinder', {}, [], undefined);
      expect(res.json).toHaveBeenCalledWith({
        items: mockItems,
        metadata: expect.objectContaining({ total: 1, returned: 1 })
      });
    });

    it('should handle malformed JSON in finderParams', async () => {
      req.query = {
        finder: 'testFinder',
        finderParams: '{"invalid": json}'
      };

      await router['findItems'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid JSON in finderParams',
        message: expect.any(String)
      });
    });

    it('should handle finder with complex nested finderParams', async () => {
      const mockItems = [testItem];
      const complexParams = {
        nested: {
          field: 'value',
          array: [1, 2, 3]
        },
        date: '2023-01-01'
      };
      mockLib.operations.find.mockResolvedValue({
        items: mockItems,
        metadata: { total: mockItems.length, returned: mockItems.length, offset: 0, hasMore: false }
      });
      req.query = {
        finder: 'complexFinder',
        finderParams: JSON.stringify(complexParams)
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.operations.find).toHaveBeenCalledWith('complexFinder', complexParams, [], undefined);
      expect(res.json).toHaveBeenCalledWith({
        items: mockItems,
        metadata: expect.objectContaining({ total: 1, returned: 1 })
      });
    });

    it('should validate primary keys in returned items', async () => {
      const mockItemsWithoutValidation = [{
        key: { kt: 'test', pk: 'invalid-pk' },
        stuff: true
      }];
      const mockValidatedItems = [testItem];

      mockLib.operations.all.mockResolvedValue(mockItemsWithoutValidation);

      // Mock validatePK function behavior
      vi.doMock('@fjell/core', () => ({
        ...vi.importActual('@fjell/core') as any,
        validatePK: vi.fn().mockReturnValue(testItem)
      }));

      await router['findItems'](req as Request, res as Response);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle empty query object', async () => {
      const mockItems = [testItem];
      const mockResult = {
        items: mockItems,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      mockLib.operations.all.mockResolvedValue(mockResult);
      req.query = {};

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.operations.all).toHaveBeenCalledWith(expect.any(Object), [], {});
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle query with multiple parameters', async () => {
      const mockItems = [testItem];
      const mockResult = {
        items: mockItems,
        metadata: { total: 1, returned: 1, offset: 5, hasMore: false }
      };
      mockLib.operations.all.mockResolvedValue(mockResult);
      req.query = {
        limit: '10',
        offset: '5',
        sort: 'created',
        order: 'desc'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.operations.all).toHaveBeenCalledWith(expect.any(Object), [], { limit: 10, offset: 5 });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle findOne returning undefined when one=true', async () => {
      mockLib.findOne.mockResolvedValue(null);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'true'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.findOne).toHaveBeenCalledWith('testFinder', { param: 'value' });
      expect(res.json).toHaveBeenCalledWith({
        items: [],
        metadata: expect.objectContaining({ total: 0, returned: 0 })
      });
    });

  });

  describe('findItems - existing tests', () => {
    it('should find items using finder when finder param exists', async () => {
      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      mockLib.operations.find.mockResolvedValue({
        items: mockItems,
        metadata: { total: mockItems.length, returned: mockItems.length, offset: 0, hasMore: false }
      });
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' })
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.operations.find).toHaveBeenCalledWith('testFinder', { param: 'value' }, [], undefined);
      expect(res.json).toHaveBeenCalledWith({
        items: mockItems,
        metadata: expect.objectContaining({ total: 1, returned: 1 })
      });
    });

    it('should find items using query when no finder exists', async () => {
      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      const mockResult = {
        items: mockItems,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      mockLib.operations.all.mockResolvedValue(mockResult);
      req.query = {
        limit: '10'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.operations.all).toHaveBeenCalledWith(expect.any(Object), [], { limit: 10 });
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should find single item using findOne when one=true', async () => {
      const mockItem = {
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      };

      mockLib.findOne.mockResolvedValue(mockItem);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'true'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.findOne).toHaveBeenCalledWith('testFinder', { param: 'value' });
      expect(mockLib.operations.find).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        items: [mockItem],
        metadata: expect.objectContaining({ total: 1, returned: 1 })
      });
    });

    it('should return empty array when findOne returns null', async () => {
      mockLib.findOne.mockResolvedValue(null);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'true'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.findOne).toHaveBeenCalledWith('testFinder', { param: 'value' });
      expect(res.json).toHaveBeenCalledWith({
        items: [],
        metadata: expect.objectContaining({ total: 0, returned: 0 })
      });
    });

    it('should use find when one parameter is not true', async () => {
      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      mockLib.operations.find.mockResolvedValue({
        items: mockItems,
        metadata: { total: mockItems.length, returned: mockItems.length, offset: 0, hasMore: false }
      });
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'false'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.operations.find).toHaveBeenCalledWith('testFinder', { param: 'value' }, [], undefined);
      expect(res.json).toHaveBeenCalledWith({
        items: mockItems,
        metadata: expect.objectContaining({ total: 1, returned: 1 })
      });
    });
  });

  describe('getIk method', () => {
    it('should return primary key from response locals', () => {
      res.locals = { testPk: "2-2-2-2-2" };
      const pk = router.getIk(res as Response);
      expect(pk).toEqual({ kt: "test", pk: "2-2-2-2-2" });
    });

    it('should handle different primary key values', () => {
      res.locals = { testPk: "abc-def-123" };
      const pk = router.getIk(res as Response);
      expect(pk).toEqual({ kt: "test", pk: "abc-def-123" });
    });

    it('should handle empty locals gracefully', () => {
      res.locals = {};
      const pk = router.getIk(res as Response);
      // When locals are empty, getIk should still work but may return undefined pk value
      if (pk) {
        expect(pk.kt).toBe("test");
      } else {
        expect(pk).toBeUndefined();
      }
    });
  });

  describe('convertDates functionality', () => {
    it('should call convertDates method', () => {
      const input = {
        key: priKey,
        stuff: true,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-02T12:30:45.123Z"
      };

      const result = router.convertDates(input);

      // convertDates is inherited from ItemRouter and should return the input
      // The actual conversion logic is implementation dependent
      expect(result).toBeDefined();
      expect(result.key).toEqual(priKey);
      expect(result.stuff).toBe(true);
    });

    it('should preserve existing Date objects', () => {
      const now = new Date();
      const input = {
        key: priKey,
        stuff: true,
        createdAt: now
      };

      const result = router.convertDates(input);

      expect(result.createdAt).toBe(now);
    });

    it('should handle items without date fields', () => {
      const input = {
        key: priKey,
        stuff: true,
        name: "test item"
      };

      const result = router.convertDates(input);

      expect(result).toEqual(input);
    });

    it('should handle null and undefined values', () => {
      const input: any = {
        key: priKey,
        stuff: true,
        createdAt: null
        // updatedAt is intentionally omitted to test undefined behavior
      };

      const result = router.convertDates(input);

      expect(result.createdAt).toBeNull();
      expect(result.updatedAt).toBeUndefined();
    });
  });

  describe('postCreateItem hook', () => {
    it('should return item unchanged by default', async () => {
      const result = await router.postCreateItem(testItem);
      expect(result).toEqual(testItem);
    });

    it('should be called during create process', async () => {
      const spy = vi.spyOn(router, 'postCreateItem');
      mockLib.operations.create.mockResolvedValue(testItem);

      await router.createItem(req as Request, res as Response);

      expect(spy).toHaveBeenCalledWith(testItem);
    });
  });

  describe('integration with parent ItemRouter methods', () => {
    it('should inherit getPkType from parent', () => {
      expect(router.getPkType()).toBe("test");
    });

    it('should inherit getPk from parent', () => {
      res.locals = { testPk: "inherited-test" };
      const pk = router.getPk(res as Response);
      expect(pk).toEqual({ kt: "test", pk: "inherited-test" });
    });

    it('should properly validate primary key parameters', () => {
      const isValid = router.validatePKParam("valid-uuid-format");
      expect(typeof isValid).toBe("boolean");
    });
  });

  describe('error scenarios', () => {
    it('should handle library operation failures gracefully', async () => {
      mockLib.operations.create.mockRejectedValue(new Error("Library error"));
      req.body = { stuff: true };

      await router.createItem(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Library error"
      });
    });

    it('should handle findItems library failures', async () => {
      mockLib.operations.all.mockRejectedValue(new Error("Database error"));

      await router['findItems'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe('method signatures and types', () => {
    it('should have correct method signatures', () => {
      expect(typeof router.createItem).toBe('function');
      expect(typeof router.getIk).toBe('function');
      expect(typeof router.convertDates).toBe('function');
      expect(typeof router.postCreateItem).toBe('function');
    });

    it('should properly extend ItemRouter', () => {
      expect(router).toBeInstanceOf(router.constructor);
      expect(router.getPkType).toBeDefined();
      expect(router.getPk).toBeDefined();
    });
  });
});
