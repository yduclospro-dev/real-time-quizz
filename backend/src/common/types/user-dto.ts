import type { User } from '@prisma/client';
import { UserRole } from './user-role';

export class UserDto {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  password?: string;

  static fromEntity(user: User): UserDto {
    return {
      id: user.id,
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt || new Date(),
      password: user.password || undefined,
    };
  }
}
