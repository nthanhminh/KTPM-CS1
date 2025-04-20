import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Url, UrlSchemaFactory } from "./entity/url.entity";
import { SharedModule } from "@modules/shared/shared.module";
import { ZookeeperModule } from "@modules/zookeeper/zookeeper.module";
import { UrlService } from "./url.service";
import { UrlController } from "./url.controller";
import { UrlRepository } from "@repositories/url.repository";
import { RedisCacheModule } from "@modules/cache/cache.module";

@Module({
    imports:[
        MongooseModule.forFeatureAsync([
            {
                name: Url.name,
                useFactory: UrlSchemaFactory,
            },
        ]),
        SharedModule,
        RedisCacheModule,
        ZookeeperModule
    ],
    providers: [
        UrlService,
        { provide: 'UrlRepositoryInterface', useClass: UrlRepository },
    ],
    controllers: [UrlController]
})
export class UrlModule {}