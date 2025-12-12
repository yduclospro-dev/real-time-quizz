import { useMemo } from 'react';
import { useFieldErrorContext } from '../contexts/FieldErrorContext';

export const useFieldError = (fieldName?: string) => {
  const { fieldErrors } = useFieldErrorContext();

  const error = useMemo(() => {
    if (!fieldName) return undefined;
    return fieldErrors[fieldName];
  }, [fieldErrors, fieldName]);

  return error;
};
