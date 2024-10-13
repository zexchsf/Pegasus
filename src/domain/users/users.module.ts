import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthService } from '../../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { BcryptHelper } from '../../common/helpers/bcrypt.helper';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { LoginAttemptService } from '../login-attempt/login-attempt.service';
import { MailService } from '../../common/services/mail.service';
import { UserMapper } from '../../common/mappers/user.mapper';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthService,
    JwtService,
    BcryptHelper,
    RefreshTokenService,
    LoginAttemptService,
    MailService,
    UserMapper,
  ],
})
export class UsersModule {}
