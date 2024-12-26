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
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiHeader,
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
import { SuccessResponse } from '../common/responses/success.response';
import { ApiError } from '../common/errors/api.error';
import { RefreshTokenService } from '../domain/refresh-token/refresh-token.service';
import { TokenPayload } from './auth.interface';
import { EmailDto } from './dto/email.dto';
import { ResetPasswordDto } from './dto/reset--password.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly refreshTokenService: RefreshTokenService,
  ) { }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user account' })
  @ApiUnprocessableEntityResponse({
    type: DefaultException,
    description: 'Invalid credentials',
  })
  @ApiCreatedResponse({ description: 'User account created successfully' })
  async register(@Body() body: RegisterUserDto): Promise<SuccessResponse> {
    try {
      const existingUser = await this.usersService.findByEmail(body.email);
      if (existingUser) {
        throw new UnprocessableEntityException(
          'Unable to create account. Please try signing up with a different email address or sign in if you already have an account.',
        );
      }
      const user = await this.authService.registerUser(body);

      return new SuccessResponse(
        'New user account registered successfully',
        user,
      );
    } catch (error) {
      this.logger.error('Failed to register user', {
        email: body.email,
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError(
        'An error occured during registration. Please try again later.',
      );
    }
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login' })
  @ApiBadRequestResponse({
    type: DefaultException,
    description: 'Invalid credentials',
  })
  @ApiOkResponse({
    description: 'Login successful',
  })
  @ApiHeader({
    name: 'user-agent',
    required: true,
    description: 'User agent information',
  })
  async login(
    @Body() body: LoginUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<SuccessResponse> {
    this.logger.debug('Login attempt', { email: body.email, ip });

    try {
      const data = await this.authService.loginUser(body, ip, userAgent);
      this.logger.debug('User logged in successfully', {
        userId: data.user.id,
      });

      return new SuccessResponse('User logged in successfully', data);
    } catch (error) {
      this.logger.error('Login failed', {
        email: body.email,
        ip,
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError(
        'An error occured during login. Please try again later',
      );
    }
  }

  @Post('/verify-user/:token')
  @HttpCode(HttpStatus.OK)
  async verifyUser(@Param('token') token: string): Promise<SuccessResponse> {
    try {
      await this.authService.verifyUserAccount(token);
      return new SuccessResponse('User account verified successfully');
    } catch (error) {
      this.logger.error('Error occured during user login', {
        token,
        error,
      });
      throw new ApiError(
        'An error occured while verifying user account. Please try again later',
      );
    }
  }

  @Post('/resend-verify-token/:token')
  @HttpCode(HttpStatus.OK)
  async resendEmailVerification(@Param('token') token: string): Promise<SuccessResponse>  {
    try {
      await this.authService.resendVerificationMail(token);

      return new SuccessResponse('Email verification mail sent successfully');
    } catch (error) {
      this.logger.error(
        'Error occured during email verification resend process',
        {
          error,
        },
      );
      throw new ApiError(
        'An error occured while resending email verification mail. Please try again',
        error,
      );
    }
  }

  @Post('/refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBadRequestResponse({
    type: DefaultException,
    description: 'Invalid or expired refresh token',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
  })
  async refreshToken(@Body() body: RefreshTokenDto) {
    try {
      const refreshToken = await this.refreshTokenService.findByToken(
        body.token,
      );
      if (!refreshToken) {
        throw new BadRequestException('Invalid refresh token');
      }

      const payload = this.authService.validateRefreshToken(body.token);
      const { email, exp } = payload as TokenPayload;

      if (Date.now() >= exp * 1000) {
        await this.refreshTokenService.deleteToken(body.token);
        throw new BadRequestException('Refresh token expired');
      }

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const tokens = await this.authService.generateTokens({
        email: user.email,
        userId: user.id,
      });

      await this.refreshTokenService.deleteToken(refreshToken.id);
      await this.refreshTokenService.saveToken(tokens.refreshToken, user.id);

      return new SuccessResponse('Tokens refreshed successfully', tokens);
    } catch (error) {
      this.logger.error('Token refresh failed', {
        error,
        ...body,
      });
      throw new ApiError('Failed to refresh token', error);
    }
  }

  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiOkResponse({
    description: 'Password reset email sent successfully',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    type: DefaultException,
    description: 'Invalid email or user not found',
  })
  async forgotPassword(@Body() body: EmailDto): Promise<SuccessResponse> {
    try {
      const user = await this.usersService.findByEmail(body.email);
      if (!user) {
        throw new UnprocessableEntityException('User not found');
      }

      await this.authService.sendPasswordResetMail(body.email);
      return new SuccessResponse('Password reset email sent successfull');
    } catch (error) {
      this.logger.error('Failed to process password reset request', {
        email: body.email,
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError('Failed to send password reset mail', error);
    }
  }

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiOkResponse({
    description: 'Password reset successful',
    type: SuccessResponse,
  })
  @ApiBadRequestResponse({
    type: DefaultException,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(
    @Body() body: ResetPasswordDto,
  ): Promise<SuccessResponse> {
    try {
      await this.authService.resetPassword(body.token, body.newPassword);

      return new SuccessResponse('Password reset successful');
    } catch (error) {
      this.logger.error('Password reset failed', {
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError(
        'An error occurred while resetting your password. Please try again',
        error,
      );
    }
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiOkResponse({
    description: 'Logout successful',
    type: SuccessResponse,
  })
  async logout(@Body() body: RefreshTokenDto): Promise<SuccessResponse> {
    try {
      await this.refreshTokenService.deleteToken(body.token);

      return new SuccessResponse('Logged out successfully');
    } catch (error) {
      this.logger.error('Logout failed', {
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError(
        'An error occurred during logout. Please try again',
        error,
      );
    }
  }
}
