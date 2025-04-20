import { Module } from '@nestjs/common';
import { ZookeeperService } from './zookeeper.service';

@Module({
  providers: [ZookeeperService],
  exports: [ZookeeperService],
})
export class ZookeeperModule {}
