import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const hostHeader = req.headers.host; 
    const host = hostHeader ? hostHeader.split(':')[0] + ':' + hostHeader.split(':')[1] : '';
    req['tenantHost'] = host;
    next();
  }
}
