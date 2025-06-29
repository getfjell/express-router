/* eslint-disable @typescript-eslint/no-unused-vars */
import { CItemRouter } from "@/CItemRouter";
import { ComKey, Item, LocKeyArray, PriKey, UUID } from "@fjell/core";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Logger and lib mocks are now handled globally in tests/setup.ts

describe("CItemRouter", () => {
  let mockLib: any;
  let mockParentRoute: any;
  let router: CItemRouter<TestItem, "test", "container">;
  let req: Request;
  let res: Response;

  type TestItem = Item<"test", "container">;

  const priKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };
  const locKeyArray: LocKeyArray<"container"> = [{ kt: "container", lk: "2-2-2-2-2" as UUID }];
  const comKey: ComKey<"test", "container"> = { kt: priKey.kt, pk: priKey.pk, loc: locKeyArray };
  const testItem: TestItem = {
    key: comKey,
    stuff: true,
    events: { created: { at: new Date() }, updated: { at: new Date() }, deleted: { at: null } }
  }

  beforeEach(() => {
    vi.resetAllMocks();
    mockLib = {
      operations: {
        find: vi.fn(),
        findOne: vi.fn(),
        all: vi.fn(),
        create: vi.fn(),
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
      // Add findOne directly to lib for compatibility with CItemRouter's usage
      findOne: vi.fn()
    };
    mockParentRoute = { getLKA: vi.fn(), getLk: vi.fn(), getPk: vi.fn(), getPkType: vi.fn(), getLocations: vi.fn() };
    router = new CItemRouter(mockLib, "test", mockParentRoute);
    req = { path: '/test/path' } as Request;
    res = { json: vi.fn(), locals: {} } as unknown as Response;
  });

  it("should return true/false based on parent existence", () => {
    expect(router.hasParent()).toBe(true);
    const routerWithoutParent = new CItemRouter(mockLib, "test", null as any);
    expect(routerWithoutParent.hasParent()).toBe(false);
  });

  it("should return the correct ComKey", () => {
    vi.spyOn(router, "getPk").mockReturnValue(priKey);
    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    const result = router.getIk(res);
    expect(result).toEqual({ kt: priKey.kt, pk: priKey.pk, loc: locKeyArray });
  });

  it("should return the correct LocKeyArray", () => {
    res.locals = { testPk: "1-1-1-1-1" };
    mockParentRoute.getLKA.mockReturnValue([]);
    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    const result = router.getLKA(res);
    expect(result).toEqual([{ kt: "test", lk: "1-1-1-1-1" }]);
  });

  it("should return the correct LocKeyArray from parent route", () => {
    const parentLocKeyArray: LocKeyArray<"container"> = [{ kt: "container", lk: "2-2-2-2-2" as UUID }];
    mockParentRoute.getLKA.mockReturnValue(parentLocKeyArray);
    const result = router.getLocations(res);
    expect(result).toEqual(parentLocKeyArray);
    expect(mockParentRoute.getLKA).toHaveBeenCalledTimes(1);
  });

  it("should find items and return them as JSON", async () => {
    const query = { some: "query" };
    const items = [testItem];
    req.query = query;
    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    mockLib.operations.all = vi.fn().mockResolvedValue(items);
    await router['findItems'](req, res);
    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(mockLib.operations.all).toHaveBeenCalledWith(expect.any(Object), locKeyArray);
    expect(res.json).toHaveBeenCalledWith(items.map((item) => expect.any(Object)));
  });

  it("should handle errors in findItems", async () => {
    const query = { some: "query" };
    req.query = query;
    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    mockLib.operations.all = vi.fn().mockRejectedValue(new Error("Test error"));
    await expect(router['findItems'](req, res)).rejects.toThrow("Test error");
    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(mockLib.operations.all).toHaveBeenCalledWith(expect.any(Object), locKeyArray);
  });

  it("should create an item and return it as JSON", async () => {
    req.body = testItem;
    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    vi.spyOn(router, "convertDates").mockReturnValue(testItem);
    mockLib.operations.create = vi.fn().mockResolvedValue(testItem);
    vi.spyOn(router, "postCreateItem").mockResolvedValue(testItem);
    await router['createItem'](req, res);
    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(router.convertDates).toHaveBeenCalledWith(testItem);
    expect(mockLib.operations.create).toHaveBeenCalledWith(testItem, { locations: locKeyArray });
    expect(router.postCreateItem).toHaveBeenCalledWith(testItem);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should handle errors in createItem", async () => {
    req.body = testItem;
    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    vi.spyOn(router, "convertDates").mockReturnValue(testItem);
    mockLib.operations.create = vi.fn().mockRejectedValue(new Error("Test error"));
    await expect(router['createItem'](req, res)).rejects.toThrow("Test error");
    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(router.convertDates).toHaveBeenCalledWith(testItem);
    expect(mockLib.operations.create).toHaveBeenCalledWith(testItem, { locations: locKeyArray });
  });

  describe('findItems', () => {
    const mockParentLKA: LocKeyArray<'container'> = [{ kt: 'container', lk: '456' }];
    const mockItems = [{ id: '123', key: { kt: 'test', pk: '123' } }];

    beforeEach(() => {
      mockParentRoute.getLKA.mockReturnValue(mockParentLKA);
    });

    it('should find items using finder when finder param exists', async () => {
      mockLib.operations.find.mockResolvedValue(mockItems);
      req.query = { finder: 'testFinder', finderParams: JSON.stringify({ param: 'value' }) };
      await router['findItems'](req as Request, res as Response);
      expect(mockLib.operations.find).toHaveBeenCalledWith('testFinder', { param: 'value' }, mockParentLKA);
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it('should find items using query when no finder exists', async () => {
      mockLib.operations.all.mockResolvedValue(mockItems);
      req.query = { limit: '10' };
      await router['findItems'](req as Request, res as Response);
      expect(mockLib.operations.all).toHaveBeenCalledWith({ "limit": 10 }, mockParentLKA);
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it('should find single item using findOne when one=true', async () => {
      const mockItem = { id: '123', key: { kt: 'test', pk: '123' } };
      mockLib.findOne.mockResolvedValue(mockItem);
      req.query = { finder: 'testFinder', finderParams: JSON.stringify({ param: 'value' }), one: 'true' };
      await router['findItems'](req as Request, res as Response);
      expect(mockLib.findOne).toHaveBeenCalledWith('testFinder', { param: 'value' }, mockParentLKA);
      expect(mockLib.operations.find).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([mockItem]);
    });

    it('should return empty array when findOne returns null', async () => {
      mockLib.findOne.mockResolvedValue(null);
      req.query = { finder: 'testFinder', finderParams: JSON.stringify({ param: 'value' }), one: 'true' };
      await router['findItems'](req as Request, res as Response);
      expect(mockLib.findOne).toHaveBeenCalledWith('testFinder', { param: 'value' }, mockParentLKA);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should use find when one parameter is not true', async () => {
      mockLib.operations.find.mockResolvedValue(mockItems);
      req.query = { finder: 'testFinder', finderParams: JSON.stringify({ param: 'value' }), one: 'false' };
      await router['findItems'](req as Request, res as Response);
      expect(mockLib.operations.find).toHaveBeenCalledWith('testFinder', { param: 'value' }, mockParentLKA);
      expect(mockLib.findOne).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    // Test JSON parsing errors and edge cases
    it.each([
      ['invalid JSON', 'invalid-json'],
      ['empty string', '']
    ])('should handle %s in finderParams', async (_, finderParams) => {
      req.query = { finder: 'testFinder', finderParams };
      await expect(router['findItems'](req as Request, res as Response)).rejects.toThrow();
    });

    it('should handle undefined finderParams', async () => {
      req.query = { finder: 'testFinder' };
      await expect(router['findItems'](req as Request, res as Response)).rejects.toThrow();
    });

    it('should handle null finderParams', async () => {
      req.query = { finder: 'testFinder', finderParams: null as any };
      await expect(router['findItems'](req as Request, res as Response)).rejects.toThrow();
    });

    it('should handle findOne with undefined finderParams', async () => {
      req.query = { finder: 'testFinder', one: 'true' };
      await expect(router['findItems'](req as Request, res as Response)).rejects.toThrow();
    });

    // Test library method errors
    it.each([
      ['lib.find', 'find', { finder: 'testFinder', finderParams: JSON.stringify({ param: 'value' }) }],
      ['lib.findOne', 'findOne', {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'true'
      }]
    ])('should handle error in %s', async (_, method, query) => {
      if (method === 'findOne') {
        mockLib[method].mockRejectedValue(new Error(`${method} error`));
      } else {
        mockLib.operations[method].mockRejectedValue(new Error(`${method} error`));
      }
      req.query = query;
      await expect(router['findItems'](req as Request, res as Response)).rejects.toThrow(`${method} error`);
    });
  });

  describe('getLKA', () => {
    it('should concatenate current location key with parent LKA', () => {
      const currentLk = { kt: 'test', lk: '123' };
      const parentLKA = [{ kt: 'container', lk: '456' }, { kt: 'root', lk: '789' }];
      vi.spyOn(router as any, 'getLk').mockReturnValue(currentLk);
      mockParentRoute.getLKA.mockReturnValue(parentLKA);
      const result = router.getLKA(res);
      expect(result).toEqual([{ kt: 'test', lk: '123' }, { kt: 'container', lk: '456' }, { kt: 'root', lk: '789' }]);
    });

    it('should handle empty parent LKA', () => {
      const currentLk = { kt: 'test', lk: '123' };
      vi.spyOn(router as any, 'getLk').mockReturnValue(currentLk);
      mockParentRoute.getLKA.mockReturnValue([]);
      const result = router.getLKA(res);
      expect(result).toEqual([{ kt: 'test', lk: '123' }]);
    });
  });

  describe('createItem error scenarios', () => {
    beforeEach(() => {
      req.body = testItem;
      vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    });

    it('should handle error in postCreateItem', async () => {
      vi.spyOn(router, "convertDates").mockReturnValue(testItem);
      mockLib.operations.create = vi.fn().mockResolvedValue(testItem);
      vi.spyOn(router, "postCreateItem").mockRejectedValue(new Error("PostCreate error"));
      await expect(router['createItem'](req, res)).rejects.toThrow("PostCreate error");
      expect(router.postCreateItem).toHaveBeenCalledWith(testItem);
    });

    it('should handle error in convertDates', async () => {
      vi.spyOn(router, "convertDates").mockImplementation(() => { throw new Error("ConvertDates error"); });
      await expect(router['createItem'](req, res)).rejects.toThrow("ConvertDates error");
      expect(router.convertDates).toHaveBeenCalledWith(testItem);
    });
  });
});
