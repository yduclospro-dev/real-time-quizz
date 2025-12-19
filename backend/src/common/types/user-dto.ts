import { Role as PrismaRole } from '@prisma/client';
import { Role } from '@shared/enums/role';

export interface UserDto {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export const userToDto = (user: any): UserDto => {
  return {
    id: user.id,
    lastName: user.lastName,
    firstName: user.firstName,
    email: user.email,
    role: mapRole(user.role),
    createdAt: user.createdAt,
  };
};

export const mapRole = (role: PrismaRole): Role => {
  switch (role) {
    case PrismaRole.TEACHER:
      return Role.TEACHER;
    case PrismaRole.STUDENT:
      return Role.STUDENT;
  }
};
