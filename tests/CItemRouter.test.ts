/* eslint-disable @typescript-eslint/no-unused-vars */
import { ComKey, Item, LocKeyArray, PriKey, UUID } from "@fjell/core";
import { Request, Response } from "express";
import { ItemRouter } from "@/ItemRouter";
import { CItemRouter } from "@/CItemRouter";
import { Contained } from "@fjell/lib";

jest.mock('@fjell/logging', () => {
  return {
    get: jest.fn().mockReturnThis(),
    getLogger: jest.fn().mockReturnThis(),
    default: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    emergency: jest.fn(),
    alert: jest.fn(),
    critical: jest.fn(),
    notice: jest.fn(),
    time: jest.fn().mockReturnThis(),
    end: jest.fn(),
    log: jest.fn(),
  }
});
jest.mock("@fjell/lib");

describe("CItemRouter", () => {
  let mockLib: jest.Mocked<Contained.Operations<TestItem, "test", "container">>;
  let mockParentRoute: jest.Mocked<ItemRouter<"container", never, never, never, never, never>>;
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
    jest.resetAllMocks();
    mockLib = {
      find: jest.fn(),
      all: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Contained.Operations<TestItem, "test", "container">>;
    mockParentRoute = {
      getLKA: jest.fn(),
      getLk: jest.fn(),
      getPk: jest.fn(),
      getPkType: jest.fn(),
      getLocations: jest.fn(),
    } as unknown as jest.Mocked<ItemRouter<"container", never, never, never, never, never>>;
    router = new CItemRouter(mockLib, "test", mockParentRoute);

    req = {} as Request;
    res = {
      json: jest.fn(),
      locals: {},
    } as unknown as Response;

  });

  it("should return true if it has a parent", () => {
    expect(router.hasParent()).toBe(true);
  });

  it("should return the correct ComKey", () => {
    jest.spyOn(router, "getPk").mockReturnValue(priKey);
    jest.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    const result = router.getIk(res);

    expect(result).toEqual({ kt: priKey.kt, pk: priKey.pk, loc: locKeyArray });
  });

  it("should return the correct LocKeyArray", () => {

    res.locals = { testPk: "1-1-1-1-1" };

    jest.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
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

    jest.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    mockLib.all = jest.fn().mockResolvedValue(items);

    await router['findItems'](req, res);

    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(mockLib.all).toHaveBeenCalledWith(expect.any(Object), locKeyArray);
    expect(res.json).toHaveBeenCalledWith(items.map((item) => expect.any(Object)));
  });

  it("should handle errors in findItems", async () => {
    const query = { some: "query" };
    req.query = query;

    jest.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    mockLib.all = jest.fn().mockRejectedValue(new Error("Test error"));

    await expect(router['findItems'](req, res)).rejects.toThrow("Test error");

    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(mockLib.all).toHaveBeenCalledWith(expect.any(Object), locKeyArray);
  });

  it("should create an item and return it as JSON", async () => {
    req.body = testItem;

    jest.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    jest.spyOn(router, "convertDates").mockReturnValue(testItem);
    mockLib.create = jest.fn().mockResolvedValue(testItem);
    jest.spyOn(router, "postCreateItem").mockResolvedValue(testItem);

    await router['createItem'](req, res);

    expect(router.getLocations).toHaveBeenCalledWith(res);
    expect(router.convertDates).toHaveBeenCalledWith(testItem);
    expect(mockLib.create).toHaveBeenCalledWith(testItem, { locations: locKeyArray });
    expect(router.postCreateItem).toHaveBeenCalledWith(testItem);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should handle errors in createItem", async () => {
    req.body = testItem;

    jest.spyOn(router, "getLocations").mockReturnValue(locKeyArray);
    jest.spyOn(router, "convertDates").mockReturnValue(testItem);
    mockLib.create = jest.fn().mockRejectedValue(new Error("Test error"));

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

      jest.spyOn(router as any, 'getLk').mockReturnValue(mockLk);
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
        finderParams: JSON.stringify({param: 'value'})
      };

      await router['findItems'](req as Request, res as Response);

      expect(mockLib.find).toHaveBeenCalledWith('testFinder', {param: 'value'}, [{"kt": "container", "lk": "456"}]);
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

      jest.spyOn(router as any, 'getLk').mockReturnValue(mockLk);
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

      expect(mockLib.all).toHaveBeenCalledWith({"limit": 10}, [{"kt": "container", "lk": "456"}]);
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });
  });

});