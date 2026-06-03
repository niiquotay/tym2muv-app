import { describe, it, expect } from 'vitest';
import { generateIdempotencyKey } from '../../utils/idempotency';

describe('generateIdempotencyKey', () => {
  it('generates a string starting with ik_', async () => {
    // we need to mock crypto.subtle in jsdom
    if (!global.crypto) {
      global.crypto = {} as any;
    }
    if (!global.crypto.subtle) {
      Object.defineProperty(global.crypto, 'subtle', {
        value: {
          digest: async () => new Uint8Array(32).buffer
        },
        configurable: true
      });
    }

    const key = await generateIdempotencyKey('user1', 'list1', 100);
    expect(key.startsWith('ik_')).toBe(true);
    expect(key.length).toBeGreaterThan(10);
  });
});
