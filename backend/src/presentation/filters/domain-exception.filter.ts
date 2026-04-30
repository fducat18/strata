import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AssetNotFoundException,
  PortfolioNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
} from '../../domain/exceptions/index.js';

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
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';

    if (exception instanceof AssetNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = 'ASSET_NOT_FOUND';
    } else if (exception instanceof PortfolioNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = 'PORTFOLIO_NOT_FOUND';
    } else if (exception instanceof CategoryNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = 'CATEGORY_NOT_FOUND';
    } else if (exception instanceof TagNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = 'TAG_NOT_FOUND';
    } else if (exception instanceof AssetTypeNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = 'ASSET_TYPE_NOT_FOUND';
    } else if (exception instanceof DuplicateNameException) {
      status = HttpStatus.CONFLICT;
      code = 'DUPLICATE_NAME';
    } else if (exception instanceof CategoryHasChildrenException) {
      status = HttpStatus.CONFLICT;
      code = 'CATEGORY_HAS_CHILDREN';
    }

    response.status(status).json({
      code,
      message: exception.message,
      status,
    });
  }
}
