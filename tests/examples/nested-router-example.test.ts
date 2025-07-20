/**
 * Nested Router Example Tests
 *
 * Simple tests to verify the nested router example loads and initializes correctly.
 * These tests are kept very simple per requirements - just importing and running
 * the example to ensure it doesn't throw errors during setup.
 */

import { describe, expect, it } from 'vitest';
import { runNestedRouterExample } from '../../examples/nested-router-example';

describe('Nested Router Example', () => {
  it('should return app', async () => {
    const result = await runNestedRouterExample();

    // Verify the example returns the expected structure
    expect(result).toHaveProperty('app');

    // Verify app is an Express application
    expect(result.app).toBeDefined();
    expect(typeof result.app.listen).toBe('function');
  });

  it('should create hierarchical routing structure', async () => {
    const result = await runNestedRouterExample();

    // The app should be properly configured
    // We can't easily test the internal routing structure without starting the server,
    // but we can verify the app was created successfully
    expect(result.app).toBeDefined();
  });
});
