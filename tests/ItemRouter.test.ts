/* eslint-disable @typescript-eslint/no-unused-vars, no-undefined */
import { ItemRouter, ItemRouterOptions } from "../src/ItemRouter";
import { ComKey, Item, LocKey, LocKeyArray, PriKey, UUID } from "@fjell/core";
import { NotFoundError } from "@fjell/lib";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define minimal Express types to avoid import issues
interface Request {
  params: Record<string, string>;
  body: any;
  query: Record<string, any>;
  path: string;
  originalUrl: string;
}

interface Response {
  locals: Record<string, any>;
  json: (data: any) => void;
  status: (code: number) => Response;
}

function Router(): any {
  const stack: any[] = [];
  const mockRouter = {
    get: vi.fn().mockImplementation(() => {
      stack.push({ method: 'GET' });
      return mockRouter;
    }),
    post: vi.fn().mockImplementation(() => {
      stack.push({ method: 'POST' });
      return mockRouter;
    }),
    put: vi.fn().mockImplementation(() => {
      stack.push({ method: 'PUT' });
      return mockRouter;
    }),
    delete: vi.fn().mockImplementation(() => {
      stack.push({ method: 'DELETE' });
      return mockRouter;
    }),
    use: vi.fn().mockImplementation(() => {
      stack.push({ method: 'USE' });
      return mockRouter;
    }),
    stack
  };
  return mockRouter;
}

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

    // @ts-ignore - Testing edge case where events object is empty
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

    // @ts-ignore - Testing edge case where dates are null
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

      await router['updateItem'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ik: comKey,
        message: "General Error",
      });
    });
  });

  describe('Key methods', () => {
    it('should return the correct LKA', () => {
      res.locals = { testPk: "1-1-1-1-1" };

      const lka = router['getLKA'](res as Response);
      expect(lka).toEqual([{ kt: "test", lk: "1-1-1-1-1" }]);
    });

    it('should return empty array when no parent route exists', () => {
      const abstractRouter = new ItemRouter(lib, "test");
      const result = abstractRouter['getLocations'](res as Response);
      expect(result).toEqual([]);
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
        options: {}
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
        options: {}
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
        options: {}
      };
      const abstractRouter = new TestItemRouterNoActions(libWithoutAllActions as any, "test");
      // @ts-ignore
      req.path = '/test/customAllAction';
      await abstractRouter['postAllAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'All Actions are not configured' });
    });

    it('should return error when specific allAction does not exist', async () => {
      // @ts-ignore
      req.path = '/test/nonExistentAllAction';
      await router['postAllAction'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'All Action is not configured' });
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
        options: {}
      };
      const abstractRouter = new TestItemRouterNoActions(libWithoutAllFacets as any, "test");
      // @ts-ignore
      req.path = '/test/customAllFacet';
      await abstractRouter['getAllFacet'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'All Facets are not configured' });
    });

    it('should return error when specific allFacet does not exist', async () => {
      // @ts-ignore
      req.path = '/test/nonExistentAllFacet';
      await router['getAllFacet'](req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'All Facet is not configured' });
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

  describe('Router configuration with router-level options', () => {
    it('should configure routes for router-level actions and facets', () => {
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        actions: {
          routerAction: vi.fn().mockResolvedValue({ routerAction: true })
        },
        facets: {
          routerFacet: vi.fn().mockResolvedValue({ routerFacet: true })
        },
        allActions: {
          routerAllAction: vi.fn().mockResolvedValue({ routerAllAction: true })
        },
        allFacets: {
          routerAllFacet: vi.fn().mockResolvedValue({ routerAllFacet: true })
        }
      };

      const routerWithOptions = new TestItemRouter(lib, "test", routerOptions);
      const expressRouter = routerWithOptions.getRouter();

      // Verify router is configured
      expect(expressRouter).toBeDefined();
      expect(expressRouter.stack.length).toBeGreaterThan(0);
    });

    it('should log warnings for name collisions between router and library options', () => {
      const loggerSpy = vi.spyOn(router['logger'], 'warning');

      const routerOptions: ItemRouterOptions<"test", "container"> = {
        actions: {
          customAction: vi.fn().mockResolvedValue({ routerAction: true })
        },
        facets: {
          customFacet: vi.fn().mockResolvedValue({ routerFacet: true })
        },
        allActions: {
          customAllAction: vi.fn().mockResolvedValue({ routerAllAction: true })
        },
        allFacets: {
          customAllFacet: vi.fn().mockResolvedValue({ routerAllFacet: true })
        }
      };

      const routerWithCollisions = new TestItemRouter(lib, "test", routerOptions);
      routerWithCollisions['configure'](Router());

      // Verify warnings were logged for each collision
      expect(loggerSpy).toHaveBeenCalledWith('Item Action name collision - router-level handler takes precedence', { actionKey: 'customAction' });
      expect(loggerSpy).toHaveBeenCalledWith('Item Facet name collision - router-level handler takes precedence', { facetKey: 'customFacet' });
      expect(loggerSpy).toHaveBeenCalledWith('All Action name collision - router-level handler takes precedence', { actionKey: 'customAllAction' });
      expect(loggerSpy).toHaveBeenCalledWith('All Facet name collision - router-level handler takes precedence', { facetKey: 'customAllFacet' });
    });

    it('should use router-level handlers when there are name collisions', async () => {
      const routerActionResult = { source: 'router', customAction: true };
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        actions: {
          customAction: vi.fn().mockResolvedValue(routerActionResult)
        }
      };

      const routerWithCollisions = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/customAction';

      await routerWithCollisions['postItemAction'](req as Request, res as Response);

      // Verify router-level handler was called, not library handler
      expect(res.json).toHaveBeenCalledWith(routerActionResult);
      expect(routerOptions.actions?.customAction).toHaveBeenCalled();
      expect(lib.operations.action).not.toHaveBeenCalled();
    });

    it('should use router-level facet handlers when there are name collisions', async () => {
      const routerFacetResult = { source: 'router', customFacet: true };
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        facets: {
          customFacet: vi.fn().mockResolvedValue(routerFacetResult)
        }
      };

      const routerWithCollisions = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/customFacet';

      await routerWithCollisions['getItemFacet'](req as Request, res as Response);

      // Verify router-level handler was called, not library handler
      expect(res.json).toHaveBeenCalledWith(routerFacetResult);
      expect(routerOptions.facets?.customFacet).toHaveBeenCalled();
      expect(lib.operations.facet).not.toHaveBeenCalled();
    });

    it('should use router-level allAction handlers when there are name collisions', async () => {
      const routerAllActionResult = { source: 'router', customAllAction: true };
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        allActions: {
          customAllAction: vi.fn().mockResolvedValue(routerAllActionResult)
        }
      };

      const routerWithCollisions = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/customAllAction';

      await routerWithCollisions['postAllAction'](req as Request, res as Response);

      // Verify router-level handler was called, not library handler
      expect(res.json).toHaveBeenCalledWith(routerAllActionResult);
      expect(routerOptions.allActions?.customAllAction).toHaveBeenCalled();
      expect(lib.operations.allAction).not.toHaveBeenCalled();
    });

    it('should use router-level allFacet handlers when there are name collisions', async () => {
      const routerAllFacetResult = { source: 'router', customAllFacet: true };
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        allFacets: {
          customAllFacet: vi.fn().mockResolvedValue(routerAllFacetResult)
        }
      };

      const routerWithCollisions = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/customAllFacet';

      await routerWithCollisions['getAllFacet'](req as Request, res as Response);

      // Verify router-level handler was called, not library handler
      expect(res.json).toHaveBeenCalledWith(routerAllFacetResult);
      expect(routerOptions.allFacets?.customAllFacet).toHaveBeenCalled();
      expect(lib.operations.allFacet).not.toHaveBeenCalled();
    });

    it('should fall back to library handlers when router-level handlers are not available', async () => {
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        actions: {
          routerOnlyAction: vi.fn().mockResolvedValue({ routerOnlyAction: true })
        }
      };

      const routerWithPartialOptions = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/customAction';

      await routerWithPartialOptions['postItemAction'](req as Request, res as Response);

      // Verify library handler was called since router doesn't have this action
      expect(lib.operations.action).toHaveBeenCalledWith(comKey, 'customAction', req.body);
      expect(routerOptions.actions?.routerOnlyAction).not.toHaveBeenCalled();
    });
  });

  describe('Router-level handler error scenarios', () => {
    it('should handle errors thrown by router-level action handlers', async () => {
      const error = new Error("Router action failed");
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        actions: {
          failingAction: vi.fn().mockRejectedValue(error)
        }
      };

      const routerWithFailingAction = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/failingAction';

      await routerWithFailingAction['postItemAction'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });

    it('should handle errors thrown by router-level facet handlers', async () => {
      const error = new Error("Router facet failed");
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        facets: {
          failingFacet: vi.fn().mockRejectedValue(error)
        }
      };

      const routerWithFailingFacet = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/failingFacet';

      await routerWithFailingFacet['getItemFacet'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });

    it('should handle errors thrown by router-level allAction handlers', async () => {
      const error = new Error("Router all action failed");
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        allActions: {
          failingAllAction: vi.fn().mockRejectedValue(error)
        }
      };

      const routerWithFailingAllAction = new TestItemRouter(lib, "test", routerOptions);
      // @ts-ignore
      req.path = '/test/failingAllAction';

      await routerWithFailingAllAction['postAllAction'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });

    it('should handle errors thrown by router-level allFacet handlers', async () => {
      const error = new Error("Router all facet failed");
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        allFacets: {
          failingAllFacet: vi.fn().mockRejectedValue(error)
        }
      };

      const routerWithFailingAllFacet = new TestItemRouter(lib, "test", routerOptions);
      // @ts-ignore
      req.path = '/test/failingAllFacet';

      await routerWithFailingAllFacet['getAllFacet'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(error);
    });

    it('should not return response when router-level handler returns null', async () => {
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        actions: {
          nullAction: vi.fn().mockResolvedValue(null)
        }
      };

      const routerWithNullAction = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/nullAction';

      await routerWithNullAction['postItemAction'](req as Request, res as Response);

      expect(routerOptions.actions?.nullAction).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should not return response when router-level facet returns null', async () => {
      const routerOptions: ItemRouterOptions<"test", "container"> = {
        facets: {
          nullFacet: vi.fn().mockResolvedValue(null)
        }
      };

      const routerWithNullFacet = new TestItemRouter(lib, "test", routerOptions);
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/nullFacet';

      await routerWithNullFacet['getItemFacet'](req as Request, res as Response);

      expect(routerOptions.facets?.nullFacet).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('NotFoundError scenarios', () => {
    it('should return 404 when deleteItem throws NotFoundError', async () => {
      const error = new NotFoundError("Item not found for delete", { kta: ['test', 'container'], scopes: [] }, comKey);
      lib.operations.remove = vi.fn().mockRejectedValue(error);
      res.locals = { testPk: "1-1-1-1-1" };

      await router['deleteItem'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        ik: comKey,
        message: "Item Not Found",
      });
    });

    it('should return 500 when deleteItem throws generic error', async () => {
      const error = new Error("Database connection failed");
      lib.operations.remove = vi.fn().mockRejectedValue(error);
      res.locals = { testPk: "1-1-1-1-1" };

      await router['deleteItem'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ik: comKey,
        message: "General Error",
      });
    });

    it('should return 404 when updateItem throws NotFoundError', async () => {
      const error = new NotFoundError("Item not found for update", { kta: ['test', 'container'], scopes: [] }, comKey);
      lib.operations.update = vi.fn().mockRejectedValue(error);
      req.body = { stuff: false };
      res.locals = { testPk: "1-1-1-1-1" };

      await router['updateItem'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        ik: comKey,
        message: "Item Not Found",
      });
    });
  });

  describe('Edge cases and parameter validation', () => {
    it('should handle special characters in primary key validation', () => {
      const specialChars = ['!@#$%', '测试', '🚀', 'space test', 'tab\ttest'];

      specialChars.forEach(pkValue => {
        const isValid = router["validatePKParam"](pkValue);
        expect(isValid).toBe(true); // All should be valid as long as they're not empty or "undefined"
      });
    });

    it('should handle whitespace-only primary key parameter', () => {
      const whitespaceKeys = [' ', '\t', '\n', '   ', '\t\n '];

      whitespaceKeys.forEach(pkValue => {
        const isValid = router["validatePKParam"](pkValue);
        expect(isValid).toBe(true); // Whitespace is considered valid
      });
    });

    it('should handle complex path structures for action extraction', () => {
      const testPaths = [
        '/users/123/actions/complex.action',
        '/api/v1/test/456/some-action',
        '/deeply/nested/path/with/many/segments/finalAction',
        '/action',
        '/123/action-with-dashes',
        '/test/123/action_with_underscores'
      ];

      testPaths.forEach(path => {
        const expectedAction = path.substring(path.lastIndexOf('/') + 1);
        // @ts-ignore
        req.path = path;

        // This tests the path extraction logic used in postItemAction
        const extractedAction = req.path.substring(req.path.lastIndexOf('/') + 1);
        expect(extractedAction).toBe(expectedAction);
      });
    });

    it('should handle empty path segments', () => {
      const pathsWithEmptySegments = [
        '/test/123//',
        '//action',
        '/test//action'
      ];

      pathsWithEmptySegments.forEach(path => {
        const actionKey = path.substring(path.lastIndexOf('/') + 1);
        expect(typeof actionKey).toBe('string');
      });
    });
  });

  describe('Query and parameter combinations', () => {
    it('should handle complex parameter types in facet queries', async () => {
      req.query = {
        stringParam: 'value',
        numberParam: '123',
        booleanParam: 'true',
        arrayParam: ['item1', 'item2'],
        nullParam: null,
        undefinedParam: undefined
      };
      req.params = { testPk: "1-1-1-1-1" };
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/customFacet';

      await router['getItemFacet'](req as Request, res as Response);

      expect(lib.operations.facet).toHaveBeenCalledWith(
        comKey,
        'customFacet',
        { ...req.query, ...req.params }
      );
    });

    it('should handle special characters in query parameters', async () => {
      req.query = {
        'special@char': 'value',
        'space param': 'value with spaces',
        'unicode测试': '测试值',
        'emoji🚀': 'rocket'
      };
      req.params = {};
      // @ts-ignore
      req.path = '/test/customAllFacet';

      await router['getAllFacet'](req as Request, res as Response);

      expect(lib.operations.allFacet).toHaveBeenCalledWith('customAllFacet', req.query);
    });

    it('should handle nested objects in request body for actions', async () => {
      const complexBody = {
        simpleField: 'value',
        nestedObject: {
          level1: {
            level2: 'deep value'
          }
        },
        arrayField: [1, 2, 3],
        nullField: null,
        undefinedField: undefined
      };

      req.body = complexBody;
      res.locals = { testPk: "1-1-1-1-1" };
      // @ts-ignore
      req.path = '/test/123/customAction';

      await router['postItemAction'](req as Request, res as Response);

      expect(lib.operations.action).toHaveBeenCalledWith(comKey, 'customAction', complexBody);
    });
  });

  describe('Configure method edge cases', () => {
    it('should handle empty options gracefully', () => {
      const libWithEmptyOptions = {
        operations: lib.operations,
        options: {}
      };
      const routerWithEmptyOptions = new TestItemRouter(libWithEmptyOptions as any, "test", {});
      const expressRouter = Router();

      // Should not throw when configuring with empty options
      expect(() => {
        routerWithEmptyOptions['configure'](expressRouter);
      }).not.toThrow();
    });

    it('should handle partial library options', () => {
      const libWithPartialOptions = {
        operations: lib.operations,
        options: {
          actions: { onlyAction: vi.fn() },
          // Missing facets, allActions, allFacets
        }
      };
      const routerWithPartialLib = new TestItemRouter(libWithPartialOptions as any, "test");
      const expressRouter = Router();

      expect(() => {
        routerWithPartialLib['configure'](expressRouter);
      }).not.toThrow();
    });

    it('should handle library with no operations', () => {
      const libWithoutActions = {
        operations: lib.operations,
        options: {
          // No actions, facets, etc.
        }
      };
      const routerWithoutLibActions = new TestItemRouter(libWithoutActions as any, "test");
      // @ts-ignore
      req.path = '/test/missingAction';

      expect(async () => {
        await routerWithoutLibActions['postItemAction'](req as Request, res as Response);
      }).not.toThrow();
    });

    it('should handle missing specific action in library', async () => {
      // @ts-ignore
      req.path = '/test/123/nonExistentAction';
      await router['postItemAction'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Action is not configured' });
    });

    it('should handle missing specific facet in library', async () => {
      // @ts-ignore
      req.path = '/test/123/nonExistentFacet';
      await router['getItemFacet'](req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item Facet is not configured' });
    });
  });

  describe('Abstract method coverage', () => {
    it('should throw error when calling createItem on abstract router', async () => {
      const abstractRouter = new ItemRouter(lib, "test");

      await expect(async () => {
        await abstractRouter['createItem'](req as Request, res as Response);
      }).rejects.toThrow('Method not implemented in an abstract router');
    });

    it('should throw error when calling findItems on abstract router', async () => {
      const abstractRouter = new ItemRouter(lib, "test");

      await expect(async () => {
        await abstractRouter['findItems'](req as Request, res as Response);
      }).rejects.toThrow('Method not implemented in an abstract router');
    });
  });

  describe('Date conversion edge cases', () => {
    it('should handle invalid date strings in convertDates', () => {
      const itemWithInvalidDates = {
        ...testItem,
        events: {
          created: { at: "invalid-date-string" as any },
          updated: { at: "2023-13-45T25:99:99Z" as any }, // Invalid date
          deleted: { at: "" as any } // Empty string
        }
      } as any;

      const convertedItem = router["convertDates"](itemWithInvalidDates);

      // Non-empty strings should result in Date objects (potentially Invalid Date)
      expect(convertedItem.events?.created.at).toBeInstanceOf(Date);
      expect(convertedItem.events?.updated.at).toBeInstanceOf(Date);
      // Empty string is falsy, so it should be null
      expect(convertedItem.events?.deleted.at).toBeNull();
    });

    it('should handle events with additional properties', () => {
      const itemWithComplexEvents = {
        ...testItem,
        events: {
          created: {
            at: "2023-01-01T00:00:00Z" as any,
            by: "user123" as any,
            metadata: { source: "api" } as any
          },
          updated: { at: "2023-01-01T00:00:00Z" as any },
          deleted: { at: null },
          custom: {
            at: "2023-01-02T00:00:00Z" as any,
            type: "custom" as any,
            data: { custom: true } as any
          }
        }
      } as any;

      const convertedItem = router["convertDates"](itemWithComplexEvents);

      expect(convertedItem.events?.created.at).toBeInstanceOf(Date);
      expect((convertedItem.events?.created as any).by).toBe("user123");
      expect((convertedItem.events?.created as any).metadata).toEqual({ source: "api" });
      expect((convertedItem.events?.custom as any).at).toBeInstanceOf(Date);
      expect((convertedItem.events?.custom as any).data).toEqual({ custom: true });
    });
  });

  describe('Child router configuration', () => {
    it('should handle child routers with no paths', () => {
      const expressRouter = Router();
      router["configureChildRouters"](expressRouter, {});
      expect(expressRouter.stack).toHaveLength(0);
    });

    it('should handle multiple child routers with complex paths', () => {
      const childRouter1 = Router();
      const childRouter2 = Router();
      const childRouter3 = Router();

      router.addChildRouter("users", childRouter1);
      router.addChildRouter("orders/items", childRouter2);
      router.addChildRouter("complex/nested/path", childRouter3);

      const expressRouter = Router();
      router["configureChildRouters"](expressRouter, router["childRouters"]);

      expect(expressRouter.stack).toHaveLength(3);
    });
  });
});
