import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  ApiResponse as BackendApiResponse,
  ApiError as BackendApiError,
} from '@shared/types/api-response';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type ApiError = {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
  status?: number;
};

const mapBackendError = (
  status: number | undefined,
  backendError: BackendApiError | null | undefined,
): ApiError => {
  if (!backendError) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Une erreur est survenue',
      status,
    };
  }

  return {
    code: backendError.code || 'ERROR',
    message: backendError.message || 'Une erreur est survenue',
    details: backendError.details,
    status,
  };
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
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
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<BackendApiResponse<null>>) => {
        const status = error.response?.status;
        const backendError = error.response?.data?.error;
        const apiError = mapBackendError(status, backendError);

        return Promise.reject(apiError);
      },
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getInstance();
