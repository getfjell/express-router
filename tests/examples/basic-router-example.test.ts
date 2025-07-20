/**
 * Basic Router Example Tests
 *
 * Simple tests to verify the basic router example loads and initializes correctly.
 * These tests are kept very simple per requirements - just importing and running
 * the example to ensure it doesn't throw errors during setup.
 */

import { describe, expect, it } from 'vitest';
import { runBasicRouterExample } from '../../examples/basic-router-example';

describe('Basic Router Example', () => {
  it('should initialize without errors', async () => {
    // Test that the example runs without throwing errors
    await expect(runBasicRouterExample()).resolves.toBeDefined();
  });

  it('should return app and routers', async () => {
    const result = await runBasicRouterExample();

    // Verify the example returns the expected structure
    expect(result).toHaveProperty('app');
    expect(result).toHaveProperty('userRouter');
    expect(result).toHaveProperty('taskRouter');

    // Verify app is an Express application
    expect(result.app).toBeDefined();
    expect(typeof result.app.listen).toBe('function');

    // Verify routers are router instances
    expect(result.userRouter).toBeDefined();
    expect(result.taskRouter).toBeDefined();
  });

  it('should have proper router configuration', async () => {
    const result = await runBasicRouterExample();

    // Verify routers have the expected primary key types
    expect(result.userRouter.getPkType()).toBe('user');
    expect(result.taskRouter.getPkType()).toBe('task');
  });
});
