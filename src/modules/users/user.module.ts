import { Module } from "@nestjs/common";
import { UsersService } from "./user.services";
import { UsersController } from "./user.controller";
import { SharedModule } from "@modules/shared/shared.module";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchemaFactory } from "./entity/user.entity";
import { UsersRepository } from "@repositories/user.repository";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([
			{
				name: User.name,
				useFactory: UserSchemaFactory,
			},
		]),
        SharedModule
    ],
    exports: [UsersService],
    providers: [
        UsersService,
        { provide: 'UsersRepositoryInterface', useClass: UsersRepository },
    ],
    controllers: []
})
export class UserModule {}