import {
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { generateRandomDigits } from '../../lib/random';
import { ACCOUNT_COUNT_LIMIT, ACCOUNT_PREFIX } from './account.interface';
import { Prisma } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountCreateEvent, ACCOUNT_EVENTS } from 'src/events';

@Injectable()
export class AccountService {
  constructor(
    private readonly prismaService: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

  async create(payload: Prisma.AccountCreateArgs) {
    return this.prismaService.account.create(payload);
  }

  async fetchAccounts(user_id: string) {
    return this.prismaService.account.findMany({ where: { user_id } });
  }

  async createAccount(payload: CreateAccountDto, user_id: string) {
    const accountCount = await this.checkAccountCount(user_id);
    if (accountCount >= ACCOUNT_COUNT_LIMIT) {
      throw new UnprocessableEntityException(
        "You can't create another account, you are currently at the account limit",
      );
    }

    const eventPayload: AccountCreateEvent = {
      user_id,
      ...payload,
    }
    this.eventEmitter.emit(ACCOUNT_EVENTS.ACCOUNT_CREATE, eventPayload);
  }

  async checkAccountCount(user_id: string): Promise<number> {
    return this.prismaService.account.count({ where: { user_id } });
  }

  async isAccountNumberTaken(account_number: string): Promise<boolean> {
    const count = await this.prismaService.account.count({
      where: { account_number },
    });
    return count > 0;
  }

  async generateUniqueAccountNumber(): Promise<string> {
    let accountNumber: string;

    do {
      const uniquePart = generateRandomDigits(7);
      accountNumber = `${ACCOUNT_PREFIX}${uniquePart}`;
    } while (await this.isAccountNumberTaken(accountNumber));

    return accountNumber;
  }

  async findOne(id: string, user_id: string) {
    return await this.prismaService.account.findFirst({
      where: {
        id,
        user_id
      }
    })
  }
}
