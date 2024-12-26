import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty()
  @IsEnum(AccountType)
  account_type: AccountType;

  @ApiProperty()
  @IsString()
  currency_code: string

  @ApiProperty()
  @IsString()
  account_name: string
}
