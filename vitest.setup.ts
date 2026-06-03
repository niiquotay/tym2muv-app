import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock browser globals if needed
if (typeof window !== 'undefined') {
  // Make window.fetch writable and configurable to avoid TypeError: Cannot set property fetch of #<Window> which has only a getter
  if (window.fetch) {
    try {
      let currentFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        get() {
          return currentFetch;
        },
        set(val) {
          currentFetch = val;
        },
        configurable: true,
        enumerable: true
      });
    } catch (e) {
      console.warn("Failed to redefine window.fetch as writable:", e);
    }
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver
  });
}

// Mock Supabase client for tests
import { mockSupabase } from './__tests__/mocks/supabase';

vi.mock('./supabaseClient', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: true
}));
