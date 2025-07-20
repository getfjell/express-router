# Fjell-Express-Router Examples

This directory contains examples demonstrating how to use fjell-express-router for building Express.js applications with automatic CRUD routing, hierarchical data management, and business logic integration with different patterns and complexity levels.

## Examples

### 1. `basic-router-example.ts` ⭐ **Start Here!**
**Perfect for beginners!** Demonstrates the fundamental way to use fjell-express-router for REST API development:
- **Basic PItemRouter usage** - Create routers for primary entities (Users, Tasks)
- **Automatic CRUD endpoints** - GET, POST, PUT, DELETE routes generated automatically
- **Mock data operations** - Simple in-memory storage with business logic
- **Express app integration** - Mount routers and add custom middleware
- **Custom business routes** - Dashboard and health check endpoints

Great for understanding the fundamentals of fjell-express-router for REST API development.

### 2. `nested-router-example.ts` 🏗️ **Hierarchical Data Management**
**Advanced hierarchical routing!** Demonstrates complex data structures with nested relationships:
- **Multiple router types**: PItemRouter for Organizations, CItemRouter for Departments and Employees
- **Nested route mounting**: `/organizations/:orgId/departments/:deptId/employees/:empId`
- **Hierarchical data models**: Organization → Department → Employee relationships
- **Location-based operations**: Complex queries spanning multiple organizational levels
- **Business analytics**: Organizational hierarchy summaries and statistics

Shows how fjell-express-router handles enterprise organizational data patterns with deep hierarchies.

### 3. `full-application-example.ts` 🚀 **Production-Ready Application**
**Complete enterprise application!** Demonstrates a realistic e-commerce system with advanced patterns:
- **Multiple interconnected entities**: Customer, Product, Order, OrderItem, Review
- **Advanced middleware**: Error handling, request logging, business validation
- **Complex business logic**: Product catalog, customer analytics, order management
- **Production patterns**: CORS headers, security middleware, proper error handling
- **Real-world scenarios**: Complete e-commerce platform with customer lifecycle management

Perfect for understanding how to build production-ready applications with fjell-express-router.

## Key Concepts Demonstrated

### Basic Router Setup (basic-router-example.ts)
```typescript
// Import fjell-express-router functionality
import { PItemRouter, createRegistry } from '@fjell/express-router';
import express from 'express';

// Create Express app and registry
const app = express();
const registry = createRegistry();

// Create router instance
const userRouter = new PItemRouter(userInstance, 'user');

// Mount router to create automatic REST endpoints
app.use('/api/users', userRouter.getRouter());
// This creates:
// GET    /api/users           - List all users
// GET    /api/users/:userPk   - Get specific user
// POST   /api/users           - Create new user
// PUT    /api/users/:userPk   - Update user
// DELETE /api/users/:userPk   - Delete user
```

### Nested Routing (nested-router-example.ts)
```typescript
// Create hierarchical routers
const orgRouter = new PItemRouter(orgInstance, 'organization');
const deptRouter = new CItemRouter(deptInstance, 'department', orgRouter);
const empRouter = new CItemRouter(empInstance, 'employee', deptRouter);

// Mount nested routes
app.use('/api/organizations', orgRouter.getRouter());
app.use('/api/organizations/:organizationPk/departments', deptRouter.getRouter());
app.use('/api/organizations/:organizationPk/departments/:departmentPk/employees', empRouter.getRouter());

// This creates nested endpoints like:
// GET /api/organizations/org-1/departments/dept-1/employees
// POST /api/organizations/org-1/departments/dept-1/employees
```

### Production Application (full-application-example.ts)
```typescript
// Advanced middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(validateCustomerTier);
app.use(errorHandler);

// Business logic routes
app.get('/api/dashboard', async (req, res) => {
  // Complex dashboard with analytics
});

app.get('/api/catalog', async (req, res) => {
  // Product catalog with filtering and search
});
```

## Data Model Patterns

### Primary Items (PItemRouter)
Primary items are top-level entities that exist independently:
```typescript
interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
  // ... other properties
}

// Creates routes: /api/users, /api/users/:userPk
const userRouter = new PItemRouter(userInstance, 'user');
```

### Contained Items (CItemRouter)
Contained items exist within a parent context and inherit location:
```typescript
interface Department extends Item<'department', 'organization'> {
  id: string;
  name: string;
  organizationId: string; // Reference to parent
  // ... other properties
}

// Creates nested routes: /api/organizations/:orgPk/departments
const deptRouter = new CItemRouter(deptInstance, 'department', orgRouter);
```

### Multi-Level Hierarchies
Deep nesting is supported for complex organizational structures:
```typescript
interface Employee extends Item<'employee', 'organization', 'department'> {
  id: string;
  name: string;
  organizationId: string;
  departmentId: string;
  // ... other properties
}

// Creates deeply nested routes: /api/organizations/:orgPk/departments/:deptPk/employees
const empRouter = new CItemRouter(empInstance, 'employee', deptRouter);
```

## Running the Examples

### Prerequisites
```bash
# Install dependencies
npm install express @fjell/core @fjell/lib @fjell/express-router

# For running TypeScript examples
npm install -g tsx
```

### Running Individual Examples

**Basic Router Example:**
```bash
npx tsx examples/basic-router-example.ts
# Server runs on http://localhost:3001
```

**Nested Router Example:**
```bash
npx tsx examples/nested-router-example.ts
# Server runs on http://localhost:3002
```

**Full Application Example:**
```bash
npx tsx examples/full-application-example.ts
# Server runs on http://localhost:3003
```

## Testing the Examples

### Basic Router Example (Port 3001)
```bash
# Health check
curl http://localhost:3001/api/health

# Dashboard summary
curl http://localhost:3001/api/dashboard

# List all users
curl http://localhost:3001/api/users

# Get specific user
curl http://localhost:3001/api/users/user-1

# Create new user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"New User","email":"new@example.com","role":"user"}'

# List all tasks
curl http://localhost:3001/api/tasks
```

### Nested Router Example (Port 3002)
```bash
# Organizational hierarchy
curl http://localhost:3002/api/hierarchy

# Statistics summary
curl http://localhost:3002/api/stats

# List organizations
curl http://localhost:3002/api/organizations

# List departments for organization
curl http://localhost:3002/api/organizations/org-1/departments

# List employees for department
curl http://localhost:3002/api/organizations/org-1/departments/dept-1/employees

# Create new department
curl -X POST http://localhost:3002/api/organizations/org-1/departments \
  -H "Content-Type: application/json" \
  -d '{"name":"IT Department","budget":1000000,"headCount":15}'
```

### Full Application Example (Port 3003)
```bash
# System health
curl http://localhost:3003/health

# Business dashboard
curl http://localhost:3003/api/dashboard

# Product catalog
curl http://localhost:3003/api/catalog

# Filtered catalog
curl "http://localhost:3003/api/catalog?category=Electronics&featured=true"

# Customer analytics
curl http://localhost:3003/api/customers/cust-1/analytics

# List customers
curl http://localhost:3003/api/customers

# Customer orders
curl http://localhost:3003/api/customers/cust-1/orders

# Create new customer
curl -X POST http://localhost:3003/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Customer",
    "email": "customer@example.com",
    "phone": "+1-555-0789",
    "address": {
      "street": "789 Pine St",
      "city": "Seattle",
      "state": "WA",
      "zipCode": "98101"
    },
    "tier": "bronze"
  }'
```

## Integration Patterns

### Mock Operations
All examples use mock operations that simulate real database interactions:
```typescript
const createUserOperations = () => ({
  async all() { /* return all users */ },
  async get(key) { /* return specific user */ },
  async create(item) { /* create new user */ },
  async update(key, updates) { /* update user */ },
  async remove(key) { /* delete user */ },
  async find(finder, params) { /* find users with criteria */ }
});
```

### Instance Creation
Fjell instances wrap operations and provide router integration:
```typescript
const mockUserInstance = {
  operations: createUserOperations(),
  options: {}
};

const userRouter = new PItemRouter(mockUserInstance, 'user');
```

### Error Handling
Production applications should include comprehensive error handling:
```typescript
const errorHandler = (err, req, res, next) => {
  console.error('Application Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

app.use(errorHandler);
```

## Best Practices

### 1. **Start Simple**
Begin with the basic router example to understand core concepts before moving to complex hierarchies.

### 2. **Design Your Data Model**
Plan your Item interfaces and relationships carefully:
- Use PItemRouter for independent entities
- Use CItemRouter for entities that belong to parents
- Define clear location hierarchies for nested data

### 3. **Implement Operations**
Create comprehensive operations that handle:
- CRUD operations (all, get, create, update, remove)
- Business logic finders (find method with custom logic)
- Error handling and validation

### 4. **Add Business Logic**
Extend beyond basic CRUD with:
- Custom middleware for validation
- Business logic routes (dashboards, analytics)
- Proper error handling and logging

### 5. **Production Considerations**
For production applications:
- Implement proper authentication/authorization
- Add rate limiting and security headers
- Use environment-specific configurations
- Implement comprehensive logging and monitoring

## Next Steps

1. **Study the examples** in order of complexity
2. **Run each example** and test the endpoints
3. **Modify the data models** to match your use case
4. **Implement real operations** with your database/API
5. **Add authentication and security** for production use

For more advanced usage, see the fjell-express-router documentation and explore other fjell ecosystem packages like fjell-cache, fjell-lib, and fjell-client-api.
