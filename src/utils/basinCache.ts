import { BasinCacheKey, BasinCacheEntry } from '../types/basin';

export class BasinCache {
  private cache = new Map<string, BasinCacheEntry>();
  private maxSize: number;

  constructor(maxSize: number = 8) {
    this.maxSize = maxSize;
  }

  private keyToString(key: BasinCacheKey): string {
    return JSON.stringify(key);
  }

  get(key: BasinCacheKey): BasinCacheEntry | undefined {
    const keyStr = this.keyToString(key);
    const entry = this.cache.get(keyStr);

    if (entry) {
      // Update timestamp for LRU
      entry.timestamp = Date.now();
    }

    return entry;
  }

  set(key: BasinCacheKey, entry: BasinCacheEntry): void {
    const keyStr = this.keyToString(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(keyStr)) {
      let oldestKey = '';
      let oldestTime = Infinity;

      for (const [k, v] of this.cache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(keyStr, entry);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
