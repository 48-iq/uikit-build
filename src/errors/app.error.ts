import { ErrorCode } from './error-code';

export class AppError extends Error {
  readonly code: string;

  readonly statusCode: number;

  constructor(code: ErrorCode, cause?: string) {
    super(code.message);
    this.code = code.code;
    this.statusCode = code.statusCode;
    this.cause = cause;
  }
}
