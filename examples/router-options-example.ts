/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Example: Router-Level Options with Name Collision Handling
 *
 * This example demonstrates how router-level actions, facets, allActions, and allFacets
 * take precedence over library-level options with the same names, and how collision
 * warnings are logged when there are conflicts.
 */

import { ItemRouter, ItemRouterOptions } from "../src/ItemRouter.js";
import { ComKey, Item, LocKeyArray, PriKey } from "@fjell/core";
import { Request, Response } from "express";

// Sample Item Types
type User = Item<"user", "tenant">;
type Tenant = Item<"tenant">;

// Mock library instance with actions/facets that will collide with router options
const mockLibWithConflicts = {
  operations: {
    get: async () => ({ key: { kt: "user", pk: "user-1" }, name: "John Doe" } as User),
    create: async () => ({ key: { kt: "user", pk: "user-2" }, name: "Jane Doe" } as User),
    update: async () => ({ key: { kt: "user", pk: "user-1" }, name: "John Updated" } as User),
    remove: async () => ({ key: { kt: "user", pk: "user-1" }, name: "John Doe" } as User),
    all: async () => [] as User[],
    find: async () => [] as User[],
    findOne: async () => null,
    action: async (ik: any, actionKey: string) => ({ source: "library", action: actionKey }),
    facet: async (ik: any, facetKey: string) => ({ source: "library", facet: facetKey }),
    allAction: async (actionKey: string) => ({ source: "library", allAction: actionKey }),
    allFacet: async (facetKey: string) => ({ source: "library", allFacet: facetKey })
  },
  options: {
    // These will collide with router-level options
    actions: {
      activate: async () => ({ source: "library", action: "activate" }),
      archive: async () => ({ source: "library", action: "archive" })
    },
    facets: {
      profile: async () => ({ source: "library", facet: "profile" }),
      settings: async () => ({ source: "library", facet: "settings" })
    },
    allActions: {
      bulkUpdate: async () => ({ source: "library", allAction: "bulkUpdate" }),
      export: async () => ({ source: "library", allAction: "export" })
    },
    allFacets: {
      analytics: async () => ({ source: "library", allFacet: "analytics" }),
      dashboard: async () => ({ source: "library", allFacet: "dashboard" })
    }
  }
};

class UserRouter extends ItemRouter<"user", "tenant"> {
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
    const users: User[] = [
      {
        key: { kt: "user", pk: "user-1", loc: this.getLocations(res) },
        name: "John Doe",
        email: "john@example.com",
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }
    ];
    res.json(users);
  };
}

/**
 * Router-level options that will take precedence over library options
 * Notice some of these have the same names as the library options
 */
const routerOptions: ItemRouterOptions<"user", "tenant"> = {
  // These will override library actions with same names
  actions: {
    activate: async (ik, params, { req, res }) => {
      console.log("🚀 Router-level activate action called!");
      return { source: "router", action: "activate", ik, params };
    },
    archive: async (ik, params, { req, res }) => {
      console.log("📦 Router-level archive action called!");
      return { source: "router", action: "archive", ik, params };
    },
    // This one is unique to router
    resetPassword: async (ik, params, { req, res }) => {
      console.log("🔑 Router-level resetPassword action called!");
      return { source: "router", action: "resetPassword", ik, params };
    }
  },

  // These will override library facets with same names
  facets: {
    profile: async (ik, params, { req, res }) => {
      console.log("👤 Router-level profile facet called!");
      return { source: "router", facet: "profile", ik, params };
    },
    settings: async (ik, params, { req, res }) => {
      console.log("⚙️ Router-level settings facet called!");
      return { source: "router", facet: "settings", ik, params };
    },
    // This one is unique to router
    permissions: async (ik, params, { req, res }) => {
      console.log("🔒 Router-level permissions facet called!");
      return { source: "router", facet: "permissions", ik, params };
    }
  },

  // These will override library allActions with same names
  allActions: {
    bulkUpdate: async (params, locations, { req, res }) => {
      console.log("📝 Router-level bulkUpdate allAction called!");
      return { source: "router", allAction: "bulkUpdate", params, locations };
    },
    export: async (params, locations, { req, res }) => {
      console.log("📤 Router-level export allAction called!");
      return { source: "router", allAction: "export", params, locations };
    },
    // This one is unique to router
    backup: async (params, locations, { req, res }) => {
      console.log("💾 Router-level backup allAction called!");
      return { source: "router", allAction: "backup", params, locations };
    }
  },

  // These will override library allFacets with same names
  allFacets: {
    analytics: async (params, locations, { req, res }) => {
      console.log("📊 Router-level analytics allFacet called!");
      return { source: "router", allFacet: "analytics", params, locations };
    },
    dashboard: async (params, locations, { req, res }) => {
      console.log("📈 Router-level dashboard allFacet called!");
      return { source: "router", allFacet: "dashboard", params, locations };
    },
    // This one is unique to router
    reports: async (params, locations, { req, res }) => {
      console.log("📋 Router-level reports allFacet called!");
      return { source: "router", allFacet: "reports", params, locations };
    }
  }
};

export function createRouterWithCollisions() {
  console.log("🎭 Creating UserRouter with router-level options that collide with library options...");
  console.log("⚠️  Watch for collision warnings in the logs!");

  // Create router with options that will collide with library options
  const userRouter = new UserRouter(mockLibWithConflicts as any, "user", routerOptions);

  console.log("✅ Router created successfully!");
  console.log("📋 Available endpoints with precedence:");
  console.log("   Actions (router overrides library):");
  console.log("     ✅ POST /users/:userPk/activate    (Router-level handler)");
  console.log("     ✅ POST /users/:userPk/archive     (Router-level handler)");
  console.log("     🆕 POST /users/:userPk/resetPassword (Router-only)");
  console.log("   Facets (router overrides library):");
  console.log("     ✅ GET /users/:userPk/profile      (Router-level handler)");
  console.log("     ✅ GET /users/:userPk/settings     (Router-level handler)");
  console.log("     🆕 GET /users/:userPk/permissions  (Router-only)");
  console.log("   All Actions (router overrides library):");
  console.log("     ✅ POST /users/bulkUpdate          (Router-level handler)");
  console.log("     ✅ POST /users/export              (Router-level handler)");
  console.log("     🆕 POST /users/backup              (Router-only)");
  console.log("   All Facets (router overrides library):");
  console.log("     ✅ GET /users/analytics            (Router-level handler)");
  console.log("     ✅ GET /users/dashboard            (Router-level handler)");
  console.log("     🆕 GET /users/reports              (Router-only)");

  return {
    userRouter,
    expressRouter: userRouter.getRouter()
  };
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚀 Starting Router Options Collision Example...");
  console.log("=".repeat(60));

  const { userRouter, expressRouter } = createRouterWithCollisions();

  console.log("=".repeat(60));
  console.log("✅ Example complete! Check the logs above for collision warnings.");
  console.log("💡 Router-level handlers take precedence over library handlers with the same names.");
}
