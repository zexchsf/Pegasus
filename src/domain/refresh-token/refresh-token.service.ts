import { Injectable } from '@nestjs/common';
import dayjs from '../../common/helpers/dayjs';
import { PrismaService } from 'nestjs-prisma';
import { REFRESH_TOKEN_EXPIRY_TIME } from '../../common/constants';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prismaService: PrismaService) {}

  async saveToken(user_id: string, token: string) {
    return this.prismaService.refreshToken.create({
      data: {
        user_id,
        token,
        expires_at: dayjs(new Date())
          .add(REFRESH_TOKEN_EXPIRY_TIME)
          .toISOString(),
      },
    });
  }

  async findByToken(token: string) {
    return this.prismaService.refreshToken.findFirst({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });
  }

  async deleteToken(id: string) {
    return this.prismaService.refreshToken.delete({
      where: {
        id,
      },
    });
  }
}
