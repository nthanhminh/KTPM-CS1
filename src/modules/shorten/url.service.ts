import { Inject, Injectable } from '@nestjs/common';
import { ZookeeperService } from '../zookeeper/zookeeper.service';
import { UrlRepository } from '@repositories/url.repository';
import { CreateUrlDto } from './dto/createUrl.dto';
import { Url } from './entity/url.entity';

@Injectable()
export class UrlService {
    constructor(
        private readonly zkService: ZookeeperService,
        @Inject('UrlRepositoryInterface')
        private readonly urlRepository: UrlRepository,
    ) {}

    createShortLink(): string {
        const id = this.zkService.getNextId();
        const shortCode = this.encodeBase62(id);
        return shortCode;
    }

    async insert(dto: CreateUrlDto) : Promise<Url> {
        const {url} = dto;
        const shortenUrl = this.createShortLink();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return await this.urlRepository.create({
            longUrl: url,
            shortUrl: shortenUrl,
            expiresAt: expiresAt.toISOString(),
        });
    }

    async get(longUrl: string) : Promise<Url> {
        return await this.urlRepository.findOneByCondition({longUrl: longUrl});
    }

    async getLongUrlFromShortenUrl(shortenUrl: string) : Promise<string> {
        const urlObject = await this.urlRepository.findOneByCondition({shortUrl: shortenUrl});
        return urlObject.longUrl;
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
}
