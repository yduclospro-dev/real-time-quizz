import { apiClient } from "@/lib/api-client";
import { UserDto } from "../../../backend/src/common/types/user-dto";
import { LoginDto, RegisterDto } from "@/types/auth.types";
import { ApiResponse } from '../../../shared/types/api-response';

export const authService = {
  async register(data: RegisterDto): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.post<ApiResponse<UserDto>>("/auth/register", data);
    console.log('Register response from service:', response);
    return response.data;
  },

  async login(data: LoginDto): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.post<ApiResponse<UserDto>>("/auth/login", data);
    console.log('Login response from service:', response);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  },

  async getCurrentUser(): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.get<ApiResponse<UserDto>>("/auth/me");
    return response.data;
  },
};
