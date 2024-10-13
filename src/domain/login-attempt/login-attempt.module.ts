import { Module } from '@nestjs/common';
import { LoginAttemptService } from './login-attempt.service';

@Module({
  providers: [LoginAttemptService],
  exports: [LoginAttemptService],
})
export class LoginAttemptModule {}
