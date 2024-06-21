import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    let accessToken = '';
    if (req.headers.authorization) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    if (accessToken) {
      const decoded = await this.authService.decodeJwtToken(accessToken);
      req['user'] = decoded;
    }

    next();
  }
}
