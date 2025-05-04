import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisBloomProvider = {
  provide: 'REDIS_BLOOM_CLIENT',
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get<string>('REDIS_BLOOM_HOST', 'localhost');  
    const redisPort = configService.get<number>('REDIS_BLOOM_PORT', 6380);  

    return new Redis({
      host: redisHost,
      port: redisPort,
    });
  },
  inject: [ConfigService],  
};
