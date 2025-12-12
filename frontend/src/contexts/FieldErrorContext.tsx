import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ApiError } from '../lib/api-client';

type FieldErrors = Record<string, string>;

type ContextValue = {
  fieldErrors: FieldErrors;
  setFieldErrorsFromApiError: (err: ApiError | null) => void;
  clearFieldErrors: () => void;
};

const FieldErrorContext = createContext<ContextValue | undefined>(undefined);

export const FieldErrorProvider = ({ children }: { children: ReactNode }) => {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const setFieldErrorsFromApiError = (err: ApiError | null) => {
    if (!err || !err.details) {
      setFieldErrors({});
      return;
    }

    const map: FieldErrors = {};
    for (const d of err.details) {
      if (d.field) map[d.field] = d.message;
    }
    setFieldErrors(map);
  };

  const clearFieldErrors = () => setFieldErrors({});

  return (
    <FieldErrorContext.Provider
      value={{ fieldErrors, setFieldErrorsFromApiError, clearFieldErrors }}
    >
      {children}
    </FieldErrorContext.Provider>
  );
};

export const useFieldErrorContext = () => {
  const ctx = useContext(FieldErrorContext);
  if (!ctx) throw new Error('useFieldErrorContext must be used within FieldErrorProvider');
  return ctx;
};
