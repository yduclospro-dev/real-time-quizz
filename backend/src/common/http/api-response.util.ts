import { ApiResponse } from '../types/api-response';

export const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  error: null,
});

export const errorResponse = (
  code: string,
  message: string,
  details?: { field: string; message: string }[],
): ApiResponse<null> => ({
  success: false,
  data: null,
  error: {
    code,
    message,
    details,
  },
});
