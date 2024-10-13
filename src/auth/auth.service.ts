import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from '../domain/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from './dto/login-user.dto';
import { BcryptHelper } from '../common/helpers/bcrypt.helper';
import { RefreshTokenService } from '../domain/refresh-token/refresh-token.service';
import { LoginAttemptService } from '../domain/login-attempt/login-attempt.service';
import * as crypto from 'node:crypto';
import { MailService } from '../common/services/mail.service';
import { UserMapper } from '../common/mappers/user.mapper';
import dayjs from '../common/helpers/dayjs';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly mailService: MailService,
    private readonly userMapper: UserMapper,
    private bcryptHelper: BcryptHelper,
  ) {}

  async registerUser(payload: Omit<RegisterUserDto, 'type'>) {
    const existingUser = await this.usersService.findByEmail(payload.email);
    if (existingUser) {
      throw new UnprocessableEntityException('email address is already in use');
    }

    const hashedPassword = await this.bcryptHelper.hashPassword(
      payload.password,
    );

    const token = crypto.randomBytes(128).toString('hex');

    const user = await this.usersService.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    });

    const { success } = await this.mailService.sendVerificationMail(
      user.email,
      user.first_name,
      token,
    );

    if (!success) {
      this.logger.error({
        message: `error sending email verification mail: ${user.email}`,
      });
    }

    await this.usersService.updateOne(
      { id: user.id },
      {
        verifcation_token: token,
        verification_token_expires_at: dayjs(new Date())
          .add(20, 'minutes')
          .toDate(),
      },
    );

    return this.userMapper.toPublicData(user);
  }

  async loginUser(
    payload: LoginUserDto,
    ip_address: string,
    user_agent: string,
  ) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new BadRequestException('user account not registered');
    }

    if (!user.verified) {
      const token = await crypto.randomBytes(128).toString('hex');

      await this.mailService.sendVerificationMail(
        user.email,
        user.first_name,
        token,
      );

      await this.usersService.updateOne(
        { id: user.id },
        {
          verifcation_token: token,
          verification_token_expires_at: new Date(Date.now() + 20 * 60 * 1000),
        },
      );

      throw new UnprocessableEntityException('user account not verified');
    }

    const isMatch = await this.bcryptHelper.comparePassword(
      payload.password,
      user.password,
    );

    if (!isMatch) {
      await this.loginAttemptService.createLoginAttempt({
        userId: user.id,
        ip_address,
        user_agent,
        success: false,
      });
      throw new BadRequestException('invalid credentials');
    }

    const tokens = await this.generateTokens({
      email: user.email,
      userId: user.id,
    });

    await this.loginAttemptService.createLoginAttempt({
      userId: user.id,
      ip_address,
      user_agent,
      success: true,
    });

    return { user: this.userMapper.toPublicData(user), tokens };
  }

  async resendVerificationMail(token: string) {
    const user = await this.usersService.findOne({ verifcation_token: token });
    if (!user) {
      throw new UnprocessableEntityException('invalid verification token');
    }

    const newToken = await crypto.randomBytes(128).toString('hex');

    const { success } = await this.mailService.sendVerificationMail(
      user.email,
      user.first_name,
      token,
    );

    if (!success) {
      this.logger.error({
        message: `error sending email verification mail: ${user.email}`,
      });
    }

    await this.usersService.updateOne(
      { id: user.id },
      {
        verifcation_token: newToken,
        verification_token_expires_at: dayjs(new Date())
          .add(20, 'minutes')
          .toDate(),
      },
    );

    return { success };
  }

  private generateAccessToken(payload: { email: string; userId: string }) {
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(paylaod: { email: string; userId: string }) {}

  async generateTokens(payload: { email: string; userId: string }) {
    const accessToken = this.generateAccessToken(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: '30d',
    });

    await this.refreshTokenService.storeRefreshToken(
      payload.userId,
      refreshToken,
    );

    return { accessToken, refreshToken };
  }

  async verifyUserAccount(token: string) {
    const user = await this.usersService.findOne({ verifcation_token: token });
    if (!user) {
      throw new UnprocessableEntityException('invalid verification token');
    }

    const now = new Date();

    if (dayjs(user.verification_token_expires_at).isBefore(now)) {
      throw new UnprocessableEntityException('verification token has expired');
    }

    await this.usersService.updateOne({ id: user.id }, { verified: true });

    return this.userMapper.toPublicData(user);
  }

  async refreshToken(token: string) {
    const refreshToken = await this.refreshTokenService.findByToken(token);

    if (!refreshToken) {
      throw new BadRequestException('invalid refresh token');
    }

    if (dayjs(new Date()).isAfter(refreshToken.expires_at)) {
      throw new UnauthorizedException('refresh token has expired');
    }
  }

  validateRefreshToken(refreshToken: string) {
    return this.jwtService.verify(refreshToken, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      ignoreExpiration: true,
    });
  }
}
