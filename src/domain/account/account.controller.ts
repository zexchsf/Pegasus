import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ApiError } from 'src/common/errors/api.error';
import { SuccessResponse } from 'src/common/responses/success.response';
import { AuthUser } from '../../common/decorators/auth-user';
import { PinService } from '../pin/pin.service';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { SetPinDto } from './dto/set-pin.dto';

@Controller('accounts')
@ApiTags('Account')
@ApiBearerAuth()
@UseGuards()
export class AccountController {
  private logger = new Logger(AccountController.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly pinService: PinService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create Account' })
  async createAccount(
    @Body() body: CreateAccountDto,
    @AuthUser() user: User,
  ): Promise<SuccessResponse> {
    try {
      await this.accountService.createAccount(body, user.id);
      return new SuccessResponse('New account is being processed');
    } catch (error) {
      this.logger.error('Error creating new account', {
        ...body,
        userId: user.id,
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError(
        'An error occurred while creating a new account. Please try again later.',
        error,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Fetch User Accounts' })
  @ApiOkResponse({
    description: 'User accounts fetch successful',
    type: SuccessResponse,
  })
  async getUserAccounts(@AuthUser() user: User): Promise<SuccessResponse> {
    try {
      const accounts = await this.accountService.fetchAccounts(user.id);

      return new SuccessResponse('User accounts fetch successful', accounts);
    } catch (error) {
      this.logger.error('Error fetching user accounts', {
        userId: user.id,
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError(
        'An error occured while fetching user accounts. Plesee try again later',
        error,
      );
    }
  }

  @Put('/:id/pin')
  @ApiOperation({ summary: 'Set account pin' })
  async setPin(
    @Body() body: SetPinDto,
    @Param('id') id: string,
    @AuthUser() user: User,
  ) {
    try {
      const accountExists = await this.accountService.findOne(id, user.id);
      if (!accountExists) {
        throw new NotFoundException('Account not found');
      }

      await this.pinService.setPin(id, body.pin);

      return new SuccessResponse('Account pin set successful');
    } catch (error) {
      this.logger.error('Error setting account pin', {
        accountId: id,
        userId: user.id,
        errorMessage: error.message,
        stack: error.stack,
      });
      throw new ApiError(
        'An error occured while setting account pin. Plesee try again later',
        error,
      );
    }
  }
}
