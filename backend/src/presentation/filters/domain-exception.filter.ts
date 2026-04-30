import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  AssetNotFoundException,
  AssetTypeNotFoundException,
  CategoryHasChildrenException,
  CategoryNotFoundException,
  DuplicateNameException,
  PortfolioNotFoundException,
  TagNotFoundException,
} from '../../domain/exceptions/index.js';
import { DomainExceptionMapper } from './domain-exception.mapper.js';

@Catch(
  AssetNotFoundException,
  PortfolioNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, code } = DomainExceptionMapper.map(exception);
    const errorLabel: string =
      status === (HttpStatus.NOT_FOUND as number)
        ? 'Not Found'
        : status === (HttpStatus.CONFLICT as number)
          ? 'Conflict'
          : 'Internal Server Error';

    if (status >= 500) {
      this.logger.error(
        `[${request.requestId ?? '-'}] ${exception.name}: ${exception.message}`,
      );
    }

    const body: Record<string, unknown> = {
      statusCode: status,
      status,
      code,
      message: exception.message,
      error: errorLabel,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    };
    if (process.env.NODE_ENV !== 'production' && exception.stack) {
      body.stack = exception.stack;
    }
    response.status(status).json(body);
  }
}
