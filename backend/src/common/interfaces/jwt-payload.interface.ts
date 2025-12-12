import { Role } from '../../../../shared/enums/role';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
