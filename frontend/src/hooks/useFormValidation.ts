import { ZodSchema } from "zod";

export const useFormValidation = <T extends Record<string, any>>(
  schema: ZodSchema<T>
) => {
  const validate = (data: T): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { isValid: true, errors: {} };
    }

    const errors: Partial<Record<keyof T, string>> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        errors[issue.path[0] as keyof T] = issue.message;
      }
    });

    return { isValid: false, errors };
  };

  return { validate };
};
