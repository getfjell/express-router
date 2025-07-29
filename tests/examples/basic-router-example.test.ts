/**
 * Basic Router Example Tests
 *
 * Tests to verify the basic router example functionality.
 * Tests cover data initialization, router creation, and core operations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
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
      const users = await mockUserInstance.operations.all();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      const alice = users.find((user: User) => user.name === 'Alice Johnson');
      const bob = users.find((user: User) => user.name === 'Bob Smith');

      expect(alice).toBeDefined();
      expect(alice.email).toBe('alice@example.com');
      expect(alice.role).toBe('admin');

      expect(bob).toBeDefined();
      expect(bob.email).toBe('bob@example.com');
      expect(bob.role).toBe('user');
    });

    it('should initialize with sample tasks', async () => {
      const tasks = await mockTaskInstance.operations.all();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);

      const setupTask = tasks.find((task: Task) => task.title === 'Setup project documentation');
      const reviewTask = tasks.find((task: Task) => task.title === 'Review code changes');

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
      const users = await mockUserInstance.operations.all();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      const user = users[0];
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
      expect(result).toBe(true);

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
      const tasks = await mockTaskInstance.operations.all();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);

      const task = tasks[0];
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
      expect(result).toBe(true);

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
  });
});
