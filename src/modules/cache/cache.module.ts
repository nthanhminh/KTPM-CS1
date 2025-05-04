import { Module } from '@nestjs/common';
import { createClient } from 'redis'; 
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { CacheService } from './cache.service';

@Module({
  imports: [ConfigModule], 
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL'); 
        const client = createClient({ url: redisUrl });
        client.on('connect', () => console.log('🔌 Redis is connecting...'));
        client.on('ready', () => console.log('✅ Redis connection is ready.'));
        client.on('error', (err) => console.error('❌ Redis error:', err));
        client.on('end', () => console.log('🛑 Redis connection closed.'));
        client.on('reconnecting', () => console.log('♻️ Redis reconnecting...'));
        await client.connect();
        return client;
      },
      inject: [ConfigService], 
    },
    CacheService
  ],
  controllers: [],
  exports: ['REDIS_CLIENT', CacheService],
})
export class RedisCacheModule {}