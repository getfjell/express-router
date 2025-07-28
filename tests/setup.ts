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

vi.mock('../src/logger', () => ({
  default: {
    get: vi.fn(() => mockLogger),
    ...mockLoggerMethods,
  },
}));

// Mock @fjell/lib as well since it's used across multiple test files
vi.mock('@fjell/lib');
