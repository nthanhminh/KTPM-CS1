import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateNewUserDto } from "./createNewUser.dto";
import { EStatusUser } from "../enums/index.enum";
import { IsEnum } from "class-validator";

export class UpdateUserDto extends PartialType(CreateNewUserDto) {
    @ApiProperty({
        required: false
    })
    @IsEnum(EStatusUser)
    status?: EStatusUser
}