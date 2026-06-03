import { logger } from './logger';

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Don't retry on 429 Too Many Requests or 4XX client errors (other than some transient ones)
    if (error?.status === 429 || (error?.status >= 400 && error?.status < 500 && error?.status !== 429)) {
       throw error;
    }
    if (retries === 0) throw error;
    logger.warn(`Operation failed, retrying in ${delay}ms... (${retries} retries left)`, { error });
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(operation, retries - 1, delay * 2);
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 5000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const start = performance.now();
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    const duration = performance.now() - start;
    
    // Log slow queries directly, RUM tracks timing implicitly but this helps backend debugging
    if (duration > 1000) {
       logger.warn(`Slow query detected to ${url}`, { durationMs: duration, url, status: response.status });
    }
    
    if (response.status === 429) {
      const error: any = new Error('Too Many Requests');
      error.status = 429;
      throw error;
    }
    
    if (!response.ok) {
        const error: any = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
    }
    
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error(`Request to ${url} timed out after ${timeoutMs}ms`);
      const timeoutError: any = new Error('Request timed out');
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

export async function apiFetch(url: string, options: FetchOptions = {}, retries = 3): Promise<any> {
    return withRetry(async () => {
        const response = await fetchWithTimeout(url, options);
        return response.json();
    }, retries);
}

export async function apiUpload(url: string, formData: FormData, options: FetchOptions = {}, retries = 3): Promise<any> {
    return withRetry(async () => {
        // Defaults to 10s timeout for uploads
        const uploadOptions: FetchOptions = {
            method: 'POST',
            body: formData,
            timeoutMs: 10000, 
            ...options
        };
        const response = await fetchWithTimeout(url, uploadOptions);
        return response.json();
    }, retries);
}
