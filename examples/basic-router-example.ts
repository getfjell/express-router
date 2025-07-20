/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Basic Express Router Example
 *
 * This example demonstrates the fundamental usage of fjell-express-router for setting up
 * Express routes that automatically handle CRUD operations for data models.
 * It shows how to create routers, integrate with Express apps, and handle basic HTTP operations.
 *
 * Perfect for understanding the basics of fjell-express-router before moving to advanced features.
 *
 * Run this example with: npx tsx examples/basic-router-example.ts
 */

import { Item, PriKey, UUID } from '@fjell/core';
import express, { Application } from 'express';
import { createRegistry, PItemRouter } from '../src';

// Define our data models
interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  lastLogin?: Date;
}

interface Task extends Item<'task'> {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

// Mock storage for demonstration (in real apps, this would be your database/API)
const mockUserStorage = new Map<string, User>();
const mockTaskStorage = new Map<string, Task>();

// Initialize with some sample data
const initializeSampleData = () => {
  const users: User[] = [
    {
      key: { kt: 'user', pk: 'user-1' as UUID },
      id: 'user-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'admin',
      lastLogin: new Date('2025-01-15T10:30:00Z'),
      events: {
        created: { at: new Date('2025-01-01T00:00:00Z') },
        updated: { at: new Date('2025-01-15T10:30:00Z') },
        deleted: { at: null }
      }
    },
    {
      key: { kt: 'user', pk: 'user-2' as UUID },
      id: 'user-2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'user',
      lastLogin: new Date('2025-01-14T15:20:00Z'),
      events: {
        created: { at: new Date('2025-01-02T00:00:00Z') },
        updated: { at: new Date('2025-01-14T15:20:00Z') },
        deleted: { at: null }
      }
    }
  ];

  const tasks: Task[] = [
    {
      key: { kt: 'task', pk: 'task-1' as UUID },
      id: 'task-1',
      title: 'Setup project documentation',
      description: 'Create comprehensive documentation for the new project',
      assignedTo: 'user-1',
      status: 'in-progress',
      priority: 'high',
      dueDate: new Date('2025-01-30T00:00:00Z'),
      events: {
        created: { at: new Date('2025-01-10T00:00:00Z') },
        updated: { at: new Date('2025-01-15T00:00:00Z') },
        deleted: { at: null }
      }
    },
    {
      key: { kt: 'task', pk: 'task-2' as UUID },
      id: 'task-2',
      title: 'Review code changes',
      description: 'Review and approve pending pull requests',
      assignedTo: 'user-2',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date('2025-01-25T00:00:00Z'),
      events: {
        created: { at: new Date('2025-01-12T00:00:00Z') },
        updated: { at: new Date('2025-01-12T00:00:00Z') },
        deleted: { at: null }
      }
    }
  ];

  users.forEach(user => mockUserStorage.set(user.id, user));
  tasks.forEach(task => mockTaskStorage.set(task.id, task));

  console.log('📦 Initialized sample data:');
  console.log(`   Users: ${users.length} records`);
  console.log(`   Tasks: ${tasks.length} records`);
};

// Create mock operations for Users and Tasks
const createUserOperations = () => {
  return {
    async all() {
      console.log('📦 UserOperations.all() - Fetching all users...');
      return Array.from(mockUserStorage.values());
    },

    async get(key: PriKey<'user'>) {
      console.log(`🔍 UserOperations.get(${key.pk}) - Fetching user...`);
      const user = mockUserStorage.get(String(key.pk));
      if (!user) {
        throw new Error(`User not found: ${key.pk}`);
      }
      return user;
    },

    async create(item: User) {
      console.log(`✨ UserOperations.create() - Creating user: ${item.name}`);
      const id = `user-${Date.now().toString()}`;
      const newUser: User = {
        ...item,
        id,
        key: { kt: 'user', pk: id as UUID },
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };
      mockUserStorage.set(id, newUser);
      return newUser;
    },

    async update(key: PriKey<'user'>, updates: Partial<User>) {
      console.log(`🔄 UserOperations.update(${key.pk}) - Updating user...`);
      const existing = mockUserStorage.get(String(key.pk));
      if (!existing) {
        throw new Error(`User not found: ${key.pk}`);
      }
      const updated: User = {
        ...existing,
        ...updates,
        events: {
          ...existing.events,
          updated: { at: new Date() }
        }
      };
      mockUserStorage.set(String(key.pk), updated);
      return updated;
    },

    async remove(key: PriKey<'user'>) {
      console.log(`🗑️ UserOperations.remove(${key.pk}) - Removing user...`);
      const existing = mockUserStorage.get(String(key.pk));
      if (!existing) {
        return false;
      }
      mockUserStorage.delete(String(key.pk));
      return true;
    },

    async find(finder: string, params: any) {
      console.log(`🔎 UserOperations.find(${finder}) - Finding users...`, params);
      const users = Array.from(mockUserStorage.values());

      switch (finder) {
        case 'byRole':
          return users.filter(user => user.role === params.role);
        case 'byEmail':
          return users.filter(user => user.email.includes(params.email));
        default:
          return users;
      }
    }
  };
};

const createTaskOperations = () => {
  return {
    async all() {
      console.log('📦 TaskOperations.all() - Fetching all tasks...');
      return Array.from(mockTaskStorage.values());
    },

    async get(key: PriKey<'task'>) {
      console.log(`🔍 TaskOperations.get(${key.pk}) - Fetching task...`);
      const task = mockTaskStorage.get(String(key.pk));
      if (!task) {
        throw new Error(`Task not found: ${key.pk}`);
      }
      return task;
    },

    async create(item: Task) {
      console.log(`✨ TaskOperations.create() - Creating task: ${item.title}`);
      const id = `task-${Date.now().toString()}`;
      const newTask: Task = {
        ...item,
        id,
        key: { kt: 'task', pk: id as UUID },
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };
      mockTaskStorage.set(id, newTask);
      return newTask;
    },

    async update(key: PriKey<'task'>, updates: Partial<Task>) {
      console.log(`🔄 TaskOperations.update(${key.pk}) - Updating task...`);
      const existing = mockTaskStorage.get(String(key.pk));
      if (!existing) {
        throw new Error(`Task not found: ${key.pk}`);
      }
      const updated: Task = {
        ...existing,
        ...updates,
        events: {
          ...existing.events,
          updated: { at: new Date() }
        }
      };
      mockTaskStorage.set(String(key.pk), updated);
      return updated;
    },

    async remove(key: PriKey<'task'>) {
      console.log(`🗑️ TaskOperations.remove(${key.pk}) - Removing task...`);
      const existing = mockTaskStorage.get(String(key.pk));
      if (!existing) {
        return false;
      }
      mockTaskStorage.delete(String(key.pk));
      return true;
    },

    async find(finder: string, params: any) {
      console.log(`🔎 TaskOperations.find(${finder}) - Finding tasks...`, params);
      const tasks = Array.from(mockTaskStorage.values());

      switch (finder) {
        case 'byStatus':
          return tasks.filter(task => task.status === params.status);
        case 'byAssignee':
          return tasks.filter(task => task.assignedTo === params.assignedTo);
        case 'byPriority':
          return tasks.filter(task => task.priority === params.priority);
        default:
          return tasks;
      }
    }
  };
};

/**
 * Main function demonstrating basic fjell-express-router usage
 */
export const runBasicRouterExample = async (): Promise<{ app: Application; userRouter: PItemRouter<User, 'user'>; taskRouter: PItemRouter<Task, 'task'> }> => {
  console.log('🚀 Starting Basic Express Router Example...\n');

  // Initialize sample data
  initializeSampleData();

  // Create registry and instances
  console.log('📋 Creating registry and instances...');
  const registry = createRegistry();

  // Create mock instances that simulate the fjell pattern
  const mockUserInstance = {
    operations: createUserOperations(),
    options: {}
  } as any;

  const mockTaskInstance = {
    operations: createTaskOperations(),
    options: {}
  } as any;

  // Create Express app
  const app: Application = express();
  app.use(express.json());

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path}`, req.query);
    next();
  });

  // Create PItemRouters for our models
  console.log('🛤️ Creating Express routers...');
  const userRouter = new PItemRouter(mockUserInstance, 'user');
  const taskRouter = new PItemRouter(mockTaskInstance, 'task');

  // Mount the routers on Express app
  // These will automatically create REST endpoints:
  // GET    /api/users           - Get all users
  // GET    /api/users/:userPk   - Get specific user
  // POST   /api/users           - Create new user
  // PUT    /api/users/:userPk   - Update user
  // DELETE /api/users/:userPk   - Delete user
  app.use('/api/users', userRouter.getRouter());
  app.use('/api/tasks', taskRouter.getRouter());

  // Add some custom routes to demonstrate business logic
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      users: mockUserStorage.size,
      tasks: mockTaskStorage.size
    });
  });

  // Dashboard route showing summary data
  app.get('/api/dashboard', async (req, res) => {
    try {
      const users = await mockUserInstance.operations.all();
      const tasks = await mockTaskInstance.operations.all();

      const dashboard = {
        summary: {
          totalUsers: users.length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: Task) => t.status === 'completed').length,
          pendingTasks: tasks.filter((t: Task) => t.status === 'pending').length,
          inProgressTasks: tasks.filter((t: Task) => t.status === 'in-progress').length
        },
        users: users.map((u: User) => ({ id: u.id, name: u.name, role: u.role })),
        recentTasks: tasks
          .sort((a: Task, b: Task) => b.events.created.at.getTime() - a.events.created.at.getTime())
          .slice(0, 5)
      };

      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  });

  console.log('\n✅ Basic Express Router Example setup complete!');
  console.log('\n📚 Available endpoints:');
  console.log('   GET    /api/health          - Health check');
  console.log('   GET    /api/dashboard       - Dashboard summary');
  console.log('   GET    /api/users           - List all users');
  console.log('   GET    /api/users/:userPk   - Get specific user');
  console.log('   POST   /api/users           - Create new user');
  console.log('   PUT    /api/users/:userPk   - Update user');
  console.log('   DELETE /api/users/:userPk   - Delete user');
  console.log('   GET    /api/tasks           - List all tasks');
  console.log('   GET    /api/tasks/:taskPk   - Get specific task');
  console.log('   POST   /api/tasks           - Create new task');
  console.log('   PUT    /api/tasks/:taskPk   - Update task');
  console.log('   DELETE /api/tasks/:taskPk   - Delete task');

  return { app, userRouter, taskRouter };
};

// If this file is run directly, start the server
if (require.main === module) {
  runBasicRouterExample().then(({ app }) => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`\n🌟 Server running on http://localhost:${PORT}`);
      console.log('\n💡 Try these example requests:');
      console.log(`   curl http://localhost:${PORT}/api/health`);
      console.log(`   curl http://localhost:${PORT}/api/dashboard`);
      console.log(`   curl http://localhost:${PORT}/api/users`);
      console.log(`   curl http://localhost:${PORT}/api/tasks`);
    });
  }).catch(console.error);
}
