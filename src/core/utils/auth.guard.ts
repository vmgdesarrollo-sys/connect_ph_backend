import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 1. Verificación básica del formato del header
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Acceso denegado: Token no proporcionado o formato inválido');
    }

    const token = authHeader.substring(7);

    try {
      // 2. Verificación real contra el secreto de JWT
      const payload = await this.jwtService.verifyAsync(token);
      
      // 3. Adjuntar el payload al request para que esté disponible en los controladores
      request.user = payload;
      
      return true;
    } catch (error) {
      // 4. Manejo específico si el token falló (expiró o fue alterado)
      throw new UnauthorizedException('Acceso denegado: Sesión inválida o expirada');
    }
  }
}