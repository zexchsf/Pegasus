import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './auth-strategy/jwt.strategy';
import { UsersService } from '../domain/users/users.service';
import { BcryptHelper } from '../common/helpers/bcrypt.helper';
import { RefreshTokenService } from '../domain/refresh-token/refresh-token.service';
import { LoginAttemptService } from '../domain/login-attempt/login-attempt.service';
import { MailService } from '../common/services/mail.service';
import { UserMapper } from '../common/mappers/user.mapper';
import { PasswordResetTokenService } from '../domain/password-reset/password-reset-token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: '2h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UsersService,
    BcryptHelper,
    RefreshTokenService,
    LoginAttemptService,
    MailService,
    UserMapper,
    PasswordResetTokenService,
  ],
  exports: [AuthService, UsersService],
})
export class AuthModule {}
