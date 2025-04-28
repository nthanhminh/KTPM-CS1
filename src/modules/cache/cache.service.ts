import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlMiliSeconds?: number): Promise<void> {
    if (typeof ttlMiliSeconds === 'number' && ttlMiliSeconds > 0) {
      await this.cacheManager.set(key, value, ttlMiliSeconds);
    } else {
      await this.cacheManager.set(key, value, 0);
    }
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  
}
