import { useState, useCallback } from 'react';
import { ApiError } from '../lib/api-client';

type UseApiErrorOptions = {
  setFieldErrors?: (err: ApiError | null) => void;
};

export const useApiError = (opts?: UseApiErrorOptions) => {
  const [error, setError] = useState<ApiError | null>(null);

  const showError = useCallback((e: ApiError) => {
    setError(e);
    if (opts?.setFieldErrors) opts.setFieldErrors(e);
  }, [opts]);

  const clearError = useCallback(() => {
    setError(null);
    if (opts?.setFieldErrors) opts.setFieldErrors(null);
  }, [opts]);

  return { error, showError, clearError } as const;
};
