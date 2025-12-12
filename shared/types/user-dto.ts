import { Role } from '../enums/role';

export interface UserDto {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  role: Role;
  createdAt: Date;
}
