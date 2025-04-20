import { Body, Controller, Get, NotFoundException, Param, Post, Redirect, Res, UseInterceptors } from "@nestjs/common";
import { UrlService } from "./url.service";
import { CreateUrlDto } from "./dto/createUrl.dto";
import { AppResponse } from "src/types/common.type";
import { Url } from "./entity/url.entity";
import { Response } from "express";
import { ApiTags } from "@nestjs/swagger";
import { NoGlobalInterceptor } from "src/decorators/skip.decorator";

@Controller('url')
@ApiTags('url')
export class UrlController {
    constructor(
        private readonly urlService: UrlService
    ) {}

    @Post('create')
    async createNewShortUrl(@Body() dto: CreateUrlDto) : Promise<AppResponse<Url>> {
        return {
            data: await this.urlService.insert(dto)
        }
    }

    @NoGlobalInterceptor()
    @Get(':name')
    async redirectToLongUrl(@Param('name') name: string, @Res() res: Response) : Promise<any> {
        const longUrl = await this.urlService.getLongUrlFromShortenUrl(name);
        if (!longUrl) {
            throw new NotFoundException('Short URL not found');
        }
        
        return res.redirect(longUrl);
    
    }
}