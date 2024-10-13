import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findById(id: string) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async create(payload: Prisma.UserCreateArgs) {
    return this.prismaService.user.create(payload);
  }

  async updateOne(
    query: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput,
  ) {
    return this.prismaService.user.update({ where: query, data });
  }

  async findOne(query: Prisma.UserWhereInput) {
    return this.prismaService.user.findFirst({ where: query });
  }
}
