import { useFieldErrorContext } from '@/contexts/FieldErrorContext';
import { useGlobalError } from '@/providers/ReactQueryProvider';
import { createQuizSchema } from '@/schemas/quiz.schema';
import type { ApiError } from '@/lib/api-client';
import type { CreateQuizDto, UpdateQuizDto } from '@/types/quiz.types';

export function useQuizValidation() {
  const { setFieldErrorsFromApiError } = useFieldErrorContext();
  const { showError } = useGlobalError();

  const validateQuiz = (quizData: CreateQuizDto | UpdateQuizDto): boolean => {
    const validation = createQuizSchema.safeParse({
      title: quizData.title,
      questions: quizData.questions
    });

    if (!validation.success) {
      // Map zod issues to ApiError-style details
      const details = validation.error.issues.map((iss) => ({
        field: iss.path.join('.'),
        message: iss.message
      }));

      const apiErr: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
        status: 400
      };

      try {
        setFieldErrorsFromApiError(apiErr);
      } catch {}

      try {
        showError(apiErr, { force: true });
      } catch {}

      return false;
    }

    return true;
  };

  return { validateQuiz };
}
