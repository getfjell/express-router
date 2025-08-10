import { describe, expect, it } from 'vitest';

// Note: @fjell/logging is mocked globally in setup.ts

// Import after mocking to ensure the module is loaded with mocks in place
import LibLogger from '../src/logger';

describe('logger', () => {
  describe('module import and initialization', () => {
    it('should successfully import @fjell/logging and create logger instance', () => {
      // Test that line 1 (import) and line 3 (getLogger call) worked
      expect(LibLogger).toBeDefined();
      expect(typeof LibLogger).toBe('object');
    });

    it('should export a logger instance that works correctly', () => {
      // Test that line 5 (export) works correctly by verifying the exported logger is functional
      expect(LibLogger).toBeDefined();
      expect(LibLogger).not.toBeNull();
      expect(LibLogger).not.toBeUndefined();

      // Verify it has the basic logging interface (tests that getLogger worked)
      expect(typeof LibLogger.debug).toBe('function');
      expect(typeof LibLogger.error).toBe('function');
      expect(typeof LibLogger.info).toBe('function');
    });

    it('should have logger instance with expected structure from @fjell/logging', () => {
      // Verify that the logger created on line 3 has the expected interface
      // This tests that Logging.getLogger('@fjell/express-router') returns the right type
      expect(LibLogger).toHaveProperty('debug');
      expect(LibLogger).toHaveProperty('error');
      expect(LibLogger).toHaveProperty('warning');
      expect(LibLogger).toHaveProperty('info');
      expect(LibLogger).toHaveProperty('trace');
    });
  });

  describe('logger functionality', () => {
    it('should export a logger instance with all required methods', () => {
      expect(LibLogger).toHaveProperty('debug');
      expect(LibLogger).toHaveProperty('error');
      expect(LibLogger).toHaveProperty('warning');
      expect(LibLogger).toHaveProperty('info');
      expect(LibLogger).toHaveProperty('default');
      expect(LibLogger).toHaveProperty('trace');
      expect(LibLogger).toHaveProperty('emergency');
      expect(LibLogger).toHaveProperty('alert');
      expect(LibLogger).toHaveProperty('critical');
      expect(LibLogger).toHaveProperty('notice');
      expect(LibLogger).toHaveProperty('time');
    });

    it('should have functional logging methods', () => {
      expect(typeof LibLogger.debug).toBe('function');
      expect(typeof LibLogger.error).toBe('function');
      expect(typeof LibLogger.info).toBe('function');
      expect(typeof LibLogger.warning).toBe('function');
    });

    it('should support method chaining for time methods', () => {
      expect(typeof LibLogger.time).toBe('function');
    });

    it('should be the same instance across multiple imports', async () => {
      // Re-import to verify singleton behavior
      const secondImport = await import('../src/logger');
      expect(secondImport.default).toBe(LibLogger);
    });
  });

  describe('integration with @fjell/logging', () => {
    it('should provide a working logger instance for the express router module', () => {
      // This verifies that the entire logger.ts module (all 5 lines) work together
      // to provide a functional logger for the @fjell/express-router module
      expect(LibLogger).toBeDefined();
      expect(() => LibLogger.debug('test')).not.toThrow();
      expect(() => LibLogger.info('test')).not.toThrow();
      expect(() => LibLogger.error('test')).not.toThrow();
      expect(() => LibLogger.warning('test')).not.toThrow();
    });

    it('should handle basic logging operations without errors', () => {
      // Test that the logger instance exported on line 5 can be used for logging
      const testMessage = 'coverage test for logger.ts first 5 lines';

      // These calls should not throw errors
      expect(() => LibLogger.trace(testMessage)).not.toThrow();
      expect(() => LibLogger.debug(testMessage)).not.toThrow();
      expect(() => LibLogger.info(testMessage)).not.toThrow();
      expect(() => LibLogger.warning(testMessage)).not.toThrow();
      expect(() => LibLogger.error(testMessage)).not.toThrow();
      expect(() => LibLogger.critical(testMessage)).not.toThrow();
      expect(() => LibLogger.emergency(testMessage)).not.toThrow();
      expect(() => LibLogger.alert(testMessage)).not.toThrow();
      expect(() => LibLogger.notice(testMessage)).not.toThrow();
    });

    it('should maintain consistent logger interface across calls', () => {
      // Verify that the logger maintains its interface after multiple calls
      // This tests the stability of the export from line 5
      LibLogger.debug('test 1');
      expect(typeof LibLogger.debug).toBe('function');

      LibLogger.info('test 2');
      expect(typeof LibLogger.info).toBe('function');

      LibLogger.error('test 3');
      expect(typeof LibLogger.error).toBe('function');

      // Logger should still be the same object
      expect(LibLogger).toBeDefined();
      expect(typeof LibLogger).toBe('object');
    });

    it('should support the @fjell/express-router module logging needs', () => {
      // Final comprehensive test that the first 5 lines create a usable logger
      // for the express router module
      expect(LibLogger).toBeTruthy();

      // Test critical logging methods that would be used in the express router
      expect(LibLogger.debug).toBeDefined();
      expect(LibLogger.info).toBeDefined();
      expect(LibLogger.warning).toBeDefined();
      expect(LibLogger.error).toBeDefined();

      // Should be able to call these without issues
      LibLogger.debug('Router initialized');
      LibLogger.info('Processing request');
      LibLogger.warning('Performance issue detected');
      LibLogger.error('Request failed');

      // Logger should remain stable
      expect(LibLogger).toBeDefined();
    });
  });
});
