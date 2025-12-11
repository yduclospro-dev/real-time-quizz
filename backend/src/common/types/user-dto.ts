import type { User } from '@prisma/client';

export class UserDto {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  role: string;
  createdAt: Date;
  password?: string;

  static fromEntity(user: User): UserDto {
    return {
      id: user.id,
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt || new Date(),
      password: user.password || undefined,
    };
  }
}
