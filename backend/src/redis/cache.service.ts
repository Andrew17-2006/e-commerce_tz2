import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

const PRODUCTS_VERSION_KEY = 'products:cache-version';

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /** Current products cache "epoch" — embed in list cache keys; bump to invalidate all list variants in O(1). */
  async getProductsVersion(): Promise<number> {
    const version = await this.redis.get(PRODUCTS_VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  }

  async bumpProductsVersion(): Promise<void> {
    await this.redis.incr(PRODUCTS_VERSION_KEY);
  }
}
