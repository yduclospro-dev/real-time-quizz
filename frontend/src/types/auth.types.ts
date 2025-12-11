import { ApiResponse } from '../../../backend/src/common/types/api-response';

export type UserRole = "student" | "teacher";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export type ApiError = ApiResponse<never>;

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}
