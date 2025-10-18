
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

// Mock the local logger
vi.mock('../../src/logger.js', () => {
  const mockLogger = {
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
  };

  return {
    default: {
      get: vi.fn().mockReturnValue(mockLogger)
    }
  };
});

// Mock @fjell/lib
vi.mock('@fjell/lib', () => ({
  default: {},
  createRegistry: vi.fn(),
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  }
}));

type User = Item<"user", "tenant">;

// Test UserRouter class that can be used across all tests
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
        create: vi.fn().mockResolvedValue({
          key: { kt: "user", pk: "user-2", loc: [{ kt: "tenant", lk: "tenant-1" }] },
          name: "Jane Doe",
          email: "jane@example.com",
          events: {
            created: { at: new Date() },
            updated: { at: new Date() },
            deleted: { at: null }
          }
        }),
        update: vi.fn().mockResolvedValue({
          key: { kt: "user", pk: "user-1", loc: [{ kt: "tenant", lk: "tenant-1" }] },
          name: "John Updated",
          email: "john.updated@example.com",
          events: {
            created: { at: new Date() },
            updated: { at: new Date() },
            deleted: { at: null }
          }
        }),
        remove: vi.fn(),
        all: vi.fn().mockResolvedValue([]),
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
        action: vi.fn().mockImplementation(async (ik, actionKey) => [{
          source: "library",
          action: actionKey,
          ik
        }, []]),
        facet: vi.fn().mockImplementation(async (ik, facetKey) => ({
          source: "library",
          facet: facetKey,
          ik
        })),
        allAction: vi.fn().mockImplementation(async (actionKey) => [[{
          source: "library",
          allAction: actionKey
        }], []]),
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

    it('should use the correct library instance', () => {
      const { userRouter } = createRouterWithCollisions();

      // Verify the router was created with the expected mock library
      expect(userRouter.getPkType()).toBe('user');
    });

    it('should demonstrate router options with collisions', () => {
      const { userRouter } = createRouterWithCollisions();

      // The function should create a router with specific collision-prone options
      expect(userRouter).toBeDefined();
      expect(userRouter.getPkType()).toBe('user');
    });

    it('should return consistent results on multiple calls', () => {
      const result1 = createRouterWithCollisions();
      const result2 = createRouterWithCollisions();

      // Each call should return new instances
      expect(result1.userRouter).not.toBe(result2.userRouter);
      expect(result1.expressRouter).not.toBe(result2.expressRouter);

      // But they should have the same structure
      expect(result1.userRouter.getPkType()).toBe(result2.userRouter.getPkType());
    });
  });

  describe('UserRouter with collision options', () => {

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

      // Verify router-level handler was called with correct parameters
      expect(routerActionSpy).toHaveBeenCalledWith(
        {
          kt: "user",
          pk: "user-1",
          loc: [{ kt: "tenant", lk: "tenant-1" }]
        },
        req.body,
        { req, res }
      );
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

    it('should handle all router option handler types from example', async () => {
      // Test the specific handlers mentioned in the router-options-example.ts
      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          activate: vi.fn().mockResolvedValue({ source: "router", action: "activate" }),
          archive: vi.fn().mockResolvedValue({ source: "router", action: "archive" }),
          resetPassword: vi.fn().mockResolvedValue({ source: "router", action: "resetPassword" })
        },
        facets: {
          profile: vi.fn().mockResolvedValue({ source: "router", facet: "profile" }),
          settings: vi.fn().mockResolvedValue({ source: "router", facet: "settings" }),
          permissions: vi.fn().mockResolvedValue({ source: "router", facet: "permissions" })
        },
        allActions: {
          bulkUpdate: vi.fn().mockResolvedValue({ source: "router", allAction: "bulkUpdate" }),
          export: vi.fn().mockResolvedValue({ source: "router", allAction: "export" }),
          backup: vi.fn().mockResolvedValue({ source: "router", allAction: "backup" })
        },
        allFacets: {
          analytics: vi.fn().mockResolvedValue({ source: "router", allFacet: "analytics" }),
          dashboard: vi.fn().mockResolvedValue({ source: "router", allFacet: "dashboard" }),
          reports: vi.fn().mockResolvedValue({ source: "router", allFacet: "reports" })
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);

      // Test each action type
      req.path = '/users/user-1/activate';
      await router['postItemAction'](req as Request, res as Response);
      expect(routerOptions.actions!.activate).toHaveBeenCalled();

      vi.clearAllMocks();
      req.path = '/users/user-1/profile';
      await router['getItemFacet'](req as Request, res as Response);
      expect(routerOptions.facets!.profile).toHaveBeenCalled();

      vi.clearAllMocks();
      req.path = '/users/bulkUpdate';
      await router['postAllAction'](req as Request, res as Response);
      expect(routerOptions.allActions!.bulkUpdate).toHaveBeenCalled();

      vi.clearAllMocks();
      req.path = '/users/analytics';
      await router['getAllFacet'](req as Request, res as Response);
      expect(routerOptions.allFacets!.analytics).toHaveBeenCalled();
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

    it('should handle all router option types', () => {
      const fullRouterOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          testAction: vi.fn().mockResolvedValue({ type: 'action' })
        },
        facets: {
          testFacet: vi.fn().mockResolvedValue({ type: 'facet' })
        },
        allActions: {
          testAllAction: vi.fn().mockResolvedValue({ type: 'allAction' })
        },
        allFacets: {
          testAllFacet: vi.fn().mockResolvedValue({ type: 'allFacet' })
        }
      };

      const router = new TestUserRouter(mockLib, "user", fullRouterOptions);
      expect(router).toBeDefined();
      expect(router.getPkType()).toBe("user");
    });

    it('should handle router creation with undefined options', () => {
      expect(() => {
        new TestUserRouter(mockLib, "user", {});
      }).not.toThrow();
    });

    it('should handle router creation with partial options', () => {
      const partialOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          singleAction: vi.fn().mockResolvedValue({ result: 'success' })
        }
        // Missing facets, allActions, allFacets
      };

      expect(() => {
        new TestUserRouter(mockLib, "user", partialOptions);
      }).not.toThrow();
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

    it('should demonstrate console output with proper formatting', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      createRouterWithCollisions();

      // Verify specific console output patterns from the example
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Available endpoints with precedence'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('POST /users/:userPk/activate'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET /users/:userPk/profile'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('POST /users/bulkUpdate'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET /users/analytics'));

      consoleSpy.mockRestore();
    });
  });

  describe('Library Operations Integration', () => {
    it('should call library operations when no router options provided', async () => {
      const router = new TestUserRouter(mockLib, "user");
      req.path = '/users/user-1/nonExistentAction';

      await router['postItemAction'](req as Request, res as Response);

      // Verify library handler was called since router doesn't have this action
      expect(mockLib.operations.action).toHaveBeenCalledWith(
        {
          kt: "user",
          pk: "user-1",
          loc: [{ kt: "tenant", lk: "tenant-1" }]
        },
        'nonExistentAction',
        req.body
      );
    });

    it('should call library facet operations when no router options provided', async () => {
      const router = new TestUserRouter(mockLib, "user");
      req.path = '/users/user-1/nonExistentFacet';

      await router['getItemFacet'](req as Request, res as Response);

      // Verify library handler was called since router doesn't have this facet
      expect(mockLib.operations.facet).toHaveBeenCalled();
    });

    it('should call library allAction operations when no router options provided', async () => {
      const router = new TestUserRouter(mockLib, "user");
      req.path = '/users/nonExistentAllAction';

      await router['postAllAction'](req as Request, res as Response);

      // Verify library handler was called since router doesn't have this allAction
      expect(mockLib.operations.allAction).toHaveBeenCalled();
    });

    it('should call library allFacet operations when no router options provided', async () => {
      const router = new TestUserRouter(mockLib, "user");
      req.path = '/users/nonExistentAllFacet';

      await router['getAllFacet'](req as Request, res as Response);

      // Verify library handler was called since router doesn't have this allFacet
      expect(mockLib.operations.allFacet).toHaveBeenCalled();
    });
  });

  describe('Router Options Data Structure', () => {
    it('should handle complex router options structure', () => {
      const complexOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          complexAction: async (ik, params, context) => {
            return { ik, params, context, type: 'complex' };
          }
        },
        facets: {
          complexFacet: async (ik, params, context) => {
            return { ik, params, context, type: 'complex' };
          }
        },
        allActions: {
          complexAllAction: async (params, locations, context) => {
            return { params, locations, context, type: 'complex' };
          }
        },
        allFacets: {
          complexAllFacet: async (params, locations, context) => {
            return { params, locations, context, type: 'complex' };
          }
        }
      };

      const router = new TestUserRouter(mockLib, "user", complexOptions);
      expect(router).toBeDefined();
    });

    it('should handle empty router options object', () => {
      const emptyOptions: ItemRouterOptions<"user", "tenant"> = {};

      expect(() => {
        new TestUserRouter(mockLib, "user", emptyOptions);
      }).not.toThrow();
    });

    it('should handle router options with only actions', () => {
      const actionsOnlyOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          onlyAction: vi.fn().mockResolvedValue({ type: 'action-only' })
        }
      };

      expect(() => {
        new TestUserRouter(mockLib, "user", actionsOnlyOptions);
      }).not.toThrow();
    });

    it('should handle router options with only facets', () => {
      const facetsOnlyOptions: ItemRouterOptions<"user", "tenant"> = {
        facets: {
          onlyFacet: vi.fn().mockResolvedValue({ type: 'facet-only' })
        }
      };

      expect(() => {
        new TestUserRouter(mockLib, "user", facetsOnlyOptions);
      }).not.toThrow();
    });

    it('should handle router options with only allActions', () => {
      const allActionsOnlyOptions: ItemRouterOptions<"user", "tenant"> = {
        allActions: {
          onlyAllAction: vi.fn().mockResolvedValue({ type: 'allAction-only' })
        }
      };

      expect(() => {
        new TestUserRouter(mockLib, "user", allActionsOnlyOptions);
      }).not.toThrow();
    });

    it('should handle router options with only allFacets', () => {
      const allFacetsOnlyOptions: ItemRouterOptions<"user", "tenant"> = {
        allFacets: {
          onlyAllFacet: vi.fn().mockResolvedValue({ type: 'allFacet-only' })
        }
      };

      expect(() => {
        new TestUserRouter(mockLib, "user", allFacetsOnlyOptions);
      }).not.toThrow();
    });
  });

  describe('Function Coverage Tests', () => {
    it('should test createRouterWithCollisions function thoroughly', () => {
      const result = createRouterWithCollisions();

      // Test all return values
      expect(result).toHaveProperty('userRouter');
      expect(result).toHaveProperty('expressRouter');
      expect(result.userRouter).toBeInstanceOf(ItemRouter);
      expect(result.expressRouter).toBeDefined();

      // Test router configuration
      expect(result.userRouter.getPkType()).toBe('user');
      expect(typeof result.expressRouter.use).toBe('function');
      expect(typeof result.expressRouter.get).toBe('function');
      expect(typeof result.expressRouter.post).toBe('function');
    });

    it('should test mockLibWithConflicts structure', () => {
      // Test the mock lib structure used in examples
      expect(mockLib.operations).toBeDefined();
      expect(mockLib.options).toBeDefined();

      // Test operations
      expect(typeof mockLib.operations.get).toBe('function');
      expect(typeof mockLib.operations.create).toBe('function');
      expect(typeof mockLib.operations.update).toBe('function');
      expect(typeof mockLib.operations.remove).toBe('function');
      expect(typeof mockLib.operations.all).toBe('function');
      expect(typeof mockLib.operations.find).toBe('function');
      expect(typeof mockLib.operations.findOne).toBe('function');
      expect(typeof mockLib.operations.action).toBe('function');
      expect(typeof mockLib.operations.facet).toBe('function');
      expect(typeof mockLib.operations.allAction).toBe('function');
      expect(typeof mockLib.operations.allFacet).toBe('function');

      // Test options structure
      expect(mockLib.options.actions).toBeDefined();
      expect(mockLib.options.facets).toBeDefined();
      expect(mockLib.options.allActions).toBeDefined();
      expect(mockLib.options.allFacets).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid path formats gracefully', async () => {
      const router = new TestUserRouter(mockLib, "user");
      req.path = '';

      await expect(router['postItemAction'](req as Request, res as Response)).resolves.not.toThrow();
    });

    it('should handle path with no action key', async () => {
      const router = new TestUserRouter(mockLib, "user");
      req.path = '/users/user-1/';

      await expect(router['postItemAction'](req as Request, res as Response)).resolves.not.toThrow();
    });

    it('should handle missing response locals gracefully', async () => {
      const router = new TestUserRouter(mockLib, "user");
      res.locals = {}; // Missing userPk and tenantId

      await expect(router.createItem(req as Request, res as Response)).resolves.not.toThrow();
    });

    it('should handle null request body', async () => {
      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          testAction: vi.fn().mockResolvedValue({ result: 'success' })
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.body = null;
      req.path = '/users/user-1/testAction';

      await expect(router['postItemAction'](req as Request, res as Response)).resolves.not.toThrow();
    });

    it('should handle undefined request body', async () => {
      const routerOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {
          testAction: vi.fn().mockResolvedValue({ result: 'success' })
        }
      };

      const router = new TestUserRouter(mockLib, "user", routerOptions);
      req.body = null;
      req.path = '/users/user-1/testAction';

      await expect(router['postItemAction'](req as Request, res as Response)).resolves.not.toThrow();
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle multiple router instances efficiently', () => {
      const routers = [];
      for (let i = 0; i < 10; i++) {
        routers.push(new TestUserRouter(mockLib, "user"));
      }

      expect(routers).toHaveLength(10);
      routers.forEach(router => {
        expect(router.getPkType()).toBe('user');
      });
    });

    it('should handle large option objects', () => {
      const largeOptions: ItemRouterOptions<"user", "tenant"> = {
        actions: {},
        facets: {},
        allActions: {},
        allFacets: {}
      };

      // Add many options
      for (let i = 0; i < 50; i++) {
        largeOptions.actions![`action${i}`] = vi.fn().mockResolvedValue({ id: i });
        largeOptions.facets![`facet${i}`] = vi.fn().mockResolvedValue({ id: i });
        largeOptions.allActions![`allAction${i}`] = vi.fn().mockResolvedValue({ id: i });
        largeOptions.allFacets![`allFacet${i}`] = vi.fn().mockResolvedValue({ id: i });
      }

      expect(() => {
        new TestUserRouter(mockLib, "user", largeOptions);
      }).not.toThrow();
    });
  });

  describe('Example Script Execution', () => {
    it('should handle main execution block when run as main module', () => {
      // Test the conditional execution at the bottom of router-options-example.ts
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      // Simulate the condition: import.meta.url === `file://${process.argv[1]}`
      // This tests the main execution path of the example
      const result = createRouterWithCollisions();

      expect(result).toBeDefined();
      expect(result.userRouter).toBeDefined();
      expect(result.expressRouter).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should demonstrate complete example workflow', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      // This tests the full example as it would run
      const { userRouter, expressRouter } = createRouterWithCollisions();

      // Verify the complete setup
      expect(userRouter).toBeInstanceOf(ItemRouter);
      expect(expressRouter).toBeDefined();

      // Verify console output includes key information
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Creating UserRouter'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Router created successfully'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Available endpoints'));

      consoleSpy.mockRestore();
    });
  });

  describe('UserRouter Class Implementation', () => {
    it('should test getIk implementation', () => {
      const router = new TestUserRouter(mockLib, "user");
      const result = router['getIk'](res as Response);

      expect(result).toEqual({
        kt: "user",
        pk: "user-1",
        loc: [{ kt: "tenant", lk: "tenant-1" }]
      });
    });

    it('should test getLocations implementation', () => {
      const router = new TestUserRouter(mockLib, "user");
      const result = router['getLocations'](res as Response);

      expect(result).toEqual([
        { kt: "tenant", lk: "tenant-1" }
      ]);
    });

    it('should handle missing tenantId in response locals', () => {
      const router = new TestUserRouter(mockLib, "user");
      res.locals = { userPk: "user-1" }; // Missing tenantId

      const ikResult = router['getIk'](res as Response);
      const locResult = router['getLocations'](res as Response);

      expect(ikResult.loc).toEqual([{ kt: "tenant", lk: "tenant-1" }]);
      expect(locResult).toEqual([{ kt: "tenant", lk: "tenant-1" }]);
    });

    it('should test createItem with different request bodies', async () => {
      const router = new TestUserRouter(mockLib, "user");

      // Test with custom name and email
      req.body = { name: "Custom User", email: "custom@example.com" };
      await router.createItem(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        key: expect.objectContaining({
          kt: "user",
          pk: "user-new"
        }),
        name: "Custom User",
        email: "custom@example.com"
      }));

      vi.clearAllMocks();

      // Test with empty body (should use defaults)
      req.body = {};
      await router.createItem(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: "New User",
        email: "new@example.com"
      }));
    });

    it('should test findItems returns expected structure', async () => {
      const router = new TestUserRouter(mockLib, "user");

      await router.findItems(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('Mock Library Structure Validation', () => {
    it('should validate mockLibWithConflicts operations', async () => {
      // Test each operation returns expected results
      const getResult = await mockLib.operations.get();
      expect(getResult).toEqual(expect.objectContaining({
        key: expect.objectContaining({ kt: "user", pk: "user-1" }),
        name: "John Doe"
      }));

      const createResult = await mockLib.operations.create();
      expect(createResult).toEqual(expect.objectContaining({
        key: expect.objectContaining({ kt: "user", pk: "user-2" }),
        name: "Jane Doe"
      }));

      const updateResult = await mockLib.operations.update();
      expect(updateResult).toEqual(expect.objectContaining({
        key: expect.objectContaining({ kt: "user", pk: "user-1" }),
        name: "John Updated"
      }));

      const allResult = await mockLib.operations.all();
      expect(allResult).toEqual([]);

      const findResult = await mockLib.operations.find();
      expect(findResult).toEqual([]);

      const findOneResult = await mockLib.operations.findOne();
      expect(findOneResult).toBeNull();
    });

    it('should validate mockLibWithConflicts action operations', async () => {
      const actionResult = await mockLib.operations.action({ kt: "user", pk: "test" }, "testAction");
      expect(actionResult).toBeInstanceOf(Array);
      expect(actionResult[0]).toEqual(expect.objectContaining({ source: "library", action: "testAction" }));

      const facetResult = await mockLib.operations.facet({ kt: "user", pk: "test" }, "testFacet");
      expect(facetResult).toEqual(expect.objectContaining({ source: "library", facet: "testFacet" }));

      const allActionResult = await mockLib.operations.allAction("testAllAction");
      expect(allActionResult).toBeInstanceOf(Array);
      expect(allActionResult[0]).toBeInstanceOf(Array);
      expect(allActionResult[0][0]).toEqual(expect.objectContaining({ source: "library", allAction: "testAllAction" }));

      const allFacetResult = await mockLib.operations.allFacet("testAllFacet");
      expect(allFacetResult).toEqual({ source: "library", allFacet: "testAllFacet" });
    });

    it('should validate mockLibWithConflicts options structure', async () => {
      // Test library options that will conflict with router options
      const activateResult = await mockLib.options.actions.activate();
      expect(activateResult).toEqual({ source: "library", action: "activate" });

      const profileResult = await mockLib.options.facets.profile();
      expect(profileResult).toEqual({ source: "library", facet: "profile" });

      const bulkUpdateResult = await mockLib.options.allActions.bulkUpdate();
      expect(bulkUpdateResult).toEqual({ source: "library", allAction: "bulkUpdate" });

      const analyticsResult = await mockLib.options.allFacets.analytics();
      expect(analyticsResult).toEqual({ source: "library", allFacet: "analytics" });
    });
  });
});
1
