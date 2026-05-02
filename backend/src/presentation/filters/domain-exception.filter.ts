import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  AssetNotFoundException,
  AssetTypeNotFoundException,
  AssetTypeInUseException,
  CategoryHasChildrenException,
  CategoryNotFoundException,
  DuplicateNameException,
  PortfolioSnapshotNotFoundException,
  TagNotFoundException,
} from '../../domain/exceptions/index.js';
import { DomainExceptionMapper } from './domain-exception.mapper.js';

@Catch(
  AssetNotFoundException,
  PortfolioSnapshotNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
  AssetTypeInUseException,
)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, code } = DomainExceptionMapper.map(exception);
    const errorLabel: string =
      status === 404
        ? 'Not Found'
        : status === 409
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
