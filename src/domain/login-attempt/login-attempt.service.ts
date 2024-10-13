import { Injectable } from '@nestjs/common';
import { CreateLoginAttemptDto } from './dto/create-login-attempt.dto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prismaService: PrismaService) {}

  async createLoginAttempt(data: CreateLoginAttemptDto) {
    return this.prismaService.loginAttempt.create({
      data,
    });
  }
}
