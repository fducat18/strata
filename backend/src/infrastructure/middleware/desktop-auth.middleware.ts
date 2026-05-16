import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const DESKTOP_TOKEN_ENV = 'STRATA_DESKTOP_API_TOKEN';
const DESKTOP_TOKEN_HEADER = 'x-strata-desktop-token';

@Injectable()
export class DesktopAuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const desktopToken = process.env[DESKTOP_TOKEN_ENV];
    if (!desktopToken) {
      next();
      return;
    }
    const incomingToken = req.header(DESKTOP_TOKEN_HEADER);
    if (!incomingToken || incomingToken !== desktopToken) {
      throw new UnauthorizedException('Desktop API access denied');
    }
    next();
  }
}
