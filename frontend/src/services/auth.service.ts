import { apiClient } from "@/lib/api-client";
import { UserDto } from "../../../backend/src/common/types/user-dto";
import { LoginData, RegisterData } from "@/types/auth.types";
import { ApiResponse } from '../../../backend/src/common/types/api-response';

export const authService = {
  async register(data: RegisterData): Promise<ApiResponse<{ user: UserDto }>> {
    const response = await apiClient.post<ApiResponse<{ user: UserDto }>>("/auth/register", data);
    console.log('Register response from service:', response);
    return response.data;
  },

  async login(data: LoginData): Promise<ApiResponse<{ user: UserDto }>> {
    const response = await apiClient.post<ApiResponse<{ user: UserDto }>>("/auth/login", data);
    console.log('Login response from service:', response);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async getCurrentUser(): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.get<ApiResponse<UserDto>>("/auth/me");
    return response.data;
  },
};
