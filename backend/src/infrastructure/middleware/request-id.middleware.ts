import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

const HEADER = 'x-request-id';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header(HEADER);
    const requestId =
      incoming && incoming.length > 0 && incoming.length <= 200
        ? incoming
        : randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    this.logger.log(`[${requestId}] ${req.method} ${req.originalUrl}`);
    next();
  }
}
