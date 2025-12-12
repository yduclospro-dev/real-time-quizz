import { User, Role as PrismaRole } from '@prisma/client';
import { Role } from '@shared/enums/role';
import type { UserDto } from '@shared/types/user-dto';

export const userToDto = (entity: User): UserDto => ({
  id: entity.id,
  lastName: entity.lastName,
  firstName: entity.firstName,
  email: entity.email,
  role: mapRole(entity.role),
  createdAt: entity.createdAt,
});

export const mapRole = (role: PrismaRole): Role => {
  switch (role) {
    case PrismaRole.TEACHER:
      return Role.TEACHER;
    case PrismaRole.STUDENT:
      return Role.STUDENT;
  }
};
