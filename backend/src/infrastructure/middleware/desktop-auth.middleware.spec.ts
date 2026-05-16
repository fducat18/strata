import { DesktopAuthMiddleware } from './desktop-auth.middleware.js';
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('DesktopAuthMiddleware', () => {
  const ENV_KEY = 'STRATA_DESKTOP_API_TOKEN';
  let middleware: DesktopAuthMiddleware;

  beforeEach(() => {
    middleware = new DesktopAuthMiddleware();
    delete process.env[ENV_KEY];
  });

  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  function buildRequest(
    headers: Record<string, string> = {},
    method = 'GET',
  ): Request {
    return {
      method,
      header: (name: string) => headers[name.toLowerCase()],
    } as unknown as Request;
  }

  function buildResponse(): Response {
    return {} as Response;
  }

  it('allows requests when desktop token mode is disabled', () => {
    const req = buildRequest();
    const res = buildResponse();
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects requests without token when desktop token mode is enabled', () => {
    process.env[ENV_KEY] = 'secret-token';
    const req = buildRequest();
    const res = buildResponse();
    const next: NextFunction = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows requests with matching desktop token', () => {
    process.env[ENV_KEY] = 'secret-token';
    const req = buildRequest({ 'x-strata-desktop-token': 'secret-token' });
    const res = buildResponse();
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows CORS preflight requests in desktop token mode', () => {
    process.env[ENV_KEY] = 'secret-token';
    const req = buildRequest({}, 'OPTIONS');
    const res = buildResponse();
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
