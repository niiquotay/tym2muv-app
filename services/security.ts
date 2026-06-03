/**
 * Security Service
 * Provides utilities for input sanitization, secure data handling, and validation.
 */

// Simple namespace for local storage
const STORAGE_KEY_PREFIX = 't2m_';

/**
 * Basic sanitization for user-provided strings to prevent XSS.
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * App Storage Wrapper
 * Provides a consistent interface for storing non-sensitive app settings.
 */
export const appStorage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, value);
    } catch (e) {
      console.error('Error saving to appStorage:', e);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    } catch (e) {
      console.error('Error reading from appStorage:', e);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
    } catch (e) {
      console.error('Error removing from appStorage:', e);
    }
  },
  
  clear: () => {
    try {
      // Only clear our app's keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Error clearing appStorage:', e);
    }
  }
};

/**
 * Input Validation Utilities
 */
export const validate = {
  email: (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  },
  
  password: (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true };
  },

  phone: (phone: string): boolean => {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone);
  }
};

export function validateListingData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.title || data.title.trim().length < 5) errors.push('Title must be at least 5 characters.');
  if (data.price === undefined || data.price === null || isNaN(data.price) || data.price <= 0) errors.push('Price must be a positive number.');
  if (!data.location || data.location.trim().length < 3) errors.push('Location is required.');
  if (!data.categoryId) errors.push('Category is required.');
  if (!data.images || data.images.length === 0) errors.push('At least one image is required.');
  return { valid: errors.length === 0, errors };
}
const rateLimits = new Map<string, number[]>();

/**
 * CLIENT-SIDE rate limit — for UX only, NOT a security control.
 * Real rate limiting must be enforced at the Supabase/Edge Function level.
 */
export function checkRateLimit(action: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(action) || [];
  
  // Remove expired timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (validTimestamps.length >= limit) {
    return false;
  }
  
  validTimestamps.push(now);
  rateLimits.set(action, validTimestamps);
  return true;
}
