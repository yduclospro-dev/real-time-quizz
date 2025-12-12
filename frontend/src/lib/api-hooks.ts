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

  const onErrorWrapper = (error: TError, variables: TArgs | undefined, context: TContext | undefined) => {
    const unknownErr = error as unknown;
    // populate field errors if present
    try {
      if ((unknownErr as ApiError)?.details) setFieldErrorsFromApiError(unknownErr as ApiError);
    } catch {}

    // Show global toast depending on config. If suppressToastOnFieldErrors is true
    // and there are field details, skip showing the toast.
    try {
      const hasFieldDetails = !!(unknownErr as ApiError)?.details;
      const suppress = config?.suppressToastOnFieldErrors ?? true;
      if (!(suppress && hasFieldDetails)) {
        // If suppression is disabled, force the toast even when field details exist
        showError(unknownErr as ApiError, { force: !suppress && hasFieldDetails });
      }
    } catch {}

    try {
      // React Query's onError may expect up to 4 args; provide undefined for the fourth.
      // Casts localized here to satisfy the type system for upstream handlers.
      (options?.onError as unknown as (...args: unknown[]) => unknown)?.(error, variables, context, undefined);
    } catch {}
  };

  const finalOptions: UseMutationOptions<TData, TError, TArgs, TContext> = {
    ...(options ?? {}),
    mutationFn,
    onError: onErrorWrapper,
  };

  return useMutation<TData, TError, TArgs, TContext>(finalOptions);
};
