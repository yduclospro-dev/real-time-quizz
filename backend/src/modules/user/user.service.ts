import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserService {
  private prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return user ?? null;
  }

  async findById(id: string): Promise<Partial<User> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        lastName: true,
        firstName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return user ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ?? null;
  }
}
