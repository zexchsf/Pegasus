import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as morgan from 'morgan';
import { AppLogger } from '../logger/app.logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private morganMiddleware: any;

  constructor(private readonly logger: AppLogger) {
    this.morganMiddleware = morgan('combined', {
      stream: { 
        write: (message: string) => this.logger.log(message)
      }
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.morganMiddleware(req, res, next);
  }
}
