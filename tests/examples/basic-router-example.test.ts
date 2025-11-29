/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Basic Router Example Tests
 *
 * Tests to verify the basic router example functionality.
 * Tests cover data initialization, router creation, and core operations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { runBasicRouterExample } from '../../examples/basic-router-example';
import type { Task, User } from '../../examples/basic-router-example';

describe('Basic Router Example', () => {
  let userRouter: any;
  let taskRouter: any;
  let mockUserInstance: any;
  let mockTaskInstance: any;

  beforeEach(async () => {
    const result = await runBasicRouterExample();
    userRouter = result.userRouter;
    taskRouter = result.taskRouter;

    // Extract the mock instances for direct testing
    mockUserInstance = (userRouter as any).lib;
    mockTaskInstance = (taskRouter as any).lib;
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      await expect(runBasicRouterExample()).resolves.toBeDefined();
    });

    it('should return app and routers', async () => {
      const result = await runBasicRouterExample();

      expect(result).toHaveProperty('app');
      expect(result).toHaveProperty('userRouter');
      expect(result).toHaveProperty('taskRouter');

      expect(result.app).toBeDefined();
      expect(typeof result.app.listen).toBe('function');
      expect(result.userRouter).toBeDefined();
      expect(result.taskRouter).toBeDefined();
    });

    it('should have proper router configuration', async () => {
      const result = await runBasicRouterExample();

      expect(result.userRouter.getPkType()).toBe('user');
      expect(result.taskRouter.getPkType()).toBe('task');
    });
  });

  describe('Sample Data Initialization', () => {
    it('should initialize with sample users', async () => {
      const result = await mockUserInstance.operations.all();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);

      const alice = result.items.find((user: User) => user.name === 'Alice Johnson');
      const bob = result.items.find((user: User) => user.name === 'Bob Smith');

      expect(alice).toBeDefined();
      expect(alice.email).toBe('alice@example.com');
      expect(alice.role).toBe('admin');

      expect(bob).toBeDefined();
      expect(bob.email).toBe('bob@example.com');
      expect(bob.role).toBe('user');
    });

    it('should initialize with sample tasks', async () => {
      const result = await mockTaskInstance.operations.all();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);

      const setupTask = result.items.find((task: Task) => task.title === 'Setup project documentation');
      const reviewTask = result.items.find((task: Task) => task.title === 'Review code changes');

      expect(setupTask).toBeDefined();
      expect(setupTask.status).toBe('in-progress');
      expect(setupTask.priority).toBe('high');
      expect(setupTask.assignedTo).toBe('user-1');

      expect(reviewTask).toBeDefined();
      expect(reviewTask.status).toBe('pending');
      expect(reviewTask.priority).toBe('medium');
      expect(reviewTask.assignedTo).toBe('user-2');
    });
  });

  describe('User Operations', () => {
    it('should get all users', async () => {
      const result = await mockUserInstance.operations.all();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);

      const user = result.items[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('key');
      expect(user).toHaveProperty('events');
    });

    it('should get specific user by ID', async () => {
      const user = await mockUserInstance.operations.get({ kt: 'user', pk: 'user-1' });

      expect(user.id).toBe('user-1');
      expect(user.name).toBe('Alice Johnson');
      expect(user.email).toBe('alice@example.com');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(
        mockUserInstance.operations.get({ kt: 'user', pk: 'non-existent' })
      ).rejects.toThrow();
    });

    it('should create new user', async () => {
      const newUser: Partial<User> = {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        role: 'user'
      };

      const created = await mockUserInstance.operations.create(newUser as User);

      expect(created.name).toBe(newUser.name);
      expect(created.email).toBe(newUser.email);
      expect(created.role).toBe(newUser.role);
      expect(created.id).toBeDefined();
      expect(created.key).toBeDefined();
      expect(created.events.created.at).toBeDefined();
    });

    it('should update existing user', async () => {
      const updates = {
        name: 'Alice Johnson Updated',
        role: 'guest'
      };

      const updated = await mockUserInstance.operations.update(
        { kt: 'user', pk: 'user-1' },
        updates
      );

      expect(updated.name).toBe(updates.name);
      expect(updated.role).toBe(updates.role);
      expect(updated.email).toBe('alice@example.com'); // Should remain unchanged
      expect(updated.events.updated.at).toBeDefined();
    });

    it('should throw NotFoundError when updating non-existent user', async () => {
      await expect(
        mockUserInstance.operations.update(
          { kt: 'user', pk: 'non-existent' },
          { name: 'Test' }
        )
      ).rejects.toThrow();
    });

    it('should delete user', async () => {
      const result = await mockUserInstance.operations.remove({ kt: 'user', pk: 'user-2' });
      expect(result).toBeDefined();
      expect(result.id).toBe('user-2');
      expect(result.name).toBe('Bob Smith');

      // Verify user is deleted
      await expect(
        mockUserInstance.operations.get({ kt: 'user', pk: 'user-2' })
      ).rejects.toThrow();
    });

    it('should return false when deleting non-existent user', async () => {
      const result = await mockUserInstance.operations.remove({ kt: 'user', pk: 'non-existent' });
      expect(result).toBe(false);
    });
  });

  describe('Task Operations', () => {
    it('should get all tasks', async () => {
      const result = await mockTaskInstance.operations.all();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);

      const task = result.items[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('key');
      expect(task).toHaveProperty('events');
    });

    it('should get specific task by ID', async () => {
      const task = await mockTaskInstance.operations.get({ kt: 'task', pk: 'task-1' });

      expect(task.id).toBe('task-1');
      expect(task.title).toBe('Setup project documentation');
      expect(task.status).toBe('in-progress');
      expect(task.priority).toBe('high');
    });

    it('should throw NotFoundError for non-existent task', async () => {
      await expect(
        mockTaskInstance.operations.get({ kt: 'task', pk: 'non-existent' })
      ).rejects.toThrow();
    });

    it('should create new task', async () => {
      const newTask: Partial<Task> = {
        title: 'New Test Task',
        description: 'This is a test task',
        status: 'pending',
        priority: 'low',
        assignedTo: 'user-1'
      };

      const created = await mockTaskInstance.operations.create(newTask as Task);

      expect(created.title).toBe(newTask.title);
      expect(created.description).toBe(newTask.description);
      expect(created.status).toBe(newTask.status);
      expect(created.priority).toBe(newTask.priority);
      expect(created.assignedTo).toBe(newTask.assignedTo);
      expect(created.id).toBeDefined();
      expect(created.key).toBeDefined();
      expect(created.events.created.at).toBeDefined();
    });

    it('should update existing task', async () => {
      const updates = {
        title: 'Updated Task Title',
        status: 'completed',
        priority: 'medium'
      };

      const updated = await mockTaskInstance.operations.update(
        { kt: 'task', pk: 'task-1' },
        updates
      );

      expect(updated.title).toBe(updates.title);
      expect(updated.status).toBe(updates.status);
      expect(updated.priority).toBe(updates.priority);
      expect(updated.description).toBe('Create comprehensive documentation for the new project'); // Should remain unchanged
      expect(updated.events.updated.at).toBeDefined();
    });

    it('should throw NotFoundError when updating non-existent task', async () => {
      await expect(
        mockTaskInstance.operations.update(
          { kt: 'task', pk: 'non-existent' },
          { title: 'Test' }
        )
      ).rejects.toThrow();
    });

    it('should delete task', async () => {
      const result = await mockTaskInstance.operations.remove({ kt: 'task', pk: 'task-2' });
      expect(result).toBeDefined();
      expect(result.id).toBe('task-2');
      expect(result.title).toBe('Review code changes');

      // Verify task is deleted
      await expect(
        mockTaskInstance.operations.get({ kt: 'task', pk: 'task-2' })
      ).rejects.toThrow();
    });

    it('should return false when deleting non-existent task', async () => {
      const result = await mockTaskInstance.operations.remove({ kt: 'task', pk: 'non-existent' });
      expect(result).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should validate user data structure', async () => {
      const user = await mockUserInstance.operations.get({ kt: 'user', pk: 'user-1' });

      // Check required fields
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.key).toBeDefined();
      expect(user.events).toBeDefined();

      // Check key structure
      expect(user.key.kt).toBe('user');
      expect(user.key.pk).toBeDefined();

      // Check events structure
      expect(user.events.created).toBeDefined();
      expect(user.events.updated).toBeDefined();
      expect(user.events.deleted).toBeDefined();
      expect(user.events.created.at).toBeDefined();
    });

    it('should validate task data structure', async () => {
      const task = await mockTaskInstance.operations.get({ kt: 'task', pk: 'task-1' });

      // Check required fields
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.description).toBeDefined();
      expect(task.status).toBeDefined();
      expect(task.priority).toBeDefined();
      expect(task.key).toBeDefined();
      expect(task.events).toBeDefined();

      // Check key structure
      expect(task.key.kt).toBe('task');
      expect(task.key.pk).toBeDefined();

      // Check events structure
      expect(task.events.created).toBeDefined();
      expect(task.events.updated).toBeDefined();
      expect(task.events.deleted).toBeDefined();
      expect(task.events.created.at).toBeDefined();
    });
  });

  describe('Router Instance Methods', () => {
    it('should have getPkType method on user router', () => {
      expect(typeof userRouter.getPkType).toBe('function');
      expect(userRouter.getPkType()).toBe('user');
    });

    it('should have getPkType method on task router', () => {
      expect(typeof taskRouter.getPkType).toBe('function');
      expect(taskRouter.getPkType()).toBe('task');
    });

    it('should have getRouter method on user router', () => {
      expect(typeof userRouter.getRouter).toBe('function');
      const router = userRouter.getRouter();
      expect(router).toBeDefined();
    });

    it('should have getRouter method on task router', () => {
      expect(typeof taskRouter.getRouter).toBe('function');
      const router = taskRouter.getRouter();
      expect(router).toBeDefined();
    });
  });

  describe('Find Operations', () => {
    it('should find users by role', async () => {
      const adminUsers = await mockUserInstance.operations.find('byRole', { role: 'admin' });
      expect(Array.isArray(adminUsers)).toBe(true);
      expect(adminUsers.length).toBeGreaterThan(0);
      expect(adminUsers.every((user: User) => user.role === 'admin')).toBe(true);
    });

    it('should find users by email', async () => {
      const users = await mockUserInstance.operations.find('byEmail', { email: 'alice' });
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users.every((user: User) => user.email.includes('alice'))).toBe(true);
    });

    it('should find users with empty email search', async () => {
      const users = await mockUserInstance.operations.find('byEmail', { email: '' });
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should find users with non-matching email search', async () => {
      const users = await mockUserInstance.operations.find('byEmail', { email: 'nonexistent' });
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });

    it('should find users by unknown finder (default case)', async () => {
      const users = await mockUserInstance.operations.find('unknownFinder', {});
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should find tasks by status', async () => {
      const pendingTasks = await mockTaskInstance.operations.find('byStatus', { status: 'pending' });
      expect(Array.isArray(pendingTasks)).toBe(true);
      expect(pendingTasks.every((task: Task) => task.status === 'pending')).toBe(true);
    });

    it('should find tasks by assigned user', async () => {
      const userTasks = await mockTaskInstance.operations.find('byAssignee', { assignedTo: 'user-1' });
      expect(Array.isArray(userTasks)).toBe(true);
      expect(userTasks.every((task: Task) => task.assignedTo === 'user-1')).toBe(true);
    });

    it('should find tasks by priority', async () => {
      const highPriorityTasks = await mockTaskInstance.operations.find('byPriority', { priority: 'high' });
      expect(Array.isArray(highPriorityTasks)).toBe(true);
      expect(highPriorityTasks.every((task: Task) => task.priority === 'high')).toBe(true);
    });

    it('should find tasks with non-matching assignee', async () => {
      const tasks = await mockTaskInstance.operations.find('byAssignee', { assignedTo: 'nonexistent-user' });
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(0);
    });

    it('should find tasks by unknown finder (default case)', async () => {
      const tasks = await mockTaskInstance.operations.find('unknownFinder', {});
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  describe('Express App Integration', () => {
    let app: any;

    beforeEach(async () => {
      const result = await runBasicRouterExample();
      app = result.app;
    });

    it('should have health endpoint', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    it('should have request logging middleware', async () => {
      // Test middleware by making a request and verifying it works
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('healthy');
    });

    it('should mount user router on /api/users', async () => {
      // Test that user routes are working by making requests
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should mount task router on /api/tasks', async () => {
      // Test that task routes are working by making requests
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty user creation data gracefully', async () => {
      const emptyUser = {} as User;
      const created = await mockUserInstance.operations.create(emptyUser);

      expect(created.id).toBeDefined();
      expect(created.key).toBeDefined();
      expect(created.events.created.at).toBeDefined();
    });

    it('should handle empty task creation data gracefully', async () => {
      const emptyTask = {} as Task;
      const created = await mockTaskInstance.operations.create(emptyTask);

      expect(created.id).toBeDefined();
      expect(created.key).toBeDefined();
      expect(created.events.created.at).toBeDefined();
    });

    it('should handle partial user updates', async () => {
      const partialUpdate = { name: 'Updated Name Only' };
      const updated = await mockUserInstance.operations.update(
        { kt: 'user', pk: 'user-1' },
        partialUpdate
      );

      expect(updated.name).toBe('Updated Name Only');
      expect(updated.email).toBe('alice@example.com'); // Should remain unchanged
      expect(updated.role).toBe('admin'); // Should remain unchanged
    });

    it('should handle partial task updates', async () => {
      const partialUpdate = { status: 'completed' };
      const updated = await mockTaskInstance.operations.update(
        { kt: 'task', pk: 'task-1' },
        partialUpdate
      );

      expect(updated.status).toBe('completed');
      expect(updated.title).toBe('Setup project documentation'); // Should remain unchanged
      expect(updated.priority).toBe('high'); // Should remain unchanged
    });

    it('should preserve existing event timestamps on updates', async () => {
      const originalUser = await mockUserInstance.operations.get({ kt: 'user', pk: 'user-1' });
      const originalCreatedAt = originalUser.events.created.at;

      const updated = await mockUserInstance.operations.update(
        { kt: 'user', pk: 'user-1' },
        { name: 'Updated' }
      );

      expect(updated.events.created.at).toEqual(originalCreatedAt);
      expect(updated.events.updated.at).not.toEqual(originalCreatedAt);
      expect(updated.name).toBe('Updated');
    });
  });

  describe('Data Consistency and Persistence', () => {
    it('should maintain data consistency across operations', async () => {
      // Create a new user
      const newUser = await mockUserInstance.operations.create({
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      } as User);

      // Verify it appears in all users
      const allUsersResult = await mockUserInstance.operations.all();
      const foundUser = allUsersResult.items.find((u: User) => u.id === newUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser.name).toBe('Test User');

      // Update the user
      const updated = await mockUserInstance.operations.update(
        { kt: 'user', pk: newUser.id },
        { name: 'Updated Test User' }
      );

      // Verify update is reflected in get and all operations
      const retrievedUser = await mockUserInstance.operations.get({ kt: 'user', pk: newUser.id });
      expect(retrievedUser.name).toBe('Updated Test User');

      const allUsersAfterUpdateResult = await mockUserInstance.operations.all();
      const foundUpdatedUser = allUsersAfterUpdateResult.items.find((u: User) => u.id === newUser.id);
      expect(foundUpdatedUser?.name).toBe('Updated Test User');
    });

    it('should maintain task-user relationship integrity', async () => {
      // Create a new user
      const newUser = await mockUserInstance.operations.create({
        name: 'Task Owner',
        email: 'owner@example.com',
        role: 'user'
      } as User);

      // Create a task assigned to this user
      const newTask = await mockTaskInstance.operations.create({
        title: 'User Task',
        description: 'Task for specific user',
        assignedTo: newUser.id,
        status: 'pending',
        priority: 'medium'
      } as Task);

      // Verify relationship
      expect(newTask.assignedTo).toBe(newUser.id);

      // Find tasks by this assignee
      const userTasks = await mockTaskInstance.operations.find('byAssignee', { assignedTo: newUser.id });
      expect(userTasks.length).toBe(1);
      expect(userTasks[0].id).toBe(newTask.id);
    });
  });

  describe('Memory and Performance', () => {
    it('should handle multiple operations efficiently', async () => {
      const startTime = Date.now();
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        await mockUserInstance.operations.create({
          name: `Performance Test User ${i}`,
          email: `perf${i}@example.com`,
          role: 'user'
        } as User);
      }

      const creationTime = Date.now() - startTime;

      const fetchStart = Date.now();
      const allUsersResult = await mockUserInstance.operations.all();
      const fetchTime = Date.now() - fetchStart;

      expect(allUsersResult.items.length).toBeGreaterThanOrEqual(iterations);
      expect(creationTime).toBeLessThan(1000); // Should complete within 1 second
      expect(fetchTime).toBeLessThan(100); // Should fetch within 100ms
    });

    it('should manage memory usage for large datasets', async () => {
      const initialMemory = process.memoryUsage();
      const largeDatasetSize = 100;

      // Create a large dataset
      for (let i = 0; i < largeDatasetSize; i++) {
        await mockTaskInstance.operations.create({
          title: `Large Dataset Task ${i}`,
          description: `Description for task ${i}`,
          status: 'pending',
          priority: 'low'
        } as Task);
      }

      const afterCreationMemory = process.memoryUsage();
      const creationMemoryIncrease = afterCreationMemory.heapUsed - initialMemory.heapUsed;

      // Fetch all tasks
      const allTasksResult = await mockTaskInstance.operations.all();
      expect(allTasksResult.items.length).toBeGreaterThanOrEqual(largeDatasetSize);

      const finalMemory = process.memoryUsage();

      // Memory usage should be reasonable (less than 50MB increase)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB in bytes

      console.log(`Memory usage test: ${Math.round(memoryIncrease / 1024)} kB increase for ${largeDatasetSize} tasks`);
      console.log(`Creation phase: ${Math.round(creationMemoryIncrease / 1024)} kB`);
    });
  });

  describe('Date and Time Handling', () => {
    it('should handle date fields correctly in users', async () => {
      const testDate = new Date('2025-02-01T12:00:00Z');
      const userWithDate = await mockUserInstance.operations.create({
        name: 'Date Test User',
        email: 'datetest@example.com',
        role: 'user',
        lastLogin: testDate
      } as User);

      expect(userWithDate.lastLogin).toEqual(testDate);
      expect(userWithDate.events.created.at).toBeInstanceOf(Date);
      expect(userWithDate.events.updated.at).toBeInstanceOf(Date);
    });

    it('should handle date fields correctly in tasks', async () => {
      const dueDate = new Date('2025-03-15T09:00:00Z');
      const taskWithDate = await mockTaskInstance.operations.create({
        title: 'Date Test Task',
        description: 'Task with due date',
        status: 'pending',
        priority: 'medium',
        dueDate: dueDate
      } as Task);

      expect(taskWithDate.dueDate).toEqual(dueDate);
      expect(taskWithDate.events.created.at).toBeInstanceOf(Date);
      expect(taskWithDate.events.updated.at).toBeInstanceOf(Date);
    });

    it('should handle optional date fields', async () => {
      const userWithoutLastLogin = await mockUserInstance.operations.create({
        name: 'No Login User',
        email: 'nologin@example.com',
        role: 'guest'
      } as User);

      expect(userWithoutLastLogin.lastLogin).toBeUndefined();
      expect(userWithoutLastLogin.events.created.at).toBeInstanceOf(Date);

      const taskWithoutDueDate = await mockTaskInstance.operations.create({
        title: 'No Due Date Task',
        description: 'Task without due date',
        status: 'pending',
        priority: 'low'
      } as Task);

      expect(taskWithoutDueDate.dueDate).toBeUndefined();
      expect(taskWithoutDueDate.assignedTo).toBeUndefined();
      expect(taskWithoutDueDate.events.created.at).toBeInstanceOf(Date);
    });
  });

  describe('HTTP Endpoint Integration Tests', () => {
    let app: any;

    beforeEach(async () => {
      const result = await runBasicRouterExample();
      app = result.app;
    });

    describe('Health Endpoint', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        expect(response.body).toHaveProperty('status', 'healthy');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('tasks');
        expect(typeof response.body.users).toBe('number');
        expect(typeof response.body.tasks).toBe('number');
        expect(response.body.users).toBeGreaterThan(0);
        expect(response.body.tasks).toBeGreaterThan(0);
      });

      it('should return valid timestamp format', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        const timestamp = new Date(response.body.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).not.toBeNaN();
      });
    });

    describe('Dashboard Endpoint', () => {
      it('should return dashboard summary', async () => {
        const response = await request(app)
          .get('/api/dashboard')
          .expect(200);

        expect(response.body).toHaveProperty('summary');
        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('recentTasks');

        const { summary } = response.body;
        expect(summary).toHaveProperty('totalUsers');
        expect(summary).toHaveProperty('totalTasks');
        expect(summary).toHaveProperty('completedTasks');
        expect(summary).toHaveProperty('pendingTasks');
        expect(summary).toHaveProperty('inProgressTasks');

        expect(typeof summary.totalUsers).toBe('number');
        expect(typeof summary.totalTasks).toBe('number');
        expect(typeof summary.completedTasks).toBe('number');
        expect(typeof summary.pendingTasks).toBe('number');
        expect(typeof summary.inProgressTasks).toBe('number');
      });

      it('should return user summaries', async () => {
        const response = await request(app)
          .get('/api/dashboard')
          .expect(200);

        expect(Array.isArray(response.body.users)).toBe(true);
        expect(response.body.users.length).toBeGreaterThan(0);

        const user = response.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
        expect(typeof user.id).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(['admin', 'user', 'guest']).toContain(user.role);
      });

      it('should return recent tasks (max 5)', async () => {
        const response = await request(app)
          .get('/api/dashboard')
          .expect(200);

        expect(Array.isArray(response.body.recentTasks)).toBe(true);
        expect(response.body.recentTasks.length).toBeLessThanOrEqual(5);

        if (response.body.recentTasks.length > 0) {
          const task = response.body.recentTasks[0];
          expect(task).toHaveProperty('id');
          expect(task).toHaveProperty('title');
          expect(task).toHaveProperty('status');
          expect(task).toHaveProperty('priority');
          expect(task).toHaveProperty('events');
        }
      });

      it('should have consistent summary counts', async () => {
        const response = await request(app)
          .get('/api/dashboard')
          .expect(200);

        const { summary } = response.body;
        const totalTasksByStatus = summary.completedTasks + summary.pendingTasks + summary.inProgressTasks;

        expect(totalTasksByStatus).toBeLessThanOrEqual(summary.totalTasks);
      });
    });

    describe('User API Endpoints', () => {
      it('should get all users', async () => {
        const response = await request(app)
          .get('/api/users')
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('metadata');
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items.length).toBeGreaterThan(0);

        const user = response.body.items[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      });

      it('should get specific user by ID', async () => {
        const response = await request(app)
          .get('/api/users/user-1')
          .expect(200);

        expect(response.body.id).toBe('user-1');
        expect(response.body.name).toBe('Alice Johnson');
        expect(response.body.email).toBe('alice@example.com');
        expect(response.body.role).toBe('admin');
      });

      it('should return 404 for non-existent user', async () => {
        await request(app)
          .get('/api/users/non-existent')
          .expect(404);
      });

      it('should create new user', async () => {
        const newUser = {
          name: 'HTTP Test User',
          email: 'httptest@example.com',
          role: 'user'
        };

        const response = await request(app)
          .post('/api/users')
          .send(newUser)
          .expect(201);

        expect(response.body.name).toBe(newUser.name);
        expect(response.body.email).toBe(newUser.email);
        expect(response.body.role).toBe(newUser.role);
        expect(response.body.id).toBeDefined();
        expect(response.body.key).toBeDefined();
      });

      it('should update existing user', async () => {
        const updates = {
          name: 'Alice Updated via HTTP',
          role: 'guest'
        };

        const response = await request(app)
          .put('/api/users/user-1')
          .send(updates)
          .expect(200);

        expect(response.body.name).toBe(updates.name);
        expect(response.body.role).toBe(updates.role);
        expect(response.body.email).toBe('alice@example.com'); // Should remain unchanged
      });

      it('should delete user', async () => {
        // First create a user to delete
        const newUser = await request(app)
          .post('/api/users')
          .send({
            name: 'User to Delete',
            email: 'delete@example.com',
            role: 'user'
          })
          .expect(201);

        // Then delete it
        await request(app)
          .delete(`/api/users/${newUser.body.id}`)
          .expect(200);

        // Verify it's gone
        await request(app)
          .get(`/api/users/${newUser.body.id}`)
          .expect(404);
      });
    });

    describe('Task API Endpoints', () => {
      it('should get all tasks', async () => {
        const response = await request(app)
          .get('/api/tasks')
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('metadata');
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items.length).toBeGreaterThan(0);

        const task = response.body.items[0];
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('priority');
      });

      it('should get specific task by ID', async () => {
        const response = await request(app)
          .get('/api/tasks/task-1')
          .expect(200);

        expect(response.body.id).toBe('task-1');
        expect(response.body.title).toBe('Setup project documentation');
        expect(response.body.status).toBe('in-progress');
        expect(response.body.priority).toBe('high');
      });

      it('should return 404 for non-existent task', async () => {
        await request(app)
          .get('/api/tasks/non-existent')
          .expect(404);
      });

      it('should create new task', async () => {
        const newTask = {
          title: 'HTTP Test Task',
          description: 'Task created via HTTP test',
          status: 'pending',
          priority: 'medium',
          assignedTo: 'user-1'
        };

        const response = await request(app)
          .post('/api/tasks')
          .send(newTask)
          .expect(201);

        expect(response.body.title).toBe(newTask.title);
        expect(response.body.description).toBe(newTask.description);
        expect(response.body.status).toBe(newTask.status);
        expect(response.body.priority).toBe(newTask.priority);
        expect(response.body.assignedTo).toBe(newTask.assignedTo);
        expect(response.body.id).toBeDefined();
        expect(response.body.key).toBeDefined();
      });

      it('should update existing task', async () => {
        const updates = {
          title: 'Updated Task via HTTP',
          status: 'completed',
          priority: 'low'
        };

        const response = await request(app)
          .put('/api/tasks/task-1')
          .send(updates)
          .expect(200);

        expect(response.body.title).toBe(updates.title);
        expect(response.body.status).toBe(updates.status);
        expect(response.body.priority).toBe(updates.priority);
        expect(response.body.description).toBe('Create comprehensive documentation for the new project'); // Should remain unchanged
      });

      it('should delete task', async () => {
        // First create a task to delete
        const newTask = await request(app)
          .post('/api/tasks')
          .send({
            title: 'Task to Delete',
            description: 'This task will be deleted',
            status: 'pending',
            priority: 'low'
          })
          .expect(201);

        // Then delete it
        await request(app)
          .delete(`/api/tasks/${newTask.body.id}`)
          .expect(200);

        // Verify it's gone
        await request(app)
          .get(`/api/tasks/${newTask.body.id}`)
          .expect(404);
      });
    });

    describe('Error Handling in HTTP Endpoints', () => {
      it('should handle invalid JSON in POST requests', async () => {
        await request(app)
          .post('/api/users')
          .set('Content-Type', 'application/json')
          .send('invalid json')
          .expect(400);
      });

      it('should handle missing required fields gracefully', async () => {
        // This should still work based on the implementation but might create a user with undefined fields
        const response = await request(app)
          .post('/api/users')
          .send({})
          .expect(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.key).toBeDefined();
      });

      it('should handle very long field values', async () => {
        const longString = 'a'.repeat(10000);
        const userWithLongFields = {
          name: longString,
          email: `${longString}@example.com`,
          role: 'user'
        };

        const response = await request(app)
          .post('/api/users')
          .send(userWithLongFields)
          .expect(201);

        expect(response.body.name).toBe(longString);
        expect(response.body.email).toBe(`${longString}@example.com`);
      });
    });

    describe('Content-Type and Headers', () => {
      it('should return JSON content type for all endpoints', async () => {
        const endpoints = [
          '/api/health',
          '/api/dashboard',
          '/api/users',
          '/api/tasks'
        ];

        for (const endpoint of endpoints) {
          const response = await request(app)
            .get(endpoint)
            .expect(200);

          expect(response.headers['content-type']).toMatch(/application\/json/);
        }
      });

      it('should handle requests without content-type header', async () => {
        await request(app)
          .get('/api/health')
          .expect(200);
      });

      it('should handle CORS-related headers if present', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        // Just check that the request succeeds - CORS handling would be tested separately
        expect(response.status).toBe(200);
      });
    });
  });
});
