/**
 * Standard error response shape used by every endpoint via the
 * Domain/Prisma exception filters.
 */
export const ERROR_RESPONSE_EXAMPLE = {
  statusCode: 404,
  status: 404,
  code: 'PORTFOLIO_SNAPSHOT_NOT_FOUND',
  message: 'Portfolio snapshot 00000000-0000-0000-0000-000000000000 not found',
  error: 'Not Found',
  requestId: '7ed1c4f8-...',
  timestamp: '2025-01-01T12:00:00.000Z',
};

export const ERROR_BODY_SCHEMA = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    code: { type: 'string' },
    message: { type: 'string' },
    error: { type: 'string' },
    requestId: { type: 'string', nullable: true },
    timestamp: { type: 'string', format: 'date-time' },
  },
  example: ERROR_RESPONSE_EXAMPLE,
};
