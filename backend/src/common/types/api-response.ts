export class ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    errors?: Array<{ field: string; message: string }>,
  ) {
    this.success = success;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
    if (errors !== undefined) {
      this.errors = errors;
    }
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static error(
    message: string,
    errors?: Array<{ field: string; message: string }>,
  ): ApiResponse {
    return new ApiResponse(false, message, undefined, errors);
  }
}
