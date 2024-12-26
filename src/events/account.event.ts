import { OnEvent } from '@nestjs/event-emitter';
import { ACCOUNT_EVENTS, AccountCreateEvent } from '.';
import { AccountService } from '../domain/account/account.service';
import { Logger } from '@nestjs/common';

export class AccountEvents {
  private logger = new Logger(AccountEvents.name);

  constructor(private readonly accountService: AccountService) { }

  @OnEvent(ACCOUNT_EVENTS.ACCOUNT_CREATE)
  async createAccount(payload: AccountCreateEvent) {
    const account_number =
      await this.accountService.generateUniqueAccountNumber();
    const account = await this.accountService.create({
      data: {
        account_number,
        ...payload,
      },
    });
    this.logger.log(`account: ${account.account_number} created successfully `);
  }
}
