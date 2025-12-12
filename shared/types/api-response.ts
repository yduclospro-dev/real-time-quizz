export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

export type ApiError = {
  code: string;
  message: string;
  details?: FieldError[];
};

export type FieldError = {
  field: string;
  message: string;
};
