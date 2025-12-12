import type { ApiResponse } from '@shared/types/api-response';
import { Role } from '@shared/enums/role';

export type ApiError = ApiResponse<never>;

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginData {
  email: string;
  password: string;
}
