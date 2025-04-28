import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

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

export class CreateNewCustomizedUrl {
    @ApiProperty(
        {
            description: "The url which you want to create shorten link from this."
        }
    )
    @IsString()
    @IsNotEmpty()
    url: string

    @ApiProperty(
        {
            description: "The url which you want to create shorten link from this."
        }
    )
    @IsString()
    @IsNotEmpty()
    @Length(3, 16)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Customized Endpoint can only contain a-z, A-Z, 0-9, and underscores (_)',
    })
    customizedEnpoint: string
}