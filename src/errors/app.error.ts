import { ErrorCode } from './error-code';

export class AppError extends Error {
  readonly code: string;

  readonly statusCode: number;

  constructor(code: ErrorCode, cause?: Error) {
    super(code.message, { cause });
    this.code = code.code;
    this.statusCode = code.statusCode;
  }
}
