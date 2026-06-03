import { vi } from 'vitest';

export const mockRedisClient = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  scan: vi.fn().mockResolvedValue([0, []]),
};

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => mockRedisClient)
}));
