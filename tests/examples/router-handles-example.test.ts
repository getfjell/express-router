import { describe, expect, it } from 'vitest';
import { app, postRouter, userRouter } from '../../examples/router-handlers-example';

describe('Router Handlers Example', () => {
  it('should create Express app with routers', () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('should create user router with handlers', () => {
    expect(userRouter).toBeDefined();
    expect(userRouter.getRouter).toBeDefined();
    expect(typeof userRouter.getRouter).toBe('function');
  });

  it('should create post router with handlers', () => {
    expect(postRouter).toBeDefined();
    expect(postRouter.getRouter).toBeDefined();
    expect(typeof postRouter.getRouter).toBe('function');
  });

  it('should have router-level handlers configured', () => {
    // Check that routers have the expected handler configurations
    const userRouterConfig = (userRouter as any).options;
    const postRouterConfig = (postRouter as any).options;

    expect(userRouterConfig.actions).toBeDefined();
    expect(userRouterConfig.facets).toBeDefined();
    expect(userRouterConfig.allActions).toBeDefined();
    expect(userRouterConfig.allFacets).toBeDefined();

    expect(postRouterConfig.actions).toBeDefined();
    expect(postRouterConfig.facets).toBeDefined();
    expect(postRouterConfig.allActions).toBeDefined();
    expect(postRouterConfig.allFacets).toBeDefined();
  });
});
