import { describe, it, expect, vi } from 'vitest';
import { withRetry } from './api';

describe('withRetry utility', () => {
  it('returns successful result on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    // speed up retry delay for test
    const result = await withRetry(fn, 3, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws error if all retries fail', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    
    await expect(withRetry(fn, 3, 10)).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries = 4 attempts
  });
});
