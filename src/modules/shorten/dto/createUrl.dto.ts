import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateUrlDto {
    @ApiProperty(
        {
            description: "The url which you want to create shorten link from this."
        }
    )
    @IsString()
    @IsNotEmpty()
    url: string
}