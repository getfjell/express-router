import { vi } from 'vitest';

// Global logger mock - handles both CItemRouter and PItemRouter patterns
const mockLoggerMethods = {
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  critical: vi.fn(),
  error: vi.fn(),
  trace: vi.fn(),
  emergency: vi.fn(),
  alert: vi.fn(),
  notice: vi.fn(),
  time: vi.fn().mockReturnThis(),
  end: vi.fn(),
  log: vi.fn(),
  default: vi.fn(), // Handle the mysterious logger.default() calls
};

const mockLogger = {
  ...mockLoggerMethods,
  get: vi.fn(() => mockLogger), // For nested logger.get(req.path) calls
};

// Mock @fjell/logging globally so all tests can use the logger
// This allows src/logger.ts code to execute while providing a consistent mock
vi.mock('@fjell/logging', () => {
  // Create a comprehensive mock logger instance with all the methods used in the codebase
  const createLoggerInstance = () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    default: vi.fn(), // This is used in CItemRouter and PItemRouter
    trace: vi.fn(),
    emergency: vi.fn(),
    alert: vi.fn(),
    critical: vi.fn(),
    notice: vi.fn(),
    time: vi.fn().mockReturnThis(),
  });

  // Create the main logger that has a .get() method
  const createMainLogger = () => ({
    ...createLoggerInstance(),
    get: vi.fn(() => createLoggerInstance()), // Returns a logger instance when .get() is called
  });

  // Create the mock for the Logging module - it should have getLogger as a method
  const mockLoggingModule = {
    getLogger: vi.fn(() => createMainLogger())
  };

  return {
    default: mockLoggingModule, // Default export needs to be the module
    ...mockLoggingModule // Also provide as named exports
  };
});

// Mock @fjell/lib as well since it's used across multiple test files
vi.mock('@fjell/lib');
