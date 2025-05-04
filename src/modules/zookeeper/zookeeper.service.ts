import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as zookeeper from 'node-zookeeper-client';

const COUNTER_PATH = '/shorten-id-counter';
const BLOCK_SIZE = 1000000000;

@Injectable()
export class ZookeeperService implements OnModuleInit {
  private client = zookeeper.createClient(
    `${this.configService.get<string>('ZOOKEEPER_HOST')}:${this.configService.get<string>('ZOOKEEPER_PORT')}`
  );  
  private currentStartId = 0;
  private currentEndId = 0;
  private localCounter = 0;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client.once('connected', () => {
      console.log('Connected to ZooKeeper');
      this.initializeCounter();
    });

    this.client.connect();
  }

  private async initializeCounter() {
    this.client.create(COUNTER_PATH, Buffer.from('0'), async (err) => {
      if (err) {
        if (err.getCode && err.getCode() === zookeeper.Exception.NODE_EXISTS) {
          console.log(`Node ${COUNTER_PATH} đã tồn tại.`);
        } else {
          return console.error('Error creating counter node:', err);
        }
      } else {
        console.log(`Node ${COUNTER_PATH} không tồn tại, đã tạo mới.`);
      }
  
      await this.allocateIdBlock();
    });
  }

  private async allocateIdBlock(retryCount = 0): Promise<void> {
    if (retryCount > 5) {
      console.error('Max retry attempts reached for allocateIdBlock');
      throw new Error('Unable to allocate ID block');
    }
  
    return new Promise((resolve, reject) => {
      this.client.getData(COUNTER_PATH, (err, data, stat) => {
        if (err) return reject(err);
  
        const current = parseInt(data.toString());
        const next = current + BLOCK_SIZE;
  
        this.client.setData(COUNTER_PATH, Buffer.from(next.toString()), stat.version, (err) => {
          if (err) {
            console.error(`Race condition detected (retry #${retryCount + 1})`);
            setTimeout(() => {
              this.allocateIdBlock(retryCount + 1).then(resolve).catch(reject);
            }, 100 * (retryCount + 1)); 
            return;
          }
  
          this.currentStartId = current;
          this.currentEndId = next - 1;
          this.localCounter = current;
  
          console.log(`Instance ID block: ${this.currentStartId} - ${this.currentEndId}`);
          resolve();
        });
      });
    });
  }  

  async getNextId(): Promise<number> {
    if (this.localCounter > this.currentEndId) {
      console.log('ID block exhausted. Renewing...');
      await this.allocateIdBlock();
    }
    return this.localCounter++;
  }
}
