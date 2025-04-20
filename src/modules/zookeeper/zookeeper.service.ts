import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as zookeeper from 'node-zookeeper-client';

const COUNTER_PATH = '/shorten-id-counter';
const BLOCK_SIZE = 1000;

@Injectable()
export class ZookeeperService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService
  ) {}
  // private client = zookeeper.createClient(`${this.configService.get<string>('ZOOKEEPER_HOST')} : ${this.configService.get<string>('ZOOKEEPER_PORT')}`);
  private client = zookeeper.createClient(
    `${this.configService.get<string>('ZOOKEEPER_HOST')}:${this.configService.get<string>('ZOOKEEPER_PORT')}`
  );  
  private currentStartId = 0;
  private currentEndId = 0;
  private localCounter = 0;

  async onModuleInit() {
    this.client.once('connected', () => {
      console.log('🦓 Connected to ZooKeeper');
      this.initializeCounter();
    });

    this.client.connect();
  }

  private initializeCounter() {
    this.client.exists(COUNTER_PATH, (err, stat) => {
      if (err) return console.error('Error checking path:', err);

      if (!stat) {
        this.client.create(COUNTER_PATH, Buffer.from('0'), (err) => {
          if (err) return console.error('Error creating counter node:', err);
          this.allocateIdBlock();
        });
      } else {
        this.allocateIdBlock();
      }
    });
  }

  private allocateIdBlock() {
    this.client.getData(COUNTER_PATH, (err, data, stat) => {
      if (err) return console.error('Error getting data:', err);

      const current = parseInt(data.toString());
      const next = current + BLOCK_SIZE;

      this.client.setData(COUNTER_PATH, Buffer.from(next.toString()), stat.version, (err) => {
        if (err) {
          console.error('Race condition when setting counter, retrying...');
          setTimeout(() => this.allocateIdBlock(), 100);
          return;
        }

        this.currentStartId = current;
        this.currentEndId = next - 1;
        this.localCounter = current;

        console.log(`✅ Instance ID block: ${this.currentStartId} - ${this.currentEndId}`);
      });
    });
  }

  public getNextId(): number {
    if (this.localCounter > this.currentEndId) {
      throw new Error('ID block exhausted. Implement auto-reallocate if needed.');
    }
    return this.localCounter++;
  }
}
