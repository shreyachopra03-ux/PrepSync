const DEFAULT_MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 500;

export interface BackoffOptions {
  maxAttempts?: number;
  getRetryAfterMs?: (error: unknown) => number | null;
  shouldRetry?: (error: unknown) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function exponentialDelay(attempt: number): number {
  const exp = BASE_DELAY_MS * 2 ** (attempt - 1);
  const jitter = Math.random() * exp * 0.5;
  return exp + jitter;
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || options.shouldRetry?.(error) === false) {
        break;
      }

      const retryAfterMs = options.getRetryAfterMs?.(error) ?? null;
      const delay = retryAfterMs ?? exponentialDelay(attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}
