import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter.js';
import {
  AssetNotFoundException,
  PortfolioSnapshotNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
  AssetTypeInUseException,
} from '../../domain/exceptions/index.js';

function buildMockHost(
  responseMock: any,
  requestMock: any = {},
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => responseMock,
      getRequest: () => ({ requestId: 'req-123', ...requestMock }),
    }),
  } as unknown as ArgumentsHost;
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let responseMock: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    responseMock = { status, json };
  });

  describe('catch', () => {
    it('returns 404 for AssetNotFoundException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new AssetNotFoundException('Asset not found'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(body.code).toBe('ASSET_NOT_FOUND');
      expect(body.error).toBe('Not Found');
      expect(body.requestId).toBe('req-123');
    });

    it('returns 404 for PortfolioSnapshotNotFoundException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new PortfolioSnapshotNotFoundException('not found'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('returns 404 for CategoryNotFoundException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new CategoryNotFoundException('not found'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('returns 404 for TagNotFoundException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new TagNotFoundException('not found'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('returns 404 for AssetTypeNotFoundException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new AssetTypeNotFoundException('not found'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('returns 409 for DuplicateNameException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new DuplicateNameException('duplicate'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.code).toBe('DUPLICATE_NAME');
      expect(body.error).toBe('Conflict');
    });

    it('returns 409 for CategoryHasChildrenException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new CategoryHasChildrenException('has children'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.code).toBe('CATEGORY_HAS_CHILDREN');
    });

    it('returns 409 for AssetTypeInUseException', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new AssetTypeInUseException('type in use'), host);
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.code).toBe('ASSET_TYPE_IN_USE');
      expect(body.error).toBe('Conflict');
    });

    it('includes timestamp in response body', () => {
      const host = buildMockHost(responseMock);
      filter.catch(new AssetNotFoundException('not found'), host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.timestamp).toBeDefined();
    });

    it('includes stack in non-production env', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const exception = new AssetNotFoundException('not found');
      const host = buildMockHost(responseMock);
      filter.catch(exception, host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.stack).toBeDefined();
      process.env.NODE_ENV = originalEnv;
    });

    it('does not include stack in production env', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const exception = new AssetNotFoundException('not found');
      const host = buildMockHost(responseMock);
      filter.catch(exception, host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.stack).toBeUndefined();
      process.env.NODE_ENV = originalEnv;
    });

    it('handles missing requestId on request', () => {
      const host = buildMockHost(responseMock, { requestId: undefined });
      filter.catch(new AssetNotFoundException('not found'), host);
      const body = responseMock.json.mock.calls[0][0];
      expect(body.requestId).toBeUndefined();
    });
  });
});
