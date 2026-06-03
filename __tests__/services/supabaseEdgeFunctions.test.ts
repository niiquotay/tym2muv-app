import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPayment } from '../../services/supabaseEdgeFunctions';

describe('Supabase Edge Functions', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  it('calls process-payment function successfully', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as any);

    const result = await processPayment('user1', 'premium') as any;
    
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/process-payment'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ agent_id: 'user1', plan: 'premium' })
      })
    );
    expect(result.success).toBe(true);
  });

  it('throws an error if function invocation fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Network error' }),
    } as any);

    await expect(processPayment('user1', 'premium')).rejects.toThrow('Network error');
  });
});
