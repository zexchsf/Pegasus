import { AccountType } from '@prisma/client';

export enum ACCOUNT_EVENTS {
  ACCOUNT_CREATE = 'account.create',
}

export interface AccountCreateEvent {
  user_id: string;
  account_type: AccountType;
  account_name: string
}
