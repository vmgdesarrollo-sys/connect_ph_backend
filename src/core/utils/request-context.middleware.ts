// Middleware para extraer el userId del JWT y almacenarlo en el contexto de la petición, de modo que esté disponible en los controladores, 
// servicios y también en el subscriber de TypeORM para asignar automáticamente el userId a los campos created_by y updated_by.
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly requestContext: RequestContextService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify(authHeader.substring(7));
        userId = payload.userId || payload.sub;
      } catch (e) { /* ignore */ }
    }

    // Importante: run() debe envolver el resto de la ejecución
    this.requestContext.run(() => {
      if (userId) {
        this.requestContext.setUserId(userId);
      }
      next();
    });
  }
}