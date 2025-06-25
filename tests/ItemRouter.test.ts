/* eslint-disable @typescript-eslint/no-unused-vars, no-undefined */
import { ItemRouter } from "@/ItemRouter";
import { ComKey, Item, LocKey, LocKeyArray, PriKey, UUID } from "@fjell/core";
import { NotFoundError } from "@fjell/lib";
import { Request, Response, Router } from "express";
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

  protected getIk(res: Response): PriKey<"test"> | ComKey<"test", "container"> {
    return comKey;
  }

  protected getLocations = (res: Response): [LocKey<"container">] => {
    return locKeyArray;
  }

  public createItem = async (req: Request, res: Response): Promise<void> => {
    res.json(testItem);
  }

  public findItems = async (req: Request, res: Response): Promise<void> => {
    const items = [testItem] as TestItem[];
    res.json(items);
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
  let lib: any;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    lib = {
      operations: {
        get: vi.fn(),
        remove: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        all: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        action: vi.fn().mockImplementation(async (ik, actionKey, body) => {
          if (actionKey === 'customAction') {
            return { customAction: true, ...testItem };
          }
          throw new Error('Action not found');
        }),
        facet: vi.fn().mockImplementation(async (ik, facetKey, params) => {
          if (facetKey === 'customFacet') {
            return { facet: "customFacet", item: testItem };
          }
          throw new Error('Facet not found');
        }),
        allAction: vi.fn().mockImplementation(async (allActionKey, allActionParams) => {
          if (allActionKey === 'customAllAction') {
            return { allAction: true, ...testItem };
          }
          throw new Error('All Action not found');
        }),
        allFacet: vi.fn().mockImplementation(async (allFacetKey, allFacetParams) => {
          if (allFacetKey === 'customAllFacet') {
            return { facet: "customAllFacet", data: testItem };
          }
          throw new Error('All Facet not found');
        })
      },
      definition: {
        options: {
          actions: {
            customAction: vi.fn().mockResolvedValue({ customAction: true }),
          },
          facets: {
            customFacet: vi.fn().mockResolvedValue({ facet: "customFacet" }),
          },
          allActions: {
            customAllAction: vi.fn().mockResolvedValue({ allAction: true }),
          },
          allFacets: {
            customAllFacet: vi.fn().mockResolvedValue({ facet: "customAllFacet" }),
          }
        }
      }
    };
    router = new TestItemRouter(lib, "test");
    router['configure'](Router());
    req = {
      params: {},
      body: {},
      query: {},
      originalUrl: '/test/123'
    };
    res = {
      locals: {},
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  it("should create router with options", () => {
    const options = {};
    const routerWithOptions = new TestItemRouter(lib, "test", options);
    expect(routerWithOptions).toBeDefined();
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

  it("should validate primary key value correctly", () => {
    const next = vi.fn();
    req.params = { testPk: "1-1-1-1-1" };
    router["validatePrimaryKeyValue"](req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    // @ts-ignore
    expect(res.locals["testPk"]).toBe("1-1-1-1-1");
  });

  it("should return error for invalid primary key value", () => {
    const next = vi.fn();
    req.params = { testPk: "undefined" };
    router["validatePrimaryKeyValue"](req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid Primary Key", path: req.originalUrl });
  });

  it("should configure child routers correctly", () => {
    const childRouter = Router();
    router.addChildRouter("child", childRouter);
    const expressRouter = Router();
    router["configureChildRouters"](expressRouter, router["childRouters"]);
    expect(expressRouter.stack).toHaveLength(1);
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
    lib.operations.remove.mockReturnValue(Promise.resolve(testItem));
    const response = await router['deleteItem'](req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should call getIk in deleteItem", async () => {
    const getIkSpy = vi.spyOn(router as any, "getIk");
    lib.operations.remove.mockResolvedValue(testItem);
    await router['deleteItem'](req as Request, res as Response);
    expect(getIkSpy).toHaveBeenCalled();
  });

  it("should get an item", async () => {
    lib.operations.get = vi.fn().mockResolvedValue(testItem);
    res.locals = { testPk: "1-1-1-1-1" };

    const response = await router['getItem'](req as Request, res as Response);
    expect(lib.operations.get).toHaveBeenCalledWith(comKey);
    expect(res.json).toHaveBeenCalledWith(testItem);
  });

  it("should return 404 if item is not found in getItem", async () => {
    const error = new NotFoundError("Item not found", { kta: ['test', 'container'], scopes: [] }, comKey);
    lib.operations.get = vi.fn().mockRejectedValue(error);
    res.locals = { testPk: "1-1-1-1-1" };

    const response = await router['getItem'](req as Request, res as Response);
    expect(lib.operations.get).toHaveBeenCalledWith(comKey);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      ik: comKey,
      message: "Item Not Found",
    });
  });

  it("should return 500 if somthing unknown fails", async () => {
    const error = new Error("Something Broke");
    lib.operations.get = vi.fn().mockRejectedValue(error);
    res.locals = { testPk: "1-1-1-1-1" };

    const response = await router['getItem'](req as Request, res as Response);
    expect(lib.operations.get).toHaveBeenCalledWith(comKey);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ik: comKey,
      message: "General Error",
    });
  });

  describe("updateItem", () => {
    it("should update an item", async () => {
      const updatedItem = {
        ...testItem,
        stuff: false
      };

      lib.operations.update = vi.fn().mockResolvedValue(updatedItem);
      req.body = updatedItem;
      res.locals = { testPk: "1-1-1-1-1" };

      const response = await router['updateItem'](req as Request, res as Response);
      expect(lib.operations.update).toHaveBeenCalledWith(comKey, updatedItem);
      expect(res.json).toHaveBeenCalledWith(updatedItem);
    });

    it("should call getIk in updateItem", async () => {
      const getIkSpy = vi.spyOn(router as any, "getIk");
      lib.operations.update = vi.fn().mockResolvedValue(testItem);
      req.body = testItem;
      res.locals = { testPk: "1-1-1-1-1" };

      await router['updateItem'](req as Request, res as Response);
      expect(getIkSpy).toHaveBeenCalled();
    });

    it("should handle updateItem error paths", async () => {
      const error = new Error("Update failed");
      lib.operations.update = vi.fn().mockRejectedValue(error);
      req.body = testItem;
      res.locals = { testPk: "1-1-1-1-1" };

      await expect(router['updateItem'](req as Request, res as Response)).rejects.toThrow("Update failed");
    });
  });

  describe('Key methods', () => {
    it('should return the correct LKA', () => {
      res.locals = { testPk: "1-1-1-1-1" };

      const lka = router['getLKA'](res as Response);
      expect(lka).toEqual([{ kt: "test", lk: "1-1-1-1-1" }]);
    });

    it('should throw an error if getLocations is not implemented', () => {
      const abstractRouter = new ItemRouter(lib, "test");
      expect(() =>
        abstractRouter['getLocations'](res as Response)
      ).toThrow('Method not implemented in an abstract router');
    });

    it('should throw an error if getIk is not implemented', () => {
      const abstractRouter = new ItemRouter(lib, "test");
      expect(() =>
        abstractRouter['getIk'](res as Response)
      ).toThrow('Method not implemented in an abstract router');
    });

    it('should return correct primary key', () => {
      res.locals = { testPk: "1-1-1-1-1" };
      const pk = router.getPk(res as Response);
      expect(pk).toEqual({ kt: "test", pk: "1-1-1-1-1" });
    });

    it('should return correct location key', () => {
      res.locals = { testPk: "1-1-1-1-1" };
      const lk = router['getLk'](res as Response);
      expect(lk).toEqual({ kt: "test", lk: "1-1-1-1-1" });
    });

    it('should return correct primary key type', () => {
      const pkType = router.getPkType();
      expect(pkType).toBe("test");
    });
  });

  describe('postItemAction', () => {
    it('should call the item action', async () => {
      res.locals = { testPk: "1-1-1-1-1" };

      // @ts-ignore
      req.path = '/test/123/customAction';
      const response = await router['postItemAction'](req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith({ customAction: true, ...testItem });
    });

    it('test calling an action that doesnt exist', async () => {
      res.locals = { testPk: "1-1-1-1-1" };

      // @ts-ignore
      req.path = '/test/123/customActionMissing';
      const response = await router['postItemAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('test calling an action on an abstract router with no item actions', async () => {
      const libWithoutActions = {
        operations: {
          get: vi.fn(),
          remove: vi.fn(),
          update: vi.fn(),
        },
        definition: {
          options: {}
        }
      };
      const abstractRouter = new TestItemRouterNoActions(libWithoutActions as any, "test");
      // @ts-ignore
      req.path = '/test/123/customAction';
      const response = await abstractRouter['postItemAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Actions are not configured' });
    });

    it('should handle error when lib.action fails in postItemAction', async () => {
      const error = new Error("Database error");
      lib.operations.action = vi.fn().mockRejectedValue(error);
      res.locals = { testPk: "1-1-1-1-1" };

      // @ts-ignore
      req.path = '/test/123/customAction';
      await router['postItemAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });
  });

  describe('getItemFacet', () => {
    it('should call the item facet successfully', async () => {
      res.locals = { testPk: "1-1-1-1-1" };

      // @ts-ignore
      req.path = '/test/123/customFacet';
      await router['getItemFacet'](req as Request, res as Response);
      expect(lib.operations.facet).toHaveBeenCalledWith(comKey, 'customFacet', req.params);
      expect(res.json).toHaveBeenCalledWith({ facet: "customFacet", item: testItem });
    });

    it('should return error when facets are not configured', async () => {
      const libWithoutFacets = {
        operations: {
          get: vi.fn(),
          remove: vi.fn(),
          update: vi.fn(),
        },
        definition: {
          options: {}
        }
      };
      const abstractRouter = new TestItemRouterNoActions(libWithoutFacets as any, "test");
      // @ts-ignore
      req.path = '/test/123/customFacet';
      await abstractRouter['getItemFacet'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Facets are not configured' });
    });

    it('should handle error when lib.facet fails in getItemFacet', async () => {
      const error = new Error("Database error");
      lib.operations.facet = vi.fn().mockRejectedValue(error);
      res.locals = { testPk: "1-1-1-1-1" };

      // @ts-ignore
      req.path = '/test/123/customFacet';
      await router['getItemFacet'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });
  });

  describe('postCreateItem and convertDates', () => {
    it('should call postCreateItem hook', async () => {
      const result = await router.postCreateItem(testItem);
      expect(result).toEqual(testItem);
    });

    it('should handle item with no events property', () => {
      const itemWithoutEvents: Partial<TestItem> = { ...testItem };
      delete itemWithoutEvents.events;

      const convertedItem = router["convertDates"](itemWithoutEvents as TestItem);
      expect(convertedItem.events).toBeUndefined();
    });
  });

  describe('configure method branches', () => {
    it('should configure router with multiple child routers', () => {
      const childRouter1 = Router();
      const childRouter2 = Router();
      router.addChildRouter("child1", childRouter1);
      router.addChildRouter("child2", childRouter2);

      const expressRouter = Router();
      router["configureChildRouters"](expressRouter, router["childRouters"]);
      expect(expressRouter.stack).toHaveLength(2);
    });
  });

  describe('postAllAction', () => {
    it('should call the all action successfully', async () => {
      // @ts-ignore
      req.path = '/test/customAllAction';
      await router['postAllAction'](req as Request, res as Response);
      expect(lib.operations.allAction).toHaveBeenCalledWith('customAllAction', req.body);
      expect(res.json).toHaveBeenCalledWith({ allAction: true, ...testItem });
    });

    it('should return error when allActions are not configured', async () => {
      const libWithoutAllActions = {
        operations: {
          get: vi.fn(),
          remove: vi.fn(),
          update: vi.fn(),
        },
        definition: {
          options: {}
        }
      };
      const abstractRouter = new TestItemRouterNoActions(libWithoutAllActions as any, "test");
      // @ts-ignore
      req.path = '/test/customAllAction';
      await abstractRouter['postAllAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Actions are not configured' });
    });

    it('should return error when specific allAction does not exist', async () => {
      // @ts-ignore
      req.path = '/test/nonExistentAllAction';
      await router['postAllAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Action is not configured' });
    });

    it('should handle error when lib.allAction fails', async () => {
      const error = new Error("Database error");
      lib.operations.allAction = vi.fn().mockRejectedValue(error);
      // @ts-ignore
      req.path = '/test/customAllAction';
      await router['postAllAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });

    it('should extract action key correctly from different path formats', async () => {
      const testCases = [
        '/test/action1',
        '/test/deep/path/action2',
        '/action3'
      ];

      for (const path of testCases) {
        const expectedActionKey = path.substring(path.lastIndexOf('/') + 1);
        // @ts-ignore
        req.path = path;
        await router['postAllAction'](req as Request, res as Response);
        if (expectedActionKey === 'customAllAction') {
          expect(lib.operations.allAction).toHaveBeenCalledWith(expectedActionKey, req.body);
        }
      }
    });
  });

  describe('getAllFacet', () => {
    it('should call the all facet successfully', async () => {
      // @ts-ignore
      req.path = '/test/customAllFacet';
      await router['getAllFacet'](req as Request, res as Response);
      expect(lib.operations.allFacet).toHaveBeenCalledWith('customAllFacet', { ...req.query, ...req.params });
      expect(res.json).toHaveBeenCalledWith({ facet: "customAllFacet", data: testItem });
    });

    it('should return error when allFacets are not configured', async () => {
      const libWithoutAllFacets = {
        operations: {
          get: vi.fn(),
          remove: vi.fn(),
          update: vi.fn(),
        },
        definition: {
          options: {}
        }
      };
      const abstractRouter = new TestItemRouterNoActions(libWithoutAllFacets as any, "test");
      // @ts-ignore
      req.path = '/test/customAllFacet';
      await abstractRouter['getAllFacet'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Facets are not configured' });
    });

    it('should return error when specific allFacet does not exist', async () => {
      // @ts-ignore
      req.path = '/test/nonExistentAllFacet';
      await router['getAllFacet'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Facet is not configured' });
    });

    it('should handle error when lib.allFacet fails', async () => {
      const error = new Error("Database error");
      lib.operations.allFacet = vi.fn().mockRejectedValue(error);
      // @ts-ignore
      req.path = '/test/customAllFacet';
      await router['getAllFacet'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });

    it('should extract facet key correctly from different path formats', async () => {
      const testCases = [
        '/test/facet1',
        '/test/deep/path/facet2',
        '/facet3'
      ];

      for (const path of testCases) {
        const expectedFacetKey = path.substring(path.lastIndexOf('/') + 1);
        // @ts-ignore
        req.path = path;
        await router['getAllFacet'](req as Request, res as Response);
        if (expectedFacetKey === 'customAllFacet') {
          expect(lib.operations.allFacet).toHaveBeenCalledWith(expectedFacetKey, { ...req.query, ...req.params });
        }
      }
    });

    it('should handle empty query and params correctly', async () => {
      req.query = {};
      req.params = {};
      // @ts-ignore
      req.path = '/test/customAllFacet';
      await router['getAllFacet'](req as Request, res as Response);
      expect(lib.operations.allFacet).toHaveBeenCalledWith('customAllFacet', {});
    });

    it('should combine query and params with params overriding query', async () => {
      req.query = { a: '1', b: '2' };
      req.params = { b: '3', c: '4' };
      // @ts-ignore
      req.path = '/test/customAllFacet';
      await router['getAllFacet'](req as Request, res as Response);
      expect(lib.operations.allFacet).toHaveBeenCalledWith('customAllFacet', { a: '1', b: '3', c: '4' });
    });
  });
});
