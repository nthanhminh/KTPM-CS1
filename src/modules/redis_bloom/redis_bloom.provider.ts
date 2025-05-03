import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisBloomProvider = {
  provide: 'REDIS_BLOOM_CLIENT',
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get<string>('REDIS_BLOOM_HOST', 'localhost');  // Lấy giá trị REDIS_HOST từ .env
    const redisPort = configService.get<number>('REDIS_BLOOM_PORT', 6380);  // Lấy giá trị REDIS_PORT từ .env, mặc định là 6380

    console.log('REDIS_BLOOM_HOST', redisHost);
    console.log('REDIS_BLOOM_PORT', redisPort);

    return new Redis({
      host: redisHost,
      port: redisPort,
    });
  },
  inject: [ConfigService],  
};
