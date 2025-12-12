'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ApiError } from '../lib/api-client';
import toast from 'react-hot-toast';
import { mapApiErrorToUserMessage } from '../lib/error-mapping';
import { FieldErrorProvider } from '../contexts/FieldErrorContext';

type ErrorContextValue = {
  showError: (e: ApiError) => void;
};

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export const useGlobalError = () => {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useGlobalError must be used within ReactQueryProvider');
  return ctx;
};

export function ReactQueryProvider({ children }: { children: ReactNode }) {

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  const showError = (e: ApiError) => {
    const mapped = mapApiErrorToUserMessage(e);
    const hasFieldDetails = !!e.details;
    if (!hasFieldDetails) toast.error(mapped.message);
  };

  // Ensure queries also use the centralized showError handler for global errors.
  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    });
  }, [queryClient]);

  return (
    <ErrorContext.Provider value={{ showError }}>
      <FieldErrorProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        {/* errors are shown via react-hot-toast to match success toasts */}
      </FieldErrorProvider>
    </ErrorContext.Provider>
  );
}
