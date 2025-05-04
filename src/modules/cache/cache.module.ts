import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';
import { CacheService } from './cache.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        return {
          store: redisStore,
          socket: {
            host: redisHost,
            port: redisPort,
          },
          ttl: 0
        }
      },
      isGlobal: true,
      inject: [ConfigService]
    }),
  ],
  providers: [CacheService],
  exports: [CacheService]
})
export class RedisCacheModule {}
