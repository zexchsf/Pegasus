import { Module } from '@nestjs/common';
import { PinService } from '../pin/pin.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, PinService],
})
export class AccountModule {}
