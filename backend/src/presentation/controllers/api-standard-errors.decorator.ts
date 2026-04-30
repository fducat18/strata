import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ERROR_BODY_SCHEMA } from './error-response.schema.js';

/**
 * Composite decorator declaring the standard 400/404/409/500 error responses
 * so each controller method only opts in once.
 */
export const ApiStandardErrors = (
  statuses: Array<400 | 404 | 409 | 500> = [400, 404, 409, 500],
) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: errorDescription(status),
        schema: ERROR_BODY_SCHEMA,
      }),
    ),
  );

function errorDescription(status: number): string {
  switch (status) {
    case 400:
      return 'Validation error or malformed payload';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Conflict (duplicate or constraint violation)';
    case 500:
      return 'Internal server error';
    default:
      return 'Error';
  }
}
