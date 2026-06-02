import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorDto } from 'src/common/dto/error.dto';
import { ERROR_CODE } from './error-code';
import { ErrorResultDto } from 'src/common/dto/error-result.dto';
import { AppError } from './app.error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private buildErrorResultDto(args: {
    statusCode: number;
    code: string;
    message: string;
  }) {
    const errorDto = new ErrorDto();
    errorDto.statusCode = args.statusCode;
    errorDto.code = args.code;
    errorDto.message = args.message;
    const resultDto = new ErrorResultDto();
    resultDto.success = false;
    resultDto.error = errorDto;
    return resultDto;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception);
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppError) {
      const statusCode = exception.statusCode;
      const code = exception.code;
      const message = exception.message;
      return response.status(statusCode).json(
        this.buildErrorResultDto({
          statusCode,
          code,
          message,
        }),
      );
    }

    if (exception instanceof UnauthorizedException) {
      const { statusCode, code, message } = ERROR_CODE.UNAUTHORIZED;
      return response
        .status(statusCode)
        .json(this.buildErrorResultDto({ statusCode, code, message }));
    }

    if (exception instanceof ForbiddenException) {
      const { statusCode, code, message } = ERROR_CODE.FORBIDDEN;
      return response
        .status(statusCode)
        .json(this.buildErrorResultDto({ statusCode, code, message }));
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      const rawMessage =
        typeof body === 'string' ? body : (body as any).message;

      if (Array.isArray(rawMessage)) {
        return response.status(statusCode).json(
          this.buildErrorResultDto({
            statusCode,
            code: ERROR_CODE.VALIDATION_ERROR.code,
            message: rawMessage.join('; '),
          }),
        );
      }

      return response.status(statusCode).json(
        this.buildErrorResultDto({
          statusCode,
          code: 'SERVER_001',
          message: rawMessage ?? exception.message,
        }),
      );
    }

    const errorCode = ERROR_CODE.SERVER_ERROR;

    return response.status(500).json(
      this.buildErrorResultDto({
        statusCode: errorCode.statusCode,
        code: errorCode.code,
        message: errorCode.message,
      }),
    );
  }
}
