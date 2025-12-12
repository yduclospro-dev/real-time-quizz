import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { ApiError } from './api-client';
import { useFieldErrorContext } from '../contexts/FieldErrorContext';
import { useGlobalError } from '../providers/ReactQueryProvider';

type UseApiMutationConfig = {
  /**
   * When true, suppress showing the global toast when the ApiError contains field `details`.
   * Default: true (do not show toast when field errors exist).
   */
  suppressToastOnFieldErrors?: boolean;
};

export const useApiMutation = <TArgs, TData, TError = ApiError, TContext = unknown>(
  mutationFn: (args: TArgs) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TArgs, TContext>, 'mutationFn'>,
  config?: UseApiMutationConfig,
) => {
  const { setFieldErrorsFromApiError } = useFieldErrorContext();
  const { showError } = useGlobalError();

  return useMutation<TData, TError, TArgs, TContext>({
    mutationFn,
    ...(options as any),
    onError: (error: any, variables: TArgs | undefined, context: TContext | undefined) => {
      // populate field errors if present
      try {
        if (error?.details) setFieldErrorsFromApiError(error as ApiError);
      } catch {}

      // Show global toast depending on config. If suppressToastOnFieldErrors is true
      // and there are field details, skip showing the toast.
      try {
        const hasFieldDetails = !!error?.details;
        const suppress = config?.suppressToastOnFieldErrors ?? true;
        if (!(suppress && hasFieldDetails)) {
          showError(error as ApiError);
        }
      } catch {}

      (options as any)?.onError?.(error as TError, variables, context);
    },
  } as any);
};
