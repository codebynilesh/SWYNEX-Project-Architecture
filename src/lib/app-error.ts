export interface ValidationDetail {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(
    message: string,
    code = 'BAD_REQUEST',
    details?: unknown,
  ): AppError {
    return new AppError(400, code, message, details);
  }

  static validation(details: ValidationDetail[]): AppError {
    return new AppError(400, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  static unauthorized(
    message = 'Authentication required',
    code = 'AUTH_REQUIRED',
  ): AppError {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'You do not have access to this resource'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, code = 'CONFLICT'): AppError {
    return new AppError(409, code, message);
  }
}
