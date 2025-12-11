import { ApiResponse } from '../../../backend/src/common/types/api-response';
import { UserRole } from '../../../backend/src/common/types/user-role';

export type ApiError = ApiResponse<never>;

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}
