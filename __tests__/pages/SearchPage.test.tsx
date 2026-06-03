import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../../pages/SearchPage';
import { AuthProvider } from '../../context/AuthContext';
import { LocationProvider } from '../../context/LocationContext';
import { vi } from 'vitest';
import * as supabaseService from '../../services/supabaseService';

vi.mock('../../services/supabaseService', () => ({
  subscribeToAuth: vi.fn().mockImplementation((cb) => { cb({ id: 'test' }); return () => {}; }),
  getUserProfile: vi.fn().mockResolvedValue({ id: 'test', role: 'Customer' }),
  getListings: vi.fn().mockResolvedValue({
    listings: [
      { id: '1', title: 'Amazing Apartment', price: 2000, category_id: 'residential', images: [], bedrooms: 4, propertyType: 'Mansion', currency: 'USD' }
    ],
    total: 1,
    hasMore: false
  }),
  getSavedListingsIds: vi.fn().mockResolvedValue([]),
  searchListings: vi.fn().mockResolvedValue([])
}));

describe('SearchPage', () => {
  it('renders search results correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <LocationProvider>
              <SearchPage />
            </LocationProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    // Check if the mock listing is displayed
    const listingTitles = await screen.findAllByText(/4 Bedrooms \| Mansion/i);
    expect(listingTitles.length).toBeGreaterThan(0);
  });
});
