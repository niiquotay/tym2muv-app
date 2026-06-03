import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostAd from '../../pages/PostAd';
import { AuthProvider } from '../../context/AuthContext';
import { LocationProvider } from '../../context/LocationContext';
import { vi } from 'vitest';
import * as supabaseService from '../../services/supabaseService';

vi.mock('../../services/supabaseService', () => ({
  subscribeToAuth: vi.fn((cb) => { cb({ id: 'test', role: 'Agent' }); return () => {}; }),
  createListing: vi.fn(),
  getUserProfile: vi.fn().mockResolvedValue({ id: 'test', role: 'Agent' }),
}));

describe('PostAd Page', () => {
  it('renders form steps', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <LocationProvider>
              <PostAd />
            </LocationProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Photos/i)).toBeInTheDocument();
  });
});
