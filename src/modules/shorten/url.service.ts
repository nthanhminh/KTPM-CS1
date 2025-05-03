import { ForbiddenException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ZookeeperService } from '../zookeeper/zookeeper.service';
import { UrlRepository } from '@repositories/url.repository';
import { CreateNewCustomizedUrl, CreateUrlDto } from './dto/createUrl.dto';
import { Url } from './entity/url.entity';
import { CacheService } from '@modules/cache/cache.service';
import { ConfigService } from '@nestjs/config';
import { User } from '@modules/users/entity/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { getSkipLimit } from 'src/helper/pagination.helper';
import { RedisBloomService } from '@modules/redis_bloom/redis_bloom.service';

@Injectable()
export class UrlService {
    private secretNumber: number;
    constructor(
        private readonly zkService: ZookeeperService,
        @Inject('UrlRepositoryInterface')
        private readonly urlRepository: UrlRepository,      
        private readonly cacheService: CacheService,
        private readonly configService: ConfigService,
        private readonly redisBloomService: RedisBloomService
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
    
    async createNewShortenUrl(shortenUrl: string, originUrl: string, userId: string) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await this.cacheService.set<string>(shortenUrl, originUrl);
        try {
            return await this.createUrl(shortenUrl, originUrl, expiresAt, userId);
        } catch (error) {
            console.log(error)
            throw new UnprocessableEntityException("Error happens when creating new URL");
        }
    }

    async insert(dto: CreateUrlDto, user: User) : Promise<Url> {
        const {url} = dto;
        const shortenUrl = this.createShortLink();
        try {
            return await this.createNewShortenUrl(shortenUrl, url, user._id.toString());
        } catch (error) {
            throw new UnprocessableEntityException("Error happens when creating new URL");
        }
    }

    async createCustomizeLink(dto: CreateNewCustomizedUrl, user: User) : Promise<Url> {
        const { url, customizedEnpoint } = dto;

        const checkFromBloom = await this.redisBloomService.exists('urlAlias', customizedEnpoint);

        if(!checkFromBloom) {
            try {
                const newUrl = await this.createNewShortenUrl(customizedEnpoint, url, user._id.toString());
                this.redisBloomService.add('urlAlias', customizedEnpoint);
                return newUrl;
            } catch (error) {
                throw new UnprocessableEntityException('Error happened when creating new URL');
            }
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
            const newUrl = await this.createNewShortenUrl(customizedEnpoint, url, user._id.toString());
            this.redisBloomService.add('urlAlias', customizedEnpoint);
            return newUrl;
        } catch (error) {
            throw new UnprocessableEntityException('Error happened when creating new URL');
        }
    }

    async get(longUrl: string) : Promise<Url> {
        return await this.urlRepository.findOneByCondition({longUrl: longUrl});
    }

    async deleteUrl(id: string, user: User) : Promise<boolean> {
        const url = await this.urlRepository.findOneById(id);
        if(url.userId.toString() != user._id.toString()) {
            throw new ForbiddenException("You don't have permission to delete this item");
        }
        return await this.urlRepository.softDelete(id);
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

    private async createUrl(shortenUrl: string, url: string, expiresAt: Date, userId: string) {
        const session = await this.urlRepository.startTransaction();

        try {
            const newUrl = await this.urlRepository.create(
                [{
                    longUrl: url,
                    shortUrl: shortenUrl,
                    expiresAt: expiresAt.toISOString(),
                    userId: userId
                }],
                { session }
            );

            await session.commitTransaction();

            return newUrl;
        } catch (error) {
            await session.abortTransaction();
            console.log(error)
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getUrlHistory(dto: PaginationDto, user: User) : Promise<{
        urls: Url[],
        totalPages: number
    }> {
        const { page, pageSize } = dto;
        const { $limit, $skip } = getSkipLimit({ page, pageSize });
    
        const result = await this.urlRepository.findByAggregate([
            {
                $match: {
                    userId: user._id.toString(),
                },
            },
            {
                $facet: {
                    totalCount: [
                        {
                            $count: 'total',
                        },
                    ],
                    urls: [
                        {
                            $sort: { createdAt: -1 },
                        },
                        {
                            $skip,
                        },
                        {
                            $limit,
                        },
                    ],
                },
            },
        ]);

        const totalCount = result[0]?.totalCount[0]?.total || 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        return { 
            urls: result[0]?.urls || [], 
            totalPages 
        };
    }
}
