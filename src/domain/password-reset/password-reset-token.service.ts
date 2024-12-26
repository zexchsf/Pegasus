import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class PasswordResetTokenService {
  constructor(private readonly prismaService: PrismaService) { }

  async createToken(user_id: string) {
    const token = randomBytes(32).toString('hex');
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 1);

    return await this.prismaService.passwordResetToken.create({
      data: {
        token,
        user_id,
        expires_at,
        used: false
      },
    });
  }

  async findValidToken(token: string): Promise<any | null> {
    return await this.prismaService.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expires_at: {
          gte: new Date(),
        },
      },
      include: { user: true },
    });
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.prismaService.passwordResetToken.updateMany({
      where: { token },
      data: { used: true },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.prismaService.passwordResetToken.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }
}
