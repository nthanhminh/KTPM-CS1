import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ZookeeperService } from '../zookeeper/zookeeper.service';
import { UrlRepository } from '@repositories/url.repository';
import { CreateNewCustomizedUrl, CreateUrlDto } from './dto/createUrl.dto';
import { Url } from './entity/url.entity';
import { CacheService } from '@modules/cache/cache.service';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { BloomFilterService } from './bloom_filter.service';

@Injectable()
export class UrlService {
    private secretNumber: number;
    constructor(
        private readonly zkService: ZookeeperService,
        @Inject('UrlRepositoryInterface')
        private readonly urlRepository: UrlRepository,      
        private readonly cacheService: CacheService,
        private readonly configService: ConfigService,
        private readonly bloomService: BloomFilterService
    ) {
        const secret = this.configService.get<number>('SECRET_NUMBER')
        console.log(secret, "This is a secret number");
        this.secretNumber = secret;
    }

    createShortLink(): string {
        const id = this.zkService.getNextId();
        const encodedId = id ^ this.secretNumber;
        const shortCode = this.encodeBase62(encodedId);
        console.log("shortCode", shortCode, "EncodedId", encodedId)
        return shortCode;
    }
    
    async createNewShortenUrl(shortenUrl: string, originUrl: string) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await this.cacheService.set<string>(shortenUrl, originUrl);
        try {
            return await this.createUrl(shortenUrl, originUrl, expiresAt);
        } catch (error) {
            throw new UnprocessableEntityException("Error happens when creating new URL");
        }
    }

    async insert(dto: CreateUrlDto) : Promise<Url> {
        const {url} = dto;
        const shortenUrl = this.createShortLink();
        try {
            return await this.createNewShortenUrl(shortenUrl, url);
        } catch (error) {
            throw new UnprocessableEntityException("Error happens when creating new URL");
        }
    }

    async createCustomizeLink(dto: CreateNewCustomizedUrl) {
        const { url, customizedEnpoint } = dto;
    
        if (this.bloomService.mightContain(customizedEnpoint)) {
          throw new UnprocessableEntityException('Url is used');
        }
    
        const checkFromRedis = await this.cacheService.get<string>(customizedEnpoint);
        if (checkFromRedis) {
          throw new UnprocessableEntityException('Url is used');
        }
    
        const urlObject = await this.findOneByShortLink(customizedEnpoint);
        if (urlObject) {
          throw new UnprocessableEntityException('Url is used');
        }
    
        try {
          return await this.createNewShortenUrl(customizedEnpoint, url);
        } catch (error) {
          throw new UnprocessableEntityException('Error happened when creating new URL');
        }
    }

    async get(longUrl: string) : Promise<Url> {
        return await this.urlRepository.findOneByCondition({longUrl: longUrl});
    }

    async getLongUrlFromShortenUrl(shortenUrl: string) : Promise<string> {
        const longUrl: string | null = await this.cacheService.get<string>(shortenUrl);
        if(longUrl) {
            console.log("Cache hit")
            console.log(`longUrl ${longUrl}`);
            return longUrl;
        }
        console.log("Cache miss");
        try {
            const urlObject = await this.findOneByShortLink(shortenUrl);
            return urlObject.longUrl;
        } catch (error) {
            throw new NotFoundException("Url not found");
        }
    }
    private encodeBase62(num: number): string {
        const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        do {
            result = charset[num % 62] + result;
            num = Math.floor(num / 62);
        } while (num > 0);
        return result;
    }

    private async findOneByShortLink(shortUrl: string) {
        const session = await this.urlRepository.startTransaction();

        try {
            const urlObject = await this.urlRepository.findOneByCondition({shortUrl: shortUrl});
            await session.commitTransaction();
            return urlObject;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    private async createUrl(shortenUrl: string, url: string, expiresAt: Date) {
        const session = await this.urlRepository.startTransaction();

        try {
            const newUrl = await this.urlRepository.create(
                [{
                    longUrl: url,
                    shortUrl: shortenUrl,
                    expiresAt: expiresAt.toISOString(),
                }],
                { session }
            );

            await session.commitTransaction();

            return newUrl;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
