/* eslint-disable @typescript-eslint/no-unused-vars */
import { ComKey, Item, LocKeyArray, PriKey, UUID } from "@fjell/core";
import { Request, Response } from "express";
import { ItemRouter } from "@/ItemRouter";
import { CItemRouter } from "@/CItemRouter";
import { Contained } from "@fjell/lib";
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
vi.mock("@fjell/lib");

describe("CItemRouter", () => {
  let mockLib: any;
  let mockParentRoute: any;
  let router: CItemRouter<TestItem, "test", "container">;
  let req: Request;
  let res: Response;

  type TestItem = Item<"test", "container">;

  const priKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };
  const locKeyArray: LocKeyArray<"container"> = [{ kt: "container", lk: "2-2-2-2-2" as UUID }];

  const comKey: ComKey<"test", "container"> = {
    kt: priKey.kt,
    pk: priKey.pk,
    loc: locKeyArray
  };

  const testItem: TestItem = {
    key: comKey,
    stuff: true,
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null }
    }
  }

  beforeEach(() => {
    vi.resetAllMocks();
    mockLib = {
      find: vi.fn(),
      findOne: vi.fn(),
      all: vi.fn(),
      create: vi.fn(),
    };
    mockParentRoute = {
      getLKA: vi.fn(),
      getLk: vi.fn(),
      getPk: vi.fn(),
      getPkType: vi.fn(),
      getLocations: vi.fn(),
    };
    router = new CItemRouter(mockLib, "test", mockParentRoute);

    req = {} as Request;
    res = {
      json: vi.fn(),
      locals: {},
    } as unknown as Response;

  });

  it("should return true if it has a parent", () => {
    expect(router.hasParent()).toBe(true);
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

    expect(result).toEqual([{
      kt: "test", lk: "1-1-1-1-1"
    }]);
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
    mockLib.all = vi.fn().mockResolvedValue(items);

    await router['findItems'](req, res);

    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(mockLib.all).toHaveBeenCalledWith(expect.any(Object), locKeyArray);
    expect(res.json).toHaveBeenCalledWith(items.map((item) => expect.any(Object)));
  });

  it("should handle errors in findItems", async () => {
    const query = { some: "query" };
    req.query = query;

    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    mockLib.all = vi.fn().mockRejectedValue(new Error("Test error"));

    await expect(router['findItems'](req, res)).rejects.toThrow("Test error");

    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(mockLib.all).toHaveBeenCalledWith(expect.any(Object), locKeyArray);
  });

  it("should create an item and return it as JSON", async () => {
    req.body = testItem;

    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    vi.spyOn(router, "convertDates").mockReturnValue(testItem);
    mockLib.create = vi.fn().mockResolvedValue(testItem);
    vi.spyOn(router, "postCreateItem").mockResolvedValue(testItem);

    await router['createItem'](req, res);

    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(router.convertDates).toHaveBeenCalledWith(testItem);
    expect(mockLib.create).toHaveBeenCalledWith(testItem, { locations: locKeyArray });
    expect(router.postCreateItem).toHaveBeenCalledWith(testItem);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should handle errors in createItem", async () => {
    req.body = testItem;

    vi.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    vi.spyOn(router, "convertDates").mockReturnValue(testItem);
    mockLib.create = vi.fn().mockRejectedValue(new Error("Test error"));

    await expect(router['createItem'](req, res)).rejects.toThrow("Test error");

    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(router.convertDates).toHaveBeenCalledWith(testItem);
    expect(mockLib.create).toHaveBeenCalledWith(testItem, { locations: locKeyArray });
  });

  describe('findItems', () => {
    it('should find items using finder when finder param exists', async () => {
      const mockLk = {
        kt: 'test',
        pk: '123'
      };

      const mockParentLKA: LocKeyArray<'container'> = [{
        kt: 'container',
        lk: '456'
      }];

      vi.spyOn(router as any, 'getLk').mockReturnValue(mockLk);
      mockParentRoute.getLKA.mockReturnValue(mockParentLKA);

      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      mockLib.find.mockResolvedValue(mockItems);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' })
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.find).toHaveBeenCalledWith('testFinder', { param: 'value' }, [{ "kt": "container", "lk": "456" }]);
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it('should find items using query when no finder exists', async () => {
      const mockLk = {
        kt: 'test',
        pk: '123'
      };

      const mockParentLKA: LocKeyArray<'container'> = [{
        kt: 'container',
        lk: '456'
      }];

      vi.spyOn(router as any, 'getLk').mockReturnValue(mockLk);
      mockParentRoute.getLKA.mockReturnValue(mockParentLKA);

      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      mockLib.all.mockResolvedValue(mockItems);
      req.query = {
        limit: '10'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.all).toHaveBeenCalledWith({ "limit": 10 }, [{ "kt": "container", "lk": "456" }]);
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it('should find single item using findOne when one=true', async () => {
      const mockParentLKA: LocKeyArray<'container'> = [{
        kt: 'container',
        lk: '456'
      }];

      mockParentRoute.getLKA.mockReturnValue(mockParentLKA);

      const mockItem = {
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      };

      // @ts-ignore
      mockLib.findOne.mockResolvedValue(mockItem);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'true'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.findOne).toHaveBeenCalledWith(
        'testFinder',
        { param: 'value' },
        [{ "kt": "container", "lk": "456" }]
      );
      expect(mockLib.find).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([mockItem]);
    });

    it('should return empty array when findOne returns null', async () => {
      const mockParentLKA: LocKeyArray<'container'> = [{
        kt: 'container',
        lk: '456'
      }];

      mockParentRoute.getLKA.mockReturnValue(mockParentLKA);

      // @ts-ignore
      mockLib.findOne.mockResolvedValue(null);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'true'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.findOne).toHaveBeenCalledWith(
        'testFinder',
        { param: 'value' },
        [{ "kt": "container", "lk": "456" }]
      );
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should use find when one parameter is not true', async () => {
      const mockParentLKA: LocKeyArray<'container'> = [{
        kt: 'container',
        lk: '456'
      }];

      mockParentRoute.getLKA.mockReturnValue(mockParentLKA);

      const mockItems = [{
        id: '123',
        key: {
          kt: 'test',
          pk: '123'
        }
      }];

      // @ts-ignore
      mockLib.find.mockResolvedValue(mockItems);
      req.query = {
        finder: 'testFinder',
        finderParams: JSON.stringify({ param: 'value' }),
        one: 'false'
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.find).toHaveBeenCalledWith(
        'testFinder',
        { param: 'value' },
        [{ "kt": "container", "lk": "456" }]
      );
      expect(mockLib.findOne).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });
  });

});
