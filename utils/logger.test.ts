import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('Logger utility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('formats info logs correctly', () => {
    logger.info('Test info', { userId: 123 });
    expect(console.info).toHaveBeenCalled();
    const mockCall = vi.mocked(console.info).mock.calls[0];
    expect(mockCall[0]).toBe('[INFO]');
    expect(mockCall[1]).toBe('Test info');
    expect(mockCall[2]).toEqual({ userId: 123 });
  });

  it('formats error logs correctly', () => {
    const err = new Error('Test error');
    logger.error(err, { route: '/cart' });
    expect(console.error).toHaveBeenCalled();
    const mockCall = vi.mocked(console.error).mock.calls[0];
    expect(mockCall[0]).toBe('[ERROR]');
    expect(mockCall[1]).toBe(err);
    expect(mockCall[2]).toEqual({ route: '/cart' });
  });
});
