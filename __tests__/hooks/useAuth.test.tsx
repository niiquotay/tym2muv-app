import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { vi } from 'vitest';
import * as supabaseService from '../../services/supabaseService';

vi.mock('../../services/supabaseService', () => ({
  getUserProfile: vi.fn(),
  subscribeToAuth: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined)
}));

const TestComponent = () => {
  const { user, loading, logout } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not Logged In</div>;
  
  return (
    <div>
      <div>User: {user.name} ({user.role})</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('useAuth Hook & AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial loading state then anonymous state if no session', async () => {
    // Mock initial null session
    (supabaseService.subscribeToAuth as any).mockImplementation((cb: Function) => {
      // simulate immediate callback with no user
      cb(null);
      return () => {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // After auth state updates, should be Not Logged In
    expect(screen.getByText('Not Logged In')).toBeInTheDocument();
  });

  it('fetches profile and sets user if logged in', async () => {
    (supabaseService.subscribeToAuth as any).mockImplementation((cb: Function) => {
      cb({ id: 'test-user-id' });
      return () => {};
    });
    
    (supabaseService.getUserProfile as any).mockResolvedValue({
      id: 'test-user-id',
      name: 'Alice',
      role: 'Agent'
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Will show loading initially, then wait for getUserProfile to resolve
    await screen.findByText('User: Alice (Agent)');
  });
});
