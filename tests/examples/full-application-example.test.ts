/**
 * Full Application Example Tests
 *
 * Simple tests to verify the full application example loads and initializes correctly.
 * These tests are kept very simple per requirements - just importing and running
 * the example to ensure it doesn't throw errors during setup.
 */

import { describe, expect, it } from 'vitest';
import { runFullApplicationExample } from '../../examples/full-application-example';

describe('Full Application Example', () => {
  it('should return app', async () => {
    const result = await runFullApplicationExample();

    // Verify the example returns the expected structure
    expect(result).toHaveProperty('app');

    // Verify app is an Express application
    expect(result.app).toBeDefined();
    expect(typeof result.app.listen).toBe('function');
  });

  it('should setup production-ready application', async () => {
    const result = await runFullApplicationExample();

    // The app should be properly configured with middleware and routes
    // We can't easily test the internal structure without starting the server,
    // but we can verify the app was created successfully
    expect(result.app).toBeDefined();

    // Verify it's an Express app with the expected methods
    expect(typeof result.app.get).toBe('function');
    expect(typeof result.app.post).toBe('function');
    expect(typeof result.app.use).toBe('function');
  });
});
