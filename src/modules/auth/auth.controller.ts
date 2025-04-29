import {
	Body,
	Controller,
	Get,
	Post,
	Query,
	Req,
	UseGuards,
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { AuthDto, AuthResponseDto,} from './dto/auth.dto';
  import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
  } from '@nestjs/swagger';
import { CurrentUserDecorator } from 'src/decorators/current-user.decorator';
import { User } from '@modules/users/entity/user.entity';
import { CreateNewUserDto } from '@modules/users/dto/createNewUser.dto';
import { JwtRefreshTokenGuard } from './guards/jwt-refresh-token.guard';
import { VerifyService } from '@modules/queue/verify.service';
import { SendCodeDto, VerifyCodeDto } from './dto/senCode.dto';
import { AppResponse } from 'src/types/common.type';
import { EmailDto } from 'src/common/dto/email.dto';
  
  @ApiTags('auth')
  @Controller('auth')
  export class AuthController {
	constructor(
		private authService: AuthService,
		private readonly verifyService: VerifyService,
	) {}
  
	@Post('signup')
	@ApiOperation({ summary: 'Sign up a new user' })
	@ApiResponse({
	  status: 200,
	  description: 'User successfully signed in.',
	  type: AuthResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request.' })
	signup(@Body() createUserDto: CreateNewUserDto) {
	  try {
		return this.authService.signUp(createUserDto);
	  } catch (error) {
		console.log(error);
	  }
	}
  
	@Post('signin')
	@ApiOperation({ summary: 'Sign in an existing user' })
	@ApiResponse({
	  status: 200,
	  description: 'User successfully signed in.',
	  type: AuthResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request.' })
	signin(@Body() data: AuthDto) {
	  return this.authService.signIn(data);
	}
  
	@UseGuards(JwtRefreshTokenGuard)
	@Get('refresh')
	@ApiOperation({ summary: 'Refresh tokens using the refresh token' })
	@ApiBearerAuth()
	@ApiResponse({
	  status: 200,
	  description: 'User successfully signed in.',
	  type: AuthResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Bad request.' })
	refreshTokens(@CurrentUserDecorator() user:User) {
	  const userId = user.id;
	  const refreshToken = user.refreshToken;
	  console.log(userId, refreshToken);
	  return this.authService.refreshTokens(userId, refreshToken);
	}
  
	@Post('verify')
	async verifyCode(@Body() dto: SendCodeDto) : Promise<AppResponse<any>> {
		return {
			data: await this.authService.getCode(dto)
		}
	}

	@Post('verifyCode')
	async confirmVerifyCode(@Body() dto: VerifyCodeDto) : Promise<AppResponse<User>> {
		console.log(dto.code)
		return {
			data: await this.authService.verifyCode(dto)
		}
	}
  }
  