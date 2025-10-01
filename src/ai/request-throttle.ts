// A minimal in-memory throttle/queue with jittered exponential backoff for transient errors (e.g., 429).
// Ensures Gemini requests are spaced out and retried politely.

type AsyncTask<T> = () => Promise<T>;

class RequestThrottle {
  private queue: Array<() => void> = [];
  private isRunning = false;
  private lastRunAt = 0;

  // Adjust to your quota. 1.5s between calls ≈ 40 RPM; increase if still hitting 429.
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;

  constructor(options?: { minIntervalMs?: number; maxRetries?: number; baseDelayMs?: number }) {
    this.minIntervalMs = options?.minIntervalMs ?? 1500;
    this.maxRetries = options?.maxRetries ?? 4;
    this.baseDelayMs = options?.baseDelayMs ?? 750;
  }

  async run<T>(task: AsyncTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrapped = async () => {
        try {
          // Enforce spacing between calls
          const now = Date.now();
          const sinceLast = now - this.lastRunAt;
          const wait = Math.max(0, this.minIntervalMs - sinceLast);
          if (wait > 0) await new Promise(r => setTimeout(r, wait));

          this.lastRunAt = Date.now();
          const result = await this.executeWithRetries(task);
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.isRunning = false;
          this.dequeue();
        }
      };

      this.queue.push(wrapped);
      this.dequeue();
    });
  }

  private dequeue() {
    if (this.isRunning) return;
    const next = this.queue.shift();
    if (!next) return;
    this.isRunning = true;
    void next();
  }

  private async executeWithRetries<T>(task: AsyncTask<T>): Promise<T> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await task();
      } catch (error: unknown) {
        attempt += 1;
        const isRateLimit = this.isRateLimitError(error);
        const isRetryable = isRateLimit || this.isRetryableNetworkError(error);
        if (!isRetryable || attempt > this.maxRetries) {
          throw error;
        }
        const backoff = this.jitter(this.baseDelayMs * Math.pow(2, attempt - 1));
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }

  private isRateLimitError(error: unknown): boolean {
    const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
    return message.includes('429') || message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota');
  }

  private isRetryableNetworkError(error: unknown): boolean {
    const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
    return /(fetch failed|etimedout|econnreset|network|timeout)/i.test(message);
  }

  private jitter(ms: number): number {
    const jitter = Math.floor(Math.random() * (ms * 0.2));
    return ms + jitter;
  }
}

// Export a singleton to share the queue across all flows
export const aiRequestThrottle = new RequestThrottle({ minIntervalMs: 1500, maxRetries: 5, baseDelayMs: 800 });

export async function runThrottled<T>(task: AsyncTask<T>): Promise<T> {
  return aiRequestThrottle.run(task);
}


