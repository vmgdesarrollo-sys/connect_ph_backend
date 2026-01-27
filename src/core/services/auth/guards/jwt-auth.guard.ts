import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let token: string | undefined;

    // 1. Buscar en el header Authorization
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }

    // 2. Si no hay en header, buscar en cookie
    if (!token && request.cookies && request.cookies['access_token']) {
      token = request.cookies['access_token'];
    }

    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}