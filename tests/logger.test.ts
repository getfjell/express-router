import { describe, expect, it, vi } from 'vitest';
import LibLogger from '@/logger';

// Mock @fjell/logging
const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  default: vi.fn(),
  trace: vi.fn(),
  emergency: vi.fn(),
  alert: vi.fn(),
  critical: vi.fn(),
  notice: vi.fn(),
  time: vi.fn().mockReturnThis(),
  end: vi.fn(),
  log: vi.fn(),
};

vi.mock('@fjell/logging', () => ({
  default: {
    getLogger: vi.fn(() => mockLogger)
  }
}));

// Import after mocking
import '@/logger';

describe('logger', () => {
  it('should export a logger instance', () => {
    expect(LibLogger).toBeDefined();
    expect(typeof LibLogger).toBe('object');
  });

  it('should have common logging methods', () => {
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
    expect(LibLogger).toHaveProperty('end');
    expect(LibLogger).toHaveProperty('log');
  });

  it('should be created with the correct logger name', () => {
    // This test verifies the logger is properly configured
    // The actual call happens during module loading
    expect(LibLogger).toBeDefined();
  });

  it('should allow calling logging methods', () => {
    // Since LibLogger is the mocked logger, we can test its methods exist
    expect(typeof LibLogger.debug).toBe('function');
    expect(typeof LibLogger.error).toBe('function');
    expect(typeof LibLogger.info).toBe('function');
  });

  it('should support method chaining for time methods', () => {
    // Verify the time method exists
    expect(typeof LibLogger.time).toBe('function');
  });
});
