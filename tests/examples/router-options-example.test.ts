
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRouterWithCollisions } from '../../examples/router-options-example.js';
import { ItemRouter, ItemRouterOptions } from '../../src/ItemRouter.js';
import { ComKey, Item, LocKeyArray } from '@fjell/core';

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

// Mock @fjell/logging
vi.mock('@fjell/logging', () => ({
  default: {
    get: vi.fn().mockReturnValue({
      get: vi.fn(),
      getLogger: vi.fn(),
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
    }),
    getLogger: vi.fn().mockReturnValue({
      get: vi.fn(),
      getLogger: vi.fn(),
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
    })
  }
}));

// Mock @fjell/lib
vi.mock('@fjell/lib');

type User = Item<"user", "tenant">;

describe('Router Options Example', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockLib: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock library with conflicting options
    mockLib = {
      operations: {
        get: vi.fn().mockResolvedValue({
          key: { kt: "user", pk: "user-1", loc: [{ kt: "tenant", lk: "tenant-1" }] },
          name: "John Doe",
          email: "john@example.com",
          events: {
            created: { at: new Date() },
            updated: { at: new Date() },
            deleted: { at: null }
          }
        }),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        all: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        action: vi.fn().mockImplementation(async (ik, actionKey) => ({
          source: "library",
          action: actionKey,
          ik
        })),
        facet: vi.fn().mockImplementation(async (ik, facetKey) => ({
          source: "library",
          facet: facetKey,
          ik
        })),
        allAction: vi.fn().mockImplementation(async (actionKey) => ({
          source: "library",
          allAction: actionKey
        })),
        allFacet: vi.fn().mockImplementation(async (facetKey) => ({
          source: "library",
          allFacet: facetKey
        }))
      },
      options: {
        actions: {
          activate: vi.fn().mockResolvedValue({ source: "library", action: "activate" }),
          archive: vi.fn().mockResolvedValue({ source: "library", action: "archive" })
        },
        facets: {
          profile: vi.fn().mockResolvedValue({ source: "library", facet: "profile" }),
          settings: vi.fn().mockResolvedValue({ source: "library", facet: "settings" })
        },
        allActions: {
          bulkUpdate: vi.fn().mockResolvedValue({ source: "library", allAction: "bulkUpdate" }),
          export: vi.fn().mockResolvedValue({ source: "library", allAction: "export" })
        },
        allFacets: {
          analytics: vi.fn().mockResolvedValue({ source: "library", allFacet: "analytics" }),
          dashboard: vi.fn().mockResolvedValue({ source: "library", allFacet: "dashboard" })
        }
      }
    };

    // Setup mock request and response
    req = {
      params: { userPk: "user-1" },
      body: {},
      query: {},
      path: '/users/user-1',
      originalUrl: '/users/user-1'
    };

    res = {
      locals: { userPk: "user-1", tenantId: "tenant-1" },
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  describe('createRouterWithCollisions', () => {
    it('should create a router successfully', () => {
      const result = createRouterWithCollisions();

      expect(result).toBeDefined();
      expect(result.userRouter).toBeDefined();
      expect(result.expressRouter).toBeDefined();
    });

    it('should return an ItemRouter instance', () => {
      const { userRouter } = createRouterWithCollisions();

      expect(userRouter).toBeInstanceOf(ItemRouter);
    });

    it('should return an Express Router instance', () => {
      const { expressRouter } = createRouterWithCollisions();

      expect(expressRouter).toBeDefined();
      expect(typeof expressRouter.use).toBe('function');
      expect(typeof expressRouter.get).toBe('function');
      expect(typeof expressRouter.post).toBe('function');
    });
  });

  describe('UserRouter with collision options', () => {
    class TestUserRouter extends ItemRouter<"user", "tenant"> {
      protected getIk(res: Response): ComKey<"user", "tenant"> {
        return {
          kt: "user",
          pk: res.locals.userPk,
          loc: [{ kt: "tenant", lk: res.locals.tenantId || "tenant-1" }]
        };
      }

      protected getLocations(res: Response): LocKeyArray<"tenant"> {
        return [{ kt: "tenant", lk: res.locals.tenantId || "tenant-1" }];
      }

      public createItem = async (req: Request, res: Response): Promise<void> => {
        const newUser: User = {
          key: { kt: "user", pk: "user-new", loc: this.getLocations(res) },
          name: req.body.name || "New User",
          email: req.body.email || "new@example.com",
          events: {
            created: { at: new Date() },
            updated: { at: new Date() },
            deleted: { at: null }
          }
        };
        res.json(newUser);
      };

      public findItems = async (req: Request, res: Response): Promise<void> => {
        const users: User[] = [];
        res.json(users);
      };
    }

    it('should create router with collision options successfully', () => {
      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          activate: vi.fn().mockResolvedValue({ source: "router", action: "activate" }),
          archive: vi.fn().mockResolvedValue({ source: "router", action: "archive" })
        },
        facets: {
          profile: vi.fn().mockResolvedValue({ source: "router", facet: "profile" }),
          settings: vi.fn().mockResolvedValue({ source: "router", facet: "settings" })
        },
        allActions: {
          bulkUpdate: vi.fn().mockResolvedValue({ source: "router", allAction: "bulkUpdate" }),
          export: vi.fn().mockResolvedValue({ source: "router", allAction: "export" })
        },
        allFacets: {
          analytics: vi.fn().mockResolvedValue({ source: "router", allFacet: "analytics" }),
          dashboard: vi.fn().mockResolvedValue({ source: "router", allFacet: "dashboard" })
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);

      expect(router).toBeDefined();
      expect(router.getPkType()).toBe("user");

      // Verify that the router can be configured without errors
      expect(() => router['configure'](Router())).not.toThrow();
    });

    it('should use router-level handlers when there are collisions', async () => {
      const routerActionSpy = vi.fn().mockResolvedValue({
        source: "router",
        action: "activate"
      });

      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          activate: routerActionSpy
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.path = '/users/user-1/activate';

      await router['postItemAction'](req as Request, res as Response);

      // Verify router-level handler was called
      expect(routerActionSpy).toHaveBeenCalled();
      // Verify library handler was NOT called
      expect(mockLib.operations.action).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        source: "router",
        action: "activate"
      });
    });

    it('should use router-level facet handlers when there are collisions', async () => {
      const routerFacetSpy = vi.fn().mockResolvedValue({
        source: "router",
        facet: "profile"
      });

      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        facets: {
          profile: routerFacetSpy
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.path = '/users/user-1/profile';

      await router['getItemFacet'](req as Request, res as Response);

      // Verify router-level handler was called
      expect(routerFacetSpy).toHaveBeenCalled();
      // Verify library handler was NOT called
      expect(mockLib.operations.facet).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        source: "router",
        facet: "profile"
      });
    });

    it('should use router-level allAction handlers when there are collisions', async () => {
      const routerAllActionSpy = vi.fn().mockResolvedValue({
        source: "router",
        allAction: "bulkUpdate"
      });

      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        allActions: {
          bulkUpdate: routerAllActionSpy
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.path = '/users/bulkUpdate';

      await router['postAllAction'](req as Request, res as Response);

      // Verify router-level handler was called
      expect(routerAllActionSpy).toHaveBeenCalled();
      // Verify library handler was NOT called
      expect(mockLib.operations.allAction).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        source: "router",
        allAction: "bulkUpdate"
      });
    });

    it('should use router-level allFacet handlers when there are collisions', async () => {
      const routerAllFacetSpy = vi.fn().mockResolvedValue({
        source: "router",
        allFacet: "analytics"
      });

      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        allFacets: {
          analytics: routerAllFacetSpy
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.path = '/users/analytics';

      await router['getAllFacet'](req as Request, res as Response);

      // Verify router-level handler was called
      expect(routerAllFacetSpy).toHaveBeenCalled();
      // Verify library handler was NOT called
      expect(mockLib.operations.allFacet).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        source: "router",
        allFacet: "analytics"
      });
    });

    it('should fall back to library handlers when router-level handlers are not available', async () => {
      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          uniqueRouterAction: vi.fn().mockResolvedValue({ source: "router" })
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.path = '/users/user-1/activate'; // This action exists in library but not in router options

      await router['postItemAction'](req as Request, res as Response);

      // Verify library handler was called since router doesn't have this action
      expect(mockLib.operations.action).toHaveBeenCalledWith(
        {
          kt: "user",
          pk: "user-1",
          loc: [{ kt: "tenant", lk: "tenant-1" }]
        },
        'activate',
        req.body
      );
    });

    it('should handle unique router-only handlers correctly', async () => {
      const uniqueActionSpy = vi.fn().mockResolvedValue({
        source: "router",
        action: "resetPassword"
      });

      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          resetPassword: uniqueActionSpy
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.path = '/users/user-1/resetPassword';

      await router['postItemAction'](req as Request, res as Response);

      // Verify router-level handler was called
      expect(uniqueActionSpy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        source: "router",
        action: "resetPassword"
      });
    });

    it('should properly extract action keys from different path formats', async () => {
      const routerActionSpy = vi.fn().mockResolvedValue({ success: true });

      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          testAction: routerActionSpy
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);

      const testPaths = [
        '/users/user-1/testAction',
        '/api/v1/users/user-1/testAction',
        '/testAction'
      ];

      for (const path of testPaths) {
        vi.clearAllMocks();
        req.path = path;
        await router['postItemAction'](req as Request, res as Response);
        expect(routerActionSpy).toHaveBeenCalled();
      }
    });

    it('should handle empty router options gracefully', () => {
      const routerOptions: ItemRouterOptions<"user", "tenant"> = {};

      expect(() => {
        new TestUserRouter(mockLib, "user", routerOptions);
      }).not.toThrow();
    });

    it('should create item using the router implementation', async () => {
      const router = new TestUserRouter(mockLib, "user");
      req.body = { name: "Test User", email: "test@example.com" };

      await router.createItem(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        key: expect.objectContaining({
          kt: "user",
          pk: "user-new"
        }),
        name: "Test User",
        email: "test@example.com"
      }));
    });

    it('should find items using the router implementation', async () => {
      const router = new TestUserRouter(mockLib, "user");

      await router.findItems(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('Console output verification', () => {
    it('should log collision information when router is created', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      createRouterWithCollisions();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Creating UserRouter'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('collision warnings'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Router-level handler'));

      consoleSpy.mockRestore();
    });
  });
});
1
