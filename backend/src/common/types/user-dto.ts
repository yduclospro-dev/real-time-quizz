import { User } from '@prisma/client';

export class UserDto {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  role: string;
  createdAt: Date;

  constructor(user: User) {
    Object.assign(this, user);
  }

  static fromEntity(user: User): UserDto {
    return new UserDto(user);
  }
}
