import { RequestIdMiddleware } from './request-id.middleware.js';
import { Request, Response, NextFunction } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  function buildRequest(headers: Record<string, string> = {}): Request {
    return {
      header: (name: string) => headers[name.toLowerCase()],
      method: 'GET',
      originalUrl: '/test',
    } as unknown as Request;
  }

  function buildResponse(): { setHeader: jest.Mock } & Response {
    return { setHeader: jest.fn() } as unknown as {
      setHeader: jest.Mock;
    } & Response;
  }

  describe('use', () => {
    it('generates a UUID when no x-request-id header provided', () => {
      const req = buildRequest();
      const res = buildResponse();
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
      expect(next).toHaveBeenCalled();
    });

    it('uses incoming x-request-id when provided and valid', () => {
      const req = buildRequest({ 'x-request-id': 'my-custom-id' });
      const res = buildResponse();
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toBe('my-custom-id');
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Request-Id',
        'my-custom-id',
      );
    });

    it('generates new UUID when x-request-id is empty string', () => {
      const req = buildRequest({ 'x-request-id': '' });
      const res = buildResponse();
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('generates new UUID when x-request-id exceeds 200 characters', () => {
      const longId = 'a'.repeat(201);
      const req = buildRequest({ 'x-request-id': longId });
      const res = buildResponse();
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).not.toBe(longId);
      expect(req.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('accepts x-request-id exactly 200 characters long', () => {
      const exactId = 'b'.repeat(200);
      const req = buildRequest({ 'x-request-id': exactId });
      const res = buildResponse();
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toBe(exactId);
    });

    it('calls next()', () => {
      const req = buildRequest();
      const res = buildResponse();
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
