import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { LoginAttemptModule } from './login-attempt/login-attempt.module';
import { AccountModule } from './account/account.module';
import { PinModule } from './pin/pin.module';
import { PasswordResetTokenModule } from './password-reset/password-reset-token.module';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';

@Module({
  imports: [
    UsersModule,
    LoginAttemptModule,
    AccountModule,
    PinModule,
    PasswordResetTokenModule,
    RefreshTokenModule,
  ],
})
export class DomainModule {}
