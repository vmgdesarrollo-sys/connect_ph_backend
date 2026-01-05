import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiClientGuard implements CanActivate {
  // En un entorno real, estos valores vendrían de tu DB o .env
  private readonly VALID_CLIENT_ID = process.env.AUTH_CLIENT_ID;
  private readonly VALID_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;

  constructor(private configService: ConfigService) {}
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Extraer de las cabeceras
    const clientId = this.configService.get<string>('AUTH_CLIENT_ID');
    const clientSecret = request.headers['client-secret'];

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('Missing client credentials in headers');
    }

    if (clientId !== this.VALID_CLIENT_ID || clientSecret !== this.VALID_CLIENT_SECRET) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    return true;
  }
}