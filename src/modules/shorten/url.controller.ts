import { Body, Controller, Get, NotFoundException, Param, Post, Query, Redirect, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { UrlService } from "./url.service";
import { CreateNewCustomizedUrl, CreateUrlDto } from "./dto/createUrl.dto";
import { AppResponse } from "src/types/common.type";
import { Url } from "./entity/url.entity";
import { Response } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NoGlobalInterceptor } from "src/decorators/skip.decorator";
import { JwtAccessTokenGuard } from "@modules/auth/guards/jwt-access-token.guard";
import { CurrentUserDecorator } from "src/decorators/current-user.decorator";
import { User } from "@modules/users/entity/user.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Controller('url')
@ApiTags('url')
export class UrlController {
    constructor(
        private readonly urlService: UrlService
    ) {}

    @ApiBearerAuth('token')
    @UseGuards(JwtAccessTokenGuard)
    @Post('create')
    async createNewShortUrl(@Body() dto: CreateUrlDto, @CurrentUserDecorator() user: User) : Promise<AppResponse<Url>> {
        console.log("user1", user)
        return {
            data: await this.urlService.insert(dto, user)
        }
    }

    @ApiBearerAuth('token')
    @UseGuards(JwtAccessTokenGuard)
    @Post('alias')
    async createNewAliasUrl(
        @Body() dto: CreateNewCustomizedUrl,
        @CurrentUserDecorator() user: User
    ) : Promise<AppResponse<Url>> {
        return {
            data: await this.urlService.createCustomizeLink(dto, user)
        }
    }

    @ApiBearerAuth('token')
    @UseGuards(JwtAccessTokenGuard)
    @Get('history')
    async getUrlHistory(
        @Query() dto: PaginationDto,
        @CurrentUserDecorator() user: User
    ) : Promise<AppResponse<Url[]>> {
        return {
            data: await this.urlService.getUrlHistory(dto, user)
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