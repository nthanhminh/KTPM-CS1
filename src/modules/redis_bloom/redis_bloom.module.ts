import { Module } from '@nestjs/common';
import { RedisBloomProvider } from './redis_bloom.provider';
import { RedisBloomService } from './redis_bloom.service';

@Module({
  providers: [RedisBloomService, RedisBloomProvider],
  exports: [RedisBloomService],
})
export class BloomModule {}
