const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 500;

export interface BackoffOptions {
  getRetryAfterMs?: (error: unknown) => number | null;
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
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= MAX_ATTEMPTS) {
        break;
      }

      const retryAfterMs = options.getRetryAfterMs?.(error) ?? null;
      const delay = retryAfterMs ?? exponentialDelay(attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}
