# Fjell Express Router

**Express Router for Fjell** - Automatic REST API generation with hierarchical data management for Express.js applications.

Fjell Express Router provides a powerful abstraction layer for creating Express.js REST APIs that automatically handle CRUD operations for complex, hierarchical data models. Built on the Fjell framework, it enables rapid development of enterprise-grade APIs with built-in support for nested resources, business logic integration, and type-safe operations.

## 🎉 Version 3.0 - Core Operations Integration

**Version 3.0** introduces seamless integration with `@fjell/core` Operations interface, providing:

- **Unified Interface**: Works directly with the standardized Operations interface from `@fjell/core`
- **Better Type Safety**: Enhanced TypeScript support with explicit method types
- **Cross-Package Compatibility**: Compatible with all Fjell packages (@fjell/lib, @fjell/cache, @fjell/client-api)
- **Automatic REST API**: Generate complete REST endpoints from any Operations implementation
- **Consistent Routing**: Same routing behavior across all Operations sources

### What Changed in v3.0

The router now works with any Operations implementation from the Fjell ecosystem:

```typescript
import { createOperationsRouter } from '@fjell/express-router';
import { createLibrary } from '@fjell/lib';

// Works with @fjell/lib Operations
const library = createLibrary(registry, { keyType: 'user' }, userOperations, userOptions);
const router = new PItemRouter(library, 'user');
app.use('/api/users', router.getRouter());
```

**Migration is seamless** - existing code continues to work without changes. See [MIGRATION_v3.md](./MIGRATION_v3.md) for details.

## Features

- **Automatic CRUD Routes**: Generate complete REST endpoints with minimal configuration
- **Hierarchical Data Support**: Handle complex nested relationships with parent-child routing
- **Type-Safe Operations**: Full TypeScript support with generic type constraints
- **Flexible Business Logic**: Easy integration of custom business rules and validations
- **Express.js Integration**: Seamless mounting as Express middleware with full compatibility
- **Built-in Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Extensible Architecture**: Support for custom actions, facets, and middleware

## Installation

```bash
npm install @fjell/express-router
```

Or with npm:

```bash
npm install @fjell/express-router
```

## Quick Start

```typescript
import { PItemRouter, createRegistry } from '@fjell/express-router';
import { Item } from '@fjell/core';
import express from 'express';

// Define your data model
interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

// Create Express app and registry
const app = express();
const registry = createRegistry();

// Create instance and router
const userInstance = registry.getInstance(
  'user',
  userOperations, // Your business logic implementation
  userOptions     // Configuration options
);

const userRouter = new PItemRouter(userInstance, 'user');

// Mount router - automatically creates CRUD endpoints
app.use('/api/users', userRouter.getRouter());

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

This automatically creates the following endpoints:

- `GET /api/users` - List all users
- `GET /api/users/:userPk` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:userPk` - Update user
- `DELETE /api/users/:userPk` - Delete user

## Core Concepts

### Router Types

**PItemRouter** - For primary entities that exist independently:
```typescript
const userRouter = new PItemRouter(userInstance, 'user');
const productRouter = new PItemRouter(productInstance, 'product');
```

**CItemRouter** - For child entities that belong to parent entities:
```typescript
const orderRouter = new PItemRouter(orderInstance, 'order');
const orderItemRouter = new CItemRouter(orderItemInstance, 'orderItem', orderRouter);
```

### Hierarchical Routing

Create nested routes for complex relationships:

```typescript
// Organization -> Department -> Employee hierarchy
const orgRouter = new PItemRouter(orgInstance, 'organization');
const deptRouter = new CItemRouter(deptInstance, 'department', orgRouter);
const empRouter = new CItemRouter(empInstance, 'employee', deptRouter);

// Mount hierarchical routes
app.use('/api/organizations', orgRouter.getRouter());
app.use('/api/organizations/:organizationPk/departments', deptRouter.getRouter());
app.use('/api/organizations/:organizationPk/departments/:departmentPk/employees', empRouter.getRouter());
```

This creates endpoints like:
- `GET /api/organizations/org-1/departments/dept-1/employees`
- `POST /api/organizations/org-1/departments/dept-1/employees`
- `GET /api/organizations/org-1/departments/dept-1/employees/emp-1`

## Advanced Usage

### Router-Level Handlers

Fjell Express Router supports router-level handlers for actions, facets, allActions, and allFacets. These handlers take precedence over library-level handlers and are ideal for implementing cross-system integrations, external service calls, or complex business logic that doesn't belong in the library layer.

#### When to Use Router-Level Handlers

- **Cross-system integrations**: When you need to call external services (APIs, databases, etc.)
- **Complex aggregations**: When you need to combine data from multiple sources
- **External notifications**: When you need to send emails, push notifications, etc.
- **Audit logging**: When you need to log actions to external systems
- **Caching strategies**: When you need custom caching logic

#### Example: Router-Level Handlers

```typescript
import { PItemRouter, CItemRouter } from '@fjell/express-router';
import { Item, PriKey, ComKey } from '@fjell/core';
import { Request, Response } from 'express';

// Define your data models
interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
}

interface Post extends Item<'post', 'user'> {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// Create routers with router-level handlers
const userRouter = new PItemRouter(userInstance, 'user', {
  // Router-level action handlers
  actions: {
    activate: async (req: Request, res: Response, ik: PriKey<'user'>) => {
      // Custom logic: send activation email, update status, etc.
      const user = await userInstance.operations.get(ik);
      await emailService.sendActivationEmail(user.email);
      await auditService.logAction('user_activated', ik.pk);

      res.json({
        message: 'User activated via router handler',
        userId: ik.pk,
        emailSent: true
      });
    },
    deactivate: async (req: Request, res: Response, ik: PriKey<'user'>) => {
      // Custom logic: send deactivation notification, update status, etc.
      const user = await userInstance.operations.get(ik);
      await notificationService.sendDeactivationNotification(user);
      await auditService.logAction('user_deactivated', ik.pk);

      res.json({
        message: 'User deactivated via router handler',
        userId: ik.pk,
        notificationSent: true
      });
    }
  },

  // Router-level facet handlers
  facets: {
    profile: async (req: Request, res: Response, ik: PriKey<'user'>) => {
      // Custom logic: aggregate data from multiple sources
      const user = await userInstance.operations.get(ik);
      const socialData = await socialService.getUserData(ik.pk);
      const preferences = await preferenceService.getUserPreferences(ik.pk);

      res.json({
        userId: ik.pk,
        basicInfo: user,
        socialInfo: socialData,
        preferences: preferences
      });
    },
    stats: async (req: Request, res: Response, ik: PriKey<'user'>) => {
      // Custom logic: calculate statistics from multiple data sources
      const postsCount = await postService.getUserPostsCount(ik.pk);
      const commentsCount = await commentService.getUserCommentsCount(ik.pk);
      const likesReceived = await likeService.getUserLikesCount(ik.pk);

      res.json({
        userId: ik.pk,
        postsCount,
        commentsCount,
        likesReceived,
        lastActivity: new Date()
      });
    }
  },

  // Router-level all action handlers
  allActions: {
    bulkActivate: async (req: Request, res: Response) => {
      // Custom logic: batch processing, external service integration
      const { userIds } = req.body;
      const results = await Promise.all(
        userIds.map(async (userId) => {
          const user = await userInstance.operations.get({ kt: 'user', pk: userId });
          await emailService.sendActivationEmail(user.email);
          return { userId, emailSent: true };
        })
      );

      res.json({
        message: 'Bulk activation via router handler',
        processedUsers: results.length,
        results
      });
    }
  },

  // Router-level all facet handlers
  allFacets: {
    userStats: async (req: Request, res: Response) => {
      // Custom logic: aggregate statistics from multiple systems
      const totalUsers = await userInstance.operations.all().then(users => users.length);
      const activeUsers = await analyticsService.getActiveUsersCount();
      const newUsersThisMonth = await analyticsService.getNewUsersThisMonth();

      res.json({
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        systemHealth: 'excellent'
      });
    }
  }
});

// Child router with router-level handlers
const postRouter = new CItemRouter(postInstance, 'post', userRouter, {
  actions: {
    publish: async (req: Request, res: Response, ik: ComKey<'post', 'user'>) => {
      // Custom logic: publish to social media, send notifications
      const post = await postInstance.operations.get(ik);
      await socialMediaService.publishToTwitter(post);
      await socialMediaService.publishToLinkedIn(post);
      await notificationService.notifyFollowers(post.authorId, post);

      res.json({
        message: 'Post published via router handler',
        postId: ik.pk,
        socialMediaPosted: true,
        notificationsSent: true
      });
    }
  },

  facets: {
    analytics: async (req: Request, res: Response, ik: ComKey<'post', 'user'>) => {
      // Custom logic: aggregate analytics from multiple sources
      const views = await analyticsService.getPostViews(ik.pk);
      const likes = await socialService.getPostLikes(ik.pk);
      const shares = await socialService.getPostShares(ik.pk);

      res.json({
        postId: ik.pk,
        views,
        likes,
        shares,
        engagementRate: (likes + shares) / views
      });
    }
  }
});
```

#### Handler Priority

Router-level handlers take precedence over library-level handlers:

1. **Router-level handler exists**: Use router handler
2. **Router-level handler doesn't exist**: Fallback to library handler
3. **No handlers exist**: Return error

This allows you to:
- Override specific handlers while keeping others at the library level
- Implement handlers only at the router level when needed
- Mix and match router and library handlers as appropriate

#### Handler Signatures

**Item Actions & Facets** (for PItemRouter):
```typescript
async (req: Request, res: Response, ik: PriKey<S>) => Promise<void>
```

**Item Actions & Facets** (for CItemRouter):
```typescript
async (req: Request, res: Response, ik: ComKey<S, L1, L2, L3, L4, L5>) => Promise<void>
```

**All Actions & Facets** (for both router types):
```typescript
async (req: Request, res: Response) => Promise<void>
```

### Custom Business Logic

Add custom routes alongside automatic CRUD operations:

```typescript
const router = userRouter.getRouter();

// Add custom business logic routes
router.get('/analytics', async (req, res) => {
  const analytics = await userInstance.operations.getAnalytics();
  res.json(analytics);
});

router.post('/:userPk/activate', async (req, res) => {
  const userPk = req.params.userPk;
  const user = await userInstance.operations.activate(userPk);
  res.json(user);
});

app.use('/api/users', router);
```

### Middleware Integration

Add Express middleware for authentication, validation, and more:

```typescript
import { authenticate, authorize, validateRequest } from './middleware';

// Global middleware
app.use(express.json());
app.use(authenticate);

// Router-specific middleware
const protectedRouter = userRouter.getRouter();
protectedRouter.use(authorize(['admin', 'user']));
protectedRouter.use('/sensitive-endpoint', validateRequest);

app.use('/api/users', protectedRouter);
```

### Error Handling

Built-in error handling with proper HTTP status codes:

```typescript
// Automatic error responses for common scenarios:
// 404 - Entity not found
// 400 - Invalid request data
// 500 - Internal server errors

// Custom error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

## Data Model Requirements

Your data models must extend the Fjell `Item` interface:

```typescript
import { Item, UUID } from '@fjell/core';

interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
  // ... other properties
}

interface Order extends Item<'order'> {
  id: string;
  customerId: string;
  total: number;
  // ... other properties
}

interface OrderItem extends Item<'orderItem', 'order'> {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  // ... other properties
}
```

## Configuration

Configure your instances with business operations and options:

```typescript
const userInstance = registry.getInstance(
  'user',
  {
    // Business operations implementation
    create: async (item) => { /* create logic */ },
    get: async (pk) => { /* get logic */ },
    update: async (pk, updates) => { /* update logic */ },
    delete: async (pk) => { /* delete logic */ },
    list: async (query) => { /* list logic */ },
    // ... other operations
  },
  {
    // Configuration options
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    validation: { /* validation rules */ },
    facets: { /* custom facets */ },
    actions: { /* custom actions */ },
    // ... other options
  }
);
```

## Examples

This package includes comprehensive examples in the `examples/` directory:

- **`basic-router-example.ts`** - Start here for fundamental usage patterns
- **`nested-router-example.ts`** - Hierarchical data management with organizations/departments/employees
- **`router-handlers-example.ts`** - Router-level handlers for cross-system integrations
- **`full-application-example.ts`** - Production-ready e-commerce application

Run examples:

```bash
# Basic example
npx tsx examples/basic-router-example.ts

# Nested routing example
npx tsx examples/nested-router-example.ts

# Router handlers example
npx tsx examples/router-handlers-example.ts

# Full application example
npx tsx examples/full-application-example.ts
```

## API Reference

### PItemRouter<T, S>

Primary item router for top-level entities.

**Constructor**
```typescript
new PItemRouter<T, S>(instance: Instance<T, S>, keyType: S, options?: ItemRouterOptions)
```

**Methods**
- `getRouter(): Router` - Get Express router instance
- `getPkType(): S` - Get primary key type
- `createItem(req, res)` - Handle POST requests
- `getItem(req, res)` - Handle GET requests for single items
- `updateItem(req, res)` - Handle PUT requests
- `deleteItem(req, res)` - Handle DELETE requests

### CItemRouter<T, S, L1, ...>

Child item router for nested entities.

**Constructor**
```typescript
new CItemRouter<T, S, L1>(
  instance: Instance<T, S, L1>,
  keyType: S,
  parentRouter: ItemRouter<L1>,
  options?: ItemRouterOptions
)
```

Inherits all methods from `ItemRouter` with additional parent-child relationship handling.

### createRegistry()

Factory function to create a new registry instance for managing multiple routers.

```typescript
const registry = createRegistry();
const instance = registry.getInstance(keyType, operations, options);
```

## Requirements

- Node.js >= 21
- TypeScript >= 5.0
- Express.js >= 5.0

## Dependencies

- `@fjell/core` - Core Fjell framework types and utilities
- `@fjell/lib` - Fjell library components
- `@fjell/logging` - Structured logging for Fjell applications
- `@fjell/registry` - Registry management for Fjell instances
- `express` - Express.js web framework
- `deepmerge` - Deep object merging utility

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## License

Licensed under the Apache License 2.0. See the LICENSE file for details.

## Support

- **Documentation**: [Full documentation and guides](./docs/)
- **Examples**: [Comprehensive examples](./examples/)
- **Issues**: [GitHub Issues](https://github.com/getfjell/express-router/issues)
- **Discussions**: [GitHub Discussions](https://github.com/getfjell/express-router/discussions)

Built with care by the Fjell team.
