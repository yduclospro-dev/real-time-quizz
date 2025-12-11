export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}