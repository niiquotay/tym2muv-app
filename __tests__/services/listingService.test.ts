import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getListings, getListingById, createListing } from '../../services/supabaseService';
import { mockSupabase } from '../mocks/supabase';

// Mock the cache wrapper to execute immediately
vi.mock('../../services/cacheService', () => ({
  withCache: vi.fn((key, fetcher) => fetcher()),
  cacheKey: vi.fn(),
  delCache: vi.fn(),
  CACHE_TTL: { LISTINGS: 300 },
  invalidateCachePrefix: vi.fn()
}));

describe('Listing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getListings returns mapped listings', async () => {
    const mockData = [{ id: '1', title: 'Test Property', price: 1000 }];
    
    // We must mock the chained calls exactly
    const mockChained: any = {};
    const chainMethods = ['eq', 'gte', 'lte', 'ilike', 'order', 'range', 'contains'];
    chainMethods.forEach(method => {
      mockChained[method] = vi.fn().mockReturnValue(mockChained);
    });
    
    // Promise resolution is usually handled by then(), or when awaited the object itself is awaited
    // Supabase query builder is a Promise-like (thenable) object.
    mockChained.then = (resolve: any) => resolve({ data: mockData, count: 1, error: null });
    
    const mockFrom = {
      select: vi.fn().mockReturnValue(mockChained)
    };
    
    mockSupabase.from.mockReturnValue(mockFrom as any);

    const result = await getListings();
    expect(result.listings.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('getListingById returns a listing', async () => {
    const mockData = { id: '1', title: 'Detail Property' };
    
    const mockChained = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null })
    };
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(mockChained)
    } as any);

    const result = await getListingById('1');
    expect(result?.id).toBe('1');
  });

  it('createListing performs insert', async () => {
    const mockChained = {
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null }) })
    };
    
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChained)
    } as any);

    const newListing = {
      title: 'New Listing',
      categoryId: 'cat1',
      price: 1500,
      location: 'Accra',
      description: 'Test text'
    };

    const result = await createListing(newListing as any);
    expect(result).toBe('123');
    expect(mockSupabase.from).toHaveBeenCalledWith('properties');
  });
});
