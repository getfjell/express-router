# Migration Guide: v2.x to v3.0

## Overview

Version 3.0 of `@fjell/express-router` adopts the standardized Operations interface from `@fjell/core`. This provides a unified interface across all Fjell packages and enables better type safety and cross-package compatibility.

## Breaking Changes

### Operations Interface

The router now works directly with the `Operations` interface from `@fjell/core`, which is implemented by `@fjell/lib`, `@fjell/cache`, and other Fjell packages.

**Good News**: This is a non-breaking change for most users since `@fjell/lib` already implements the core Operations interface.

## What You Need to Do

### Step 1: Update Dependencies

Update to the latest versions of Fjell packages:

```bash
npm install @fjell/core@latest @fjell/lib@latest @fjell/express-router@latest
```

### Step 2: Verify Your Code (Usually No Changes Needed)

Your existing code should continue to work without modifications:

```typescript
// This continues to work in v3.0
import { PItemRouter, CItemRouter } from '@fjell/express-router';
import { createLibrary } from '@fjell/lib';
import { createRegistry } from '@fjell/registry';

const registry = createRegistry();
const library = createLibrary(
  registry,
  { keyType: 'user' },
  userOperations,
  userOptions
);

const userRouter = new PItemRouter(library, 'user');
app.use('/api/users', userRouter.getRouter());
```

### Step 3: Optional - Use Type Imports from Core

You can now import types directly from `@fjell/core` if needed:

```typescript
import { Operations, OperationParams, AffectedKeys } from '@fjell/core';
import type { Item } from '@fjell/core';

// Your Operations implementation
const myOperations: Operations<Item<'user'>, 'user'> = {
  // ... implementation
};
```

## Benefits of v3.0

### 1. Unified Interface

Works with any package that implements `@fjell/core` Operations:

```typescript
import { PItemRouter } from '@fjell/express-router';
import { createLibrary } from '@fjell/lib';
import { createCache } from '@fjell/cache';

// Works with @fjell/lib
const library = createLibrary(registry, { keyType: 'user' }, ops, opts);
const libRouter = new PItemRouter(library, 'user');

// Works with @fjell/cache
const cache = createCache(library);
const cacheRouter = new PItemRouter(cache as any, 'user');
```

### 2. Better Type Safety

Enhanced TypeScript support with explicit method types from core:

```typescript
import type { GetMethod, CreateMethod } from '@fjell/core';

// Core types are available for advanced use cases
const getHandler: GetMethod<User, 'user'> = async (key) => {
  // Handler implementation
};
```

### 3. Consistent API

Same routing behavior across all Operations implementations:

- `GET /items` → `operations.all()`
- `GET /items/:id` → `operations.get(key)`
- `POST /items` → `operations.create(item)`
- `PUT /items/:id` → `operations.update(key, item)`
- `DELETE /items/:id` → `operations.remove(key)`
- `POST /items/:id/action` → `operations.action(key, action, params)`
- `GET /items/:id/facet` → `operations.facet(key, facet, params)`
- `POST /items/action` → `operations.allAction(action, params)`
- `GET /items/facet` → `operations.allFacet(facet, params)`

### 4. Cross-Package Compatibility

Works seamlessly with all Fjell packages:

- `@fjell/lib` - Server-side operations
- `@fjell/cache` - Caching layer
- `@fjell/client-api` - HTTP client
- `@fjell/providers` - React UI components

## What Hasn't Changed

- Router creation API remains the same
- Route configuration is identical
- Router-level handlers work as before
- Middleware integration unchanged
- Error handling unchanged
- All existing options and configurations continue to work

## Examples

### Basic Router (No Changes Required)

```typescript
import express from 'express';
import { PItemRouter } from '@fjell/express-router';
import { createLibrary } from '@fjell/lib';
import { createRegistry } from '@fjell/registry';

const app = express();
const registry = createRegistry();

// Create library
const userLibrary = createLibrary(
  registry,
  { keyType: 'user' },
  userOperations,
  userOptions
);

// Create router (same as v2.x)
const userRouter = new PItemRouter(userLibrary, 'user');
app.use('/api/users', userRouter.getRouter());

app.listen(3000);
```

### Nested Routers (No Changes Required)

```typescript
// Parent router
const organizationRouter = new PItemRouter(orgLibrary, 'organization');

// Child router
const departmentRouter = new CItemRouter(
  deptLibrary,
  'department',
  organizationRouter
);

// Mount routers (same as v2.x)
app.use('/api/organizations', organizationRouter.getRouter());
app.use(
  '/api/organizations/:organizationPk/departments',
  departmentRouter.getRouter()
);
```

### Router-Level Handlers (No Changes Required)

```typescript
const userRouter = new PItemRouter(userLibrary, 'user', {
  actions: {
    activate: async (ik, params, { req, res }) => {
      // Handler implementation (same as v2.x)
      const user = await userLibrary.operations.get(ik);
      await activateUser(user);
      res.json({ success: true });
    }
  },
  facets: {
    profile: async (ik, params, { req, res }) => {
      // Handler implementation (same as v2.x)
      const user = await userLibrary.operations.get(ik);
      const profile = await getProfile(user);
      res.json(profile);
    }
  }
});
```

## Troubleshooting

### Type Errors

If you encounter type errors after upgrading:

1. Ensure all Fjell packages are updated to their latest versions
2. Check that `@fjell/core` is installed
3. Clear your TypeScript cache: `rm -rf node_modules/.cache`
4. Rebuild: `npm run build`

### Import Errors

If you have import errors:

```typescript
// If this fails:
import type { Operations } from '@fjell/express-router';

// Use this instead:
import type { Operations } from '@fjell/core';
// or
import type { Operations } from '@fjell/lib';
```

### Runtime Errors

If your Operations object doesn't work with the router:

1. Verify it implements all required methods from `@fjell/core` Operations
2. Check that method signatures match the core interface
3. Ensure return types are correct (e.g., `action` and `allAction` return `[result, affectedKeys]`)

## Migration Checklist

- [ ] Update `@fjell/core` to latest version
- [ ] Update `@fjell/lib` to latest version  
- [ ] Update `@fjell/express-router` to v3.0+
- [ ] Update other Fjell packages to latest versions
- [ ] Run `npm install`
- [ ] Run tests: `npm test`
- [ ] Run build: `npm run build`
- [ ] Verify application starts correctly
- [ ] Test API endpoints work as expected

## Need Help?

- **Documentation**: [README.md](./README.md)
- **Examples**: [examples/](./examples/)
- **Issues**: [GitHub Issues](https://github.com/getfjell/express-router/issues)
- **Discussions**: [GitHub Discussions](https://github.com/getfjell/express-router/discussions)

## Summary

Version 3.0 is a **seamless upgrade** for most users. The router now uses the standardized Operations interface from `@fjell/core`, providing better type safety and cross-package compatibility, but your existing code should continue to work without modifications.

Simply update your dependencies and you're ready to go! 🎉

