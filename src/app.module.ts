import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '@modules/users/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bullmq';
import { HttpErrorFilter } from './interceptors/httpError.filter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '@modules/shared/shared.module';
import { ZookeeperModule } from '@modules/zookeeper/zookeeper.module';
import { UrlModule } from '@modules/shorten/url.module';
import { LoggerMiddleware } from '@modules/middleware';
import { RedirectMiddleware } from '@modules/middleware/redirect.middleware';
import * as cookieParser from 'cookie-parser';
import { RedisCacheModule } from '@modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          service: 'gmail',
          secure: false,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
          logger: true,
        },
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: 'src/i18n/',
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => {
				console.log('uri:: ', configService.get<string>('DATABASE_URI'));
				return {
					uri: configService.get<string>('DATABASE_URI'),
				};
			},
			inject: [ConfigService],
		}),
    SharedModule,
    RedisCacheModule,
    ZookeeperModule,
    UserModule,
    AuthModule,
    UrlModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppService,
		{
			provide: APP_INTERCEPTOR,
			useClass: TransformInterceptor,
		},
		{
			provide: APP_FILTER,
			useClass: HttpErrorFilter,
		},
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
      consumer
        .apply(LoggerMiddleware, cookieParser(), RedirectMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
