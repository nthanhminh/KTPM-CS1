import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisBloomService {
  private readonly logger = new Logger(RedisBloomService.name);

  constructor(
    @Inject('REDIS_BLOOM_CLIENT') private readonly redis: Redis,
  ) {
    this.initFilterOnce("68689", 0.015625, 11080243);
  }

  private async initFilterOnce(
    key: string,
    errorRate = 0.01,
    capacity = 10000,
  ): Promise<void> {
    const lockKey = `bloom:init-lock:${key}`;
    const lock = await this.redis.call('SET', lockKey, '1', 'NX', 'EX', 10);

    if (lock) {
      try {
        const exists = await this.redis.exists(key);
        if (exists === 0) {
          this.logger.log(`Creating bloom filter: ${key}`);
          await this.redis.call('BF.RESERVE', key, errorRate, capacity);
        } else {
          this.logger.log(`Bloom filter already exists: ${key}`);
        }
      } catch (err) {
        this.logger.error(`Failed to init bloom filter "${key}":`, err);
        throw err;
      }
    } else {
      this.logger.log(`Lock not acquired for filter init. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.initFilterOnce(key, errorRate, capacity); 
    }
  }

  async add(
    key: string,
    value: string,
  ): Promise<boolean> {
    const result = await this.redis.call('BF.ADD', key, value);
    return result === 1;
  }

  async exists(
    key: string,
    value: string,
  ): Promise<boolean> {
    const result = await this.redis.call('BF.EXISTS', key, value);
    return result === 1;
  }
}
