import { ApiError } from './api-client';

export const formatApiError = (err: ApiError | unknown): ApiError => {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return err as ApiError;
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: typeof err === 'string' ? err : 'Une erreur est survenue',
  };
};

export const getFieldErrors = (err: ApiError) => err.details || [];
