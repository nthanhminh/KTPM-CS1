import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';
import { CacheService } from './cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: redisStore,
        socket: {
          host: 'localhost',
          port: 6379,
        },
        ttl: 0
      }),
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService]
})
export class RedisCacheModule {}
