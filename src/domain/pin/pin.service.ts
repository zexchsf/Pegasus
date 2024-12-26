import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class PinService {
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION = 5 * 60 * 1000;

  constructor(private readonly prismaService: PrismaService) { }

  private async generateSalt(length: number = 16): Promise<Buffer> {
    return crypto.randomBytes(length);
  }

  async setPin(account_id: string, pin: string) {
    const salt = await this.generateSalt();
    const hash = await argon2.hash(pin, salt);

    await this.prismaService.pin.create({
      data: {
        account_id,
        salt,
        hash: Buffer.from(hash),
      },
    });

    await this.prismaService.$transaction([
      this.prismaService.pin.deleteMany({
        where: { account_id },
      }),

      this.prismaService.pin.create({
        data: {
          account_id,
          salt,
          hash: Buffer.from(hash),
          failed_attempts: 0,
          is_locked: false,
          last_failed_attempt: null,
        },
      }),
    ]);
  }

  async verifyPin(account_id: string, pin: string) {
    const pinData = await this.prismaService.pin.findUnique({
      where: { account_id },
    });

    if (pinData) {
      throw new BadRequestException('Pin not set for account');
    }

    if (pinData.is_locked && pinData.last_failed_attempt) {
      const lockoutEnd = new Date(
        pinData.last_failed_attempt.getTime() + this.LOCKOUT_DURATION,
      );
      if (new Date() < lockoutEnd) {
        throw new UnauthorizedException(
          'Account is temporarily locked. Please try again later.',
        );
      }
    }

    try {
      const isValid = await argon2.verify(pinData.hash.toString(), pin);
      if (!isValid) {
        await this.handleFailedAttempt(account_id, pinData.failed_attempts);
        throw new UnauthorizedException('Invalid PIN');
      }

      if (pinData.failed_attempts > 0) {
        await this.resetFailedAttempts(account_id);
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid PIN');
    }
  }

  private async handleFailedAttempt(
    account_id: string,
    currentFailedAttempts: number,
  ): Promise<void> {
    const newFailedAttempts = currentFailedAttempts + 1;
    const shouldLock = newFailedAttempts >= this.MAX_ATTEMPTS;

    await this.prismaService.pin.update({
      where: { account_id },
      data: {
        failed_attempts: newFailedAttempts,
        is_locked: shouldLock,
        last_failed_attempt: new Date(),
      },
    });
  }

  private async resetFailedAttempts(account_id: string) {
    await this.prismaService.pin.update({
      where: { account_id },
      data: {
        failed_attempts: 0,
        is_locked: false,
        last_failed_attempt: null,
      },
    });
  }
}
