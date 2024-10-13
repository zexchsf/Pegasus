import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user';
import { User } from '@prisma/client';
import { AuthService } from '../../auth/auth.service';
import { BcryptHelper } from '../../common/helpers/bcrypt.helper';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private bcryptHelper: BcryptHelper,
  ) {}

  @Patch('/password')
  async updatePassword(
    @Body() body: UpdatePasswordDto,
    @AuthUser() user: User,
  ) {
    const isMatch = await this.bcryptHelper.comparePassword(
      body.currentPassword,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException('incorrect password');
    }

    const hashedPassword = await this.bcryptHelper.hashPassword(
      body.newPassword,
    );
    const updatedUser = await this.usersService.updateOne(
      { id: user.id },
      { password: hashedPassword },
    );

    return { message: 'user password updated successfully', data: updatedUser };
  }
}
