import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter, PrismaValidationExceptionFilter } from './prisma-exception.filter.js';

function makePrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Prisma error message', {
    code,
    clientVersion: '5.0.0',
  });
}

function buildMockHost(
  responseMock: any,
  requestMock: any = {},
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => responseMock,
      getRequest: () => ({ requestId: 'req-456', ...requestMock }),
    }),
  } as unknown as ArgumentsHost;
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let responseMock: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    responseMock = { status, json };
  });

  describe('catch', () => {
    it('returns 409 for P2002 (unique constraint violation)', () => {
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P2002'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.code).toBe('UNIQUE_CONSTRAINT_VIOLATION');
      expect(body.error).toBe('Conflict');
    });

    it('returns 409 for P2003 (foreign key constraint violation)', () => {
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P2003'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.code).toBe('FOREIGN_KEY_VIOLATION');
    });

    it('returns 404 for P2025 (record not found)', () => {
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P2025'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.code).toBe('RECORD_NOT_FOUND');
      expect(body.error).toBe('Not Found');
    });

    it('returns 500 for unknown Prisma error', () => {
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P9999'), host);
      expect(responseMock.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      const body = responseMock.json.mock.calls[0][0];
      expect(body.code).toBe('DATABASE_ERROR');
    });

    it('includes requestId in response body', () => {
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P2002'), host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.requestId).toBe('req-456');
    });

    it('includes timestamp in response body', () => {
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P2002'), host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.timestamp).toBeDefined();
    });

    it('includes prismaCode in non-production env', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P2002'), host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.prismaCode).toBe('P2002');
      process.env.NODE_ENV = originalEnv;
    });

    it('omits prismaCode in production env', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P2002'), host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.prismaCode).toBeUndefined();
      process.env.NODE_ENV = originalEnv;
    });

    it('returns sanitized message for unknown error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const host = buildMockHost(responseMock);
      filter.catch(makePrismaError('P9999'), host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.message).toBe('A database error occurred.');
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('PrismaValidationExceptionFilter', () => {
  let filter: PrismaValidationExceptionFilter;
  let responseMock: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new PrismaValidationExceptionFilter();
    responseMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('returns 400 with VALIDATION_ERROR code', () => {
    const error = new Prisma.PrismaClientValidationError('Missing required field', {
      clientVersion: '5.0.0',
    });
    const host = buildMockHost(responseMock);
    filter.catch(error, host);
    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = responseMock.json.mock.calls[0][0];
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });
});
