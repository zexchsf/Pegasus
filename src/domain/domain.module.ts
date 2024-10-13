import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { LoginAttemptModule } from './login-attempt/login-attempt.module';

@Module({
  imports: [UsersModule, LoginAttemptModule],
})
export class DomainModule {}
