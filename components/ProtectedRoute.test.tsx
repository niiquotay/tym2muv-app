import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';
import { vi, describe, it, expect } from 'vitest';

const renderWithAuth = (ui: React.ReactElement, authValue: any) => {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/signin" element={<div>Sign In Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('renders loading state when user is loading', () => {
    const { container } = renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { isAuthenticated: false, loading: true }
    );
    // The loader is an animate-spin div
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to sign in when unauthenticated', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { isAuthenticated: false, loading: false }
    );
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { isAuthenticated: true, loading: false }
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
