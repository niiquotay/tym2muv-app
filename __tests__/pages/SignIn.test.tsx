import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignIn from '../../pages/SignIn';
import { AuthProvider } from '../../context/AuthContext';
import { vi } from 'vitest';
import * as supabaseService from '../../services/supabaseService';

vi.mock('../../services/supabaseService', () => ({
  loginWithGoogle: vi.fn(),
  loginWithLinkedIn: vi.fn(),
  getUserProfile: vi.fn().mockResolvedValue({ id: '1', role: 'Customer', name: 'Test' }),
  subscribeToAuth: vi.fn().mockReturnValue(() => {})
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('SignIn Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login options correctly', () => {
    renderWithRouter(<SignIn />);
    expect(screen.getByTitle('Sign in with Google')).toBeInTheDocument();
    expect(screen.getByTitle('Sign in with LinkedIn')).toBeInTheDocument();
  });

  it('calls loginWithGoogle on Google button click', async () => {
    renderWithRouter(<SignIn />);
    
    await act(async () => {
      fireEvent.click(screen.getByTitle('Sign in with Google'));
    });

    await waitFor(() => {
      expect(supabaseService.loginWithGoogle).toHaveBeenCalled();
    });
  });

  it('calls loginWithLinkedIn on LinkedIn button click', async () => {
    renderWithRouter(<SignIn />);
    
    await act(async () => {
      fireEvent.click(screen.getByTitle('Sign in with LinkedIn'));
    });

    await waitFor(() => {
      expect(supabaseService.loginWithLinkedIn).toHaveBeenCalled();
    });
  });
});
