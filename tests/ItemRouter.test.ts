/* eslint-disable @typescript-eslint/no-unused-vars, no-undefined */
import { ComKey, Item, LocKey, LocKeyArray, PriKey, UUID } from "@fjell/core";
import { Operations } from "@fjell/lib";
import { Request, Response, Router } from "express";
import { ActionMethod, AllActionMethods, ItemRouter } from "@/ItemRouter";

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

class TestItemRouter extends ItemRouter<"test", "container"> {
  protected configureItemActions(): Record<string, ActionMethod> {
    return {
      // eslint-disable-next-line max-params
      customAction: async (req, res, item, params, body) => {
        return { ...item, customAction: true };
      }
    };
  }

  protected configureAllActions(): Record<string, AllActionMethods> {
    return {
      allAction: [
        (req, res) => res.json({ action: "allAction" })
      ]
    };
  }

  protected getIk(res: Response): PriKey<"test"> | ComKey<"test", "container"> {
    return comKey;
  }

  protected getLocations = (res: Response): [LocKey<"container">] => {
    return locKeyArray;
  }

  public createItem = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    return res.json(testItem);
  }

  public findItems = async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
    const items = [testItem] as TestItem[];
    return res.json(items);
  }
}

class TestItemRouterNoActions extends ItemRouter<"test", "container"> {

  protected getIk(res: Response): PriKey<"test"> | ComKey<"test", "container"> {
    return comKey;
  }

  protected getLocations = (res: Response): [LocKey<"container">] => {
    return locKeyArray;
  }
}

describe("ItemRouter", () => {
  let router: TestItemRouter;
  let lib: jest.Mocked<Operations<Item<"test", "container">, "test", "container">>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    lib = {
      get: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<Operations<Item<"test", "container">, "test", "container">>;
    router = new TestItemRouter(lib, "test");
    router['configure'](Router());
    req = {
      params: {},
      body: {},
      query: {}
    };
    res = {
      locals: {},
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  it("should configure router with item actions", () => {
    const expressRouter = router.getRouter();
    expect(expressRouter).toBeDefined();
  });

  it("should create an item", async () => {
    const response = await router.createItem(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should find items", async () => {
    const response = await router.findItems(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith([testItem]);
  });

  it("should return the correct primary key parameter", () => {
    // @ts-ignore
    const pkParam = router.getPkParam();
    expect(pkParam).toBe("testPk");
  });

  it("should configure the router correctly", () => {
    const expressRouter = Router();
    const configureSpy = jest.spyOn(router as any, "configure");
    router.getRouter();
    expect(configureSpy).toHaveBeenCalled();
  });

  it("should validate primary key value correctly", () => {
    const next = jest.fn();
    req.params = { testPk: "1-1-1-1-1" };
    router["validatePrimaryKeyValue"](req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    // @ts-ignore
    expect(res.locals["testPk"]).toBe("1-1-1-1-1");
  });

  it("should return error for invalid primary key value", () => {
    const next = jest.fn();
    req.params = { testPk: "undefined" };
    router["validatePrimaryKeyValue"](req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid Primary Key", path: req.path });
  });

  it("should configure child routers correctly", () => {
    const childRouter = Router();
    router.addChildRouter("child", childRouter);
    const expressRouter = Router();
    router["configureChildRouters"](expressRouter, router["childRouters"]);
    expect(expressRouter.stack).toHaveLength(1);
  });

  it("should handle all actions", async () => {
    const nextFunction = jest.fn();
    const allActions = router["configureAllActions"]();
    const allAction = allActions["allAction"][0];
    await allAction(req as Request, res as Response, nextFunction);
    expect(res.json).toHaveBeenCalledWith({ action: "allAction" });
  });

  it("should return true for valid primary key parameter", () => {
    const validPkParam = router["validatePKParam"]("1-1-1-1-1");
    expect(validPkParam).toBe(true);
  });

  it("should return false for empty primary key parameter", () => {
    const validPkParam = router["validatePKParam"]("");
    expect(validPkParam).toBe(false);
  });

  it("should return false for 'undefined' primary key parameter", () => {
    const validPkParam = router["validatePKParam"]("undefined");
    expect(validPkParam).toBe(false);
  });

  it("should convert dates correctly in item events", () => {
    const itemWithDates = {
      ...testItem,
      events: {
        created: { at: "2023-01-01T00:00:00Z" },
        updated: { at: "2023-01-02T00:00:00Z" },
        deleted: { at: null }
      }
    };

    // @ts-ignore
    const convertedItem = router["convertDates"](itemWithDates);
    expect(convertedItem.events?.created.at).toBeInstanceOf(Date);
    expect(convertedItem.events?.updated.at).toBeInstanceOf(Date);
    expect(convertedItem.events?.deleted.at).toBeNull();
  });

  it("should handle empty events object in convertDates", () => {
    const itemWithEmptyEvents = {
      ...testItem,
      events: {}
    };

    const convertedItem = router["convertDates"](itemWithEmptyEvents);
    expect(convertedItem.events).toEqual({});
  });

  it("should handle null dates in convertDates", () => {
    const itemWithNullDates = {
      ...testItem,
      events: {
        created: { at: null },
        updated: { at: null },
        deleted: { at: null }
      }
    };

    const convertedItem = router["convertDates"](itemWithNullDates);
    expect(convertedItem.events?.created.at).toBeNull();
    expect(convertedItem.events?.updated.at).toBeNull();
    expect(convertedItem.events?.deleted.at).toBeNull();
  });

  it("should not modify item if events are not present in convertDates", () => {
    const itemWithoutEvents = {
      ...testItem,
      events: undefined
    };

    const convertedItem = router["convertDates"](itemWithoutEvents);
    expect(convertedItem).toEqual(itemWithoutEvents);
  });

  it("should delete an item", async () => {
    lib.remove.mockReturnValue(Promise.resolve(testItem));
    const response = await router['deleteItem'](req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should call getIk in deleteItem", async () => {
    const getIkSpy = jest.spyOn(router as any, "getIk");
    lib.remove.mockResolvedValue(testItem);
    await router['deleteItem'](req as Request, res as Response);
    expect(getIkSpy).toHaveBeenCalled();
  });

  it("should get an item", async () => {
    lib.get = jest.fn().mockResolvedValue(testItem);
    res.locals = { testPk: "1-1-1-1-1" };

    const response = await router['getItem'](req as Request, res as Response);
    expect(lib.get).toHaveBeenCalledWith(comKey);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should return 404 if item is not found in getItem", async () => {
    const error = new Error("Item not found");
    lib.get = jest.fn().mockRejectedValue(error);
    res.locals = { testPk: "1-1-1-1-1" };

    const response = await router['getItem'](req as Request, res as Response);
    expect(lib.get).toHaveBeenCalledWith(comKey);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(error);
  });

  describe("updateItem", () => {
    it("should update an item", async () => {
      const updatedItem = {
        ...testItem,
        stuff: false
      };

      lib.update = jest.fn().mockResolvedValue(updatedItem);
      req.body = updatedItem;
      res.locals = { testPk: "1-1-1-1-1" };

      const response = await router['updateItem'](req as Request, res as Response);
      expect(lib.update).toHaveBeenCalledWith(comKey, updatedItem);
      expect(res.json).toHaveBeenCalledWith(updatedItem);
    });

    it("should call getIk in updateItem", async () => {
      const getIkSpy = jest.spyOn(router as any, "getIk");
      lib.update = jest.fn().mockResolvedValue(testItem);
      req.body = testItem;
      res.locals = { testPk: "1-1-1-1-1" };

      await router['updateItem'](req as Request, res as Response);
      expect(getIkSpy).toHaveBeenCalled();
    });
  });

  describe('get LKA, Locations, and Stuff', () => {
    it('should return the correct LKA', () => {
      res.locals = { testPk: "1-1-1-1-1" };

      const lka = router['getLKA'](res as Response);
      expect(lka).toEqual([{ kt: "test", lk: "1-1-1-1-1" }]);
    });

    it('should throw an error if getLocations is not implemented', () => {
      res.locals = { testPk: "1-1-1-1-1" };

      const abstractRouter = new ItemRouter(lib, "test");
      expect(() =>
        abstractRouter['getLocations'](res as Response)
      ).toThrow('Method not implemented in an abstract router');
    });

    it('should throw an error if getIk is not implemented', () => {
      res.locals = { testPk: "1-1-1-1-1" };

      const abstractRouter = new ItemRouter(lib, "test");
      expect(() =>
        abstractRouter['getIk'](res as Response)
      ).toThrow('Method not implemented in an abstract router');
    });
  });
  
  describe('postItemAction', () => {
    it('should call the item action', async () => {
      lib.get = jest.fn().mockResolvedValue(testItem);

      // @ts-ignore
      req.path = '/test/123/customAction';
      const response = await router['postItemAction'](req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ customAction: true, ...testItem });
    });

    it('test calling an action that doesnt exist', async () => {
      lib.get = jest.fn().mockResolvedValue(testItem);

      // @ts-ignore
      req.path = '/test/123/customActionMissing';
      const response = await router['postItemAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('test calling an action on an abstract router with no item actions', async () => {
      const abstractRouter = new TestItemRouterNoActions(lib, "test");
      // @ts-ignore
      req.path = '/test/123/customAction';
      const response = await abstractRouter['postItemAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Actions are not configured' });
    });
  });

});
