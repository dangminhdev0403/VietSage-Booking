import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { fail } from './api-response';

type HttpExceptionBody = {
  message?: unknown;
  details?: unknown;
};

const BAD_REQUEST_STATUS = 400;
const INTERNAL_SERVER_ERROR_STATUS = 500;

const ERROR_CODES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = getRequestId(request);

    if (!(exception instanceof HttpException)) {
      this.logServerError(exception, request, HttpStatus.INTERNAL_SERVER_ERROR);
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          fail(
            'INTERNAL_SERVER_ERROR',
            'Internal server error',
            undefined,
            requestId,
          ),
        );
      return;
    }

    const status = exception.getStatus();
    if (status >= INTERNAL_SERVER_ERROR_STATUS) {
      this.logServerError(exception, request, status);
      response
        .status(status)
        .json(
          fail(
            'INTERNAL_SERVER_ERROR',
            'Internal server error',
            undefined,
            requestId,
          ),
        );
      return;
    }

    const exceptionResponse = exception.getResponse();
    const body = isHttpExceptionBody(exceptionResponse)
      ? exceptionResponse
      : undefined;
    const details = body?.details;
    const code =
      status === BAD_REQUEST_STATUS && details !== undefined
        ? 'VALIDATION_ERROR'
        : (ERROR_CODES[status] ?? 'BAD_REQUEST');
    const message = getSafeMessage(exceptionResponse, exception.message);

    response.status(status).json(fail(code, message, details, requestId));
  }

  private logServerError(
    exception: unknown,
    request: Request,
    status: number,
  ): void {
    const requestId = getRequestId(request);

    this.logger.error({
      exception_type: getExceptionType(exception),
      method: request.method,
      path: request.path,
      status,
      ...(requestId === undefined ? {} : { request_id: requestId }),
    });
  }
}

function getExceptionType(exception: unknown): string {
  if (
    typeof exception === 'object' &&
    exception !== null &&
    typeof exception.constructor?.name === 'string'
  ) {
    return exception.constructor.name;
  }

  return typeof exception;
}

function getRequestId(request: Request): string | undefined {
  const requestId = request.headers['x-request-id'];
  return typeof requestId === 'string' && requestId.trim().length > 0
    ? requestId
    : undefined;
}

function isHttpExceptionBody(value: unknown): value is HttpExceptionBody {
  return typeof value === 'object' && value !== null;
}

function getSafeMessage(response: string | object, fallback: string): string {
  if (typeof response === 'string') {
    return response;
  }

  if (isHttpExceptionBody(response) && typeof response.message === 'string') {
    return response.message;
  }

  return fallback;
}
