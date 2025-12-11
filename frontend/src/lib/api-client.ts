import axios, { AxiosError, AxiosInstance } from "axios";
import { ApiError } from "@/types/auth.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // You can add auth token from localStorage/cookies here if needed
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || "Une erreur est survenue",
          statusCode: error.response?.status,
          errors: error.response?.data?.errors,
        };

        // Handle specific status codes
        if (error.response?.status === 401) {
          // Redirect to login or refresh token
          if (typeof window !== "undefined") {
            localStorage.removeItem("user");
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getInstance();
