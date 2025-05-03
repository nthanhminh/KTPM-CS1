import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as zookeeper from 'node-zookeeper-client';

const COUNTER_PATH = '/shorten-id-counter';
const BLOCK_SIZE = 1000;

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
      console.log('🦓 Connected to ZooKeeper');
      this.initializeCounter();
    });

    this.client.connect();
  }

  private initializeCounter() {
    // Kiểm tra sự tồn tại của node
    this.client.exists(COUNTER_PATH, (err, stat) => {
      if (err) return console.error('Error checking path:', err);

      if (!stat) {
        // Nếu node không tồn tại, khởi tạo node mới
        console.log(`Node ${COUNTER_PATH} không tồn tại, sẽ tạo mới.`);
        this.client.create(COUNTER_PATH, Buffer.from('0'), (err) => {
          if (err) return console.error('Error creating counter node:', err);
          this.allocateIdBlock(); // Tạo block ID sau khi tạo node
        });
      } else {
        // Nếu node đã tồn tại, chỉ cần phân bổ block ID từ giá trị hiện tại
        console.log(`Node ${COUNTER_PATH} đã tồn tại.`);
        this.allocateIdBlock();
      }
    });
  }

  private allocateIdBlock(retryCount = 0) {
    if (retryCount > 5) {
      console.error('Max retry attempts reached for allocateIdBlock');
      return;
    }
  
    this.client.getData(COUNTER_PATH, (err, data, stat) => {
      if (err) return console.error('Error getting data:', err);
  
      const current = parseInt(data.toString());
      const next = current + BLOCK_SIZE;
  
      this.client.setData(COUNTER_PATH, Buffer.from(next.toString()), stat.version, (err) => {
        if (err) {
          console.error(`Race condition detected (retry #${retryCount + 1})`);
          setTimeout(() => this.allocateIdBlock(retryCount + 1), 100 * (retryCount + 1)); // Exponential backoff
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
    // Kiểm tra nếu counter đã hết block, ném lỗi
    if (this.localCounter > this.currentEndId) {
      throw new Error('ID block exhausted. Implement auto-reallocate if needed.');
    }
    return this.localCounter++;
  }
}
