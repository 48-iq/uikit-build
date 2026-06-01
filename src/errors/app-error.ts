import { ErrorCode } from "./error-codes";

export class AppError extends Error {

  private readonly code: string;

  private readonly statusCode: number;

  constructor(code: ErrorCode, cause?: string) {
    super(code.message);
    this.code = code.code;
    this.statusCode = code.statusCode;
    this.cause = cause;
  }
  
}