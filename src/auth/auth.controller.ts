import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Logger,
  UseGuards,
  Ip,
  Headers,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from '../domain/users/users.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DefaultException } from '../common/dto/default.exception.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User Register' })
  @ApiUnprocessableEntityResponse({
    type: DefaultException,
    description: 'invalid credentials',
  })
  @ApiCreatedResponse({ description: 'User account created' })
  async register(@Body() body: RegisterUserDto) {
    this.logger.log(`Attempting to register user with email: ${body.email}`);
    const user = await this.authService.registerUser(body);
    this.logger.log(`user registered successfully, ${user.id}`);
    return { message: 'user account created successfully', data: user };
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login' })
  @ApiBadRequestResponse({
    type: DefaultException,
  })
  @ApiOkResponse({})
  async login(
    @Body() body: LoginUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    this.logger.log(`attempting to login user with email: ${body.email}`);
    const data = await this.authService.loginUser(body, ip, userAgent);
    this.logger.log(`user logged in successfully, ${data.user.id} `);
    return { message: 'user logged in successfully', data };
  }

  @Post('/verify-user/:token')
  @HttpCode(HttpStatus.OK)
  async verifyUser(@Param('token') token: string) {
    this.logger.log('attempting to verify user email');
    const user = await this.authService.verifyUserAccount(token);
    this.logger.log(`user account verified successfully, ${user.id}`);
    return { message: 'user account verified successfully', data: user };
  }

  @Post('/resend-verify-token/:id')
  @HttpCode(HttpStatus.OK)
  async resendEmailVerification(@Param('token') token: string) {
    this.logger.log('attempting to resend verification mail');
    const data = await this.authService.resendVerificationMail(token);
    return { message: 'verification mail sent', data };
  }

  @Post('/refresh-token')
  @ApiBadRequestResponse({ description: 'Bad-request - invalid token' })
  @ApiOkResponse({ description: 'tokens refreshed successfully' })
  async refreshToken(@Body() body: RefreshTokenDto) {
    this.logger.log('attempting to refresh user token');
    const payload = this.authService.validateRefreshToken(body.token);

    if (Date.now() >= payload.exp * 1000) {
      throw new BadRequestException('refresh token expired');
    }

    const { email } = payload;

    const user = await this.usersService.findByEmail(email);
    const tokens = this.authService.generateTokens({
      email: user.email,
      userId: user.id,
    });

    return { message: 'tokens refreshed successfully', tokens };
  }
}
