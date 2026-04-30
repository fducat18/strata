import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface MappedPrismaError {
  status: number;
  code: string;
  error: string;
  message: string;
}

/**
 * Centralizes Prisma error → HTTP status mapping.
 * - P2002 (unique constraint) → 409 Conflict
 * - P2003 (FK constraint)     → 409 Conflict
 * - P2025 (record not found)  → 404 Not Found
 * - default                   → 500 Internal Server Error (sanitized in prod)
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const mapped = this.map(exception);
    if (mapped.status >= 500) {
      this.logger.error(
        `[${request.requestId ?? '-'}] Prisma error ${exception.code}: ${exception.message}`,
      );
    }

    const body: Record<string, unknown> = {
      statusCode: mapped.status,
      status: mapped.status,
      code: mapped.code,
      message: mapped.message,
      error: mapped.error,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    };
    if (process.env.NODE_ENV !== 'production') {
      body.prismaCode = exception.code;
      if (exception.stack) body.stack = exception.stack;
    }

    response.status(mapped.status).json(body);
  }

  private map(
    exception: Prisma.PrismaClientKnownRequestError,
  ): MappedPrismaError {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          error: 'Conflict',
          message: 'Resource with these values already exists.',
        };
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          code: 'FOREIGN_KEY_VIOLATION',
          error: 'Conflict',
          message: 'Referenced resource does not exist or is in use.',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'RECORD_NOT_FOUND',
          error: 'Not Found',
          message: 'The requested record was not found.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          error: 'Internal Server Error',
          message:
            process.env.NODE_ENV === 'production'
              ? 'A database error occurred.'
              : exception.message,
        };
    }
  }
}
