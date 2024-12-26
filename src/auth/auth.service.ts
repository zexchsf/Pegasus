import {
  BadRequestException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from '../domain/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from './dto/login-user.dto';
import { BcryptHelper } from '../common/helpers/bcrypt.helper';
import { LoginAttemptService } from '../domain/login-attempt/login-attempt.service';
import * as crypto from 'node:crypto';
import { MailService } from '../common/services/mail.service';
import { UserMapper } from '../common/mappers/user.mapper';
import dayjs from '../common/helpers/dayjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACCOUNT_EVENTS } from 'src/events';
import { AccountType } from '@prisma/client';
import { AccountCreateEvent } from '../events';
import { PasswordResetTokenService } from '../domain/password-reset/password-reset-token.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly mailService: MailService,
    private readonly userMapper: UserMapper,
    private readonly eventEmitter: EventEmitter2,
    private bcryptHelper: BcryptHelper,
  ) { }

  async registerUser(payload: Omit<RegisterUserDto, 'type'>) {
    const hashedPassword = await this.bcryptHelper.hashPassword(
      payload.password,
    );
    const user = await this.usersService.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    });

    const token = crypto.randomBytes(128).toString('hex');
    const { success } = await this.mailService.sendVerificationMail(
      user.email,
      user.first_name,
      token,
    );

    if (!success) {
      this.logger.error({
        message: `Error sending email verification mail: ${user.email}`,
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

    // emit create account event to setup the user first account
    const eventPayload: AccountCreateEvent = {
      user_id: user.id,
      account_type: AccountType.Savings,
      account_name: `${user.first_name} ${user.middle_name} ${user.last_name}`,
    };
    this.eventEmitter.emit(ACCOUNT_EVENTS.ACCOUNT_CREATE, eventPayload);

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
      const token = crypto.randomBytes(128).toString('hex');

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

      throw new UnprocessableEntityException('User account not verified');
    }

    const isMatch = await this.bcryptHelper.comparePassword(
      payload.password,
      user.password,
    );

    if (!isMatch) {
      await this.loginAttemptService.createLoginAttempt({
        user_id: user.id,
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
      user_id: user.id,
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

    const newToken = crypto.randomBytes(128).toString('hex');

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

  private generateRefreshToken(payload: { email: string; userId: string }) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: '30d',
    });
  }

  async generateTokens(payload: { email: string; userId: string }) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  async verifyUserAccount(token: string) {
    const user = await this.usersService.findOne({ verifcation_token: token });
    if (!user) {
      throw new UnprocessableEntityException('Invalid verification token');
    }

    const now = new Date();

    if (dayjs(user.verification_token_expires_at).isBefore(now)) {
      throw new UnprocessableEntityException('Verification token has expired');
    }

    await this.usersService.updateOne({ id: user.id }, { verified: true });

    return this.userMapper.toPublicData(user);
  }

  async sendPasswordResetMail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = await this.passwordResetTokenService.createToken(
      user.id,
    );

    await this.mailService.sendPasswordResetEmail(user.email, resetToken.token);

    // remove expired reset tokens
    await this.passwordResetTokenService.deleteExpiredTokens();
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await this.passwordResetTokenService.findValidToken(
      token,
    );
    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await this.bcryptHelper.hashPassword(password);

    await this.usersService.updateOne(
      { id: resetToken.user_id },
      { password: hashedPassword },
    );

    await this.passwordResetTokenService.markTokenAsUsed(token);
  }

  validateRefreshToken(refreshToken: string) {
    return this.jwtService.verify(refreshToken, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      ignoreExpiration: true,
    });
  }
}
