export interface TokenBucketOptions {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export class TokenBucket {
  private requestCapacity: number;
  private tokenCapacity: number;
  private availableRequests: number;
  private availableTokens: number;
  private lastRefillAt: number;

  constructor(options: TokenBucketOptions) {
    this.requestCapacity = options.requestsPerMinute;
    this.tokenCapacity = options.tokensPerMinute;
    this.availableRequests = options.requestsPerMinute;
    this.availableTokens = options.tokensPerMinute;
    this.lastRefillAt = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefillAt;
    if (elapsedMs <= 0) return;

    const elapsedMinutes = elapsedMs / 60_000;

    this.availableRequests = Math.min(
      this.requestCapacity,
      this.availableRequests + elapsedMinutes * this.requestCapacity
    );
    this.availableTokens = Math.min(
      this.tokenCapacity,
      this.availableTokens + elapsedMinutes * this.tokenCapacity
    );
    this.lastRefillAt = now;
  }

  async acquire(estimatedTokens: number): Promise<void> {
    for (;;) {
      this.refill();

      if (this.availableRequests >= 1 && this.availableTokens >= estimatedTokens) {
        this.availableRequests -= 1;
        this.availableTokens -= estimatedTokens;
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
