import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { I18nContext, I18nService } from 'nestjs-i18n';
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@Injectable()
export class ApiClientGuard implements CanActivate {
  // En un entorno real, estos valores vendrían de tu DB o .env
  private readonly VALID_CLIENT_ID = process.env.AUTH_CLIENT_ID;
  private readonly VALID_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;

  constructor(private readonly i18n: I18nService, private configService: ConfigService) {}
  
  canActivate(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest();

  // ✅ leer headers
  const headerClientId = request.headers['client-id'];
  const headerClientSecret = request.headers['client-secret'];

  // ✅ leer .env
  const envClientId = this.configService.get<string>('AUTH_CLIENT_ID');
  const envClientSecret = this.configService.get<string>('AUTH_CLIENT_SECRET');

  if (!headerClientId || !headerClientSecret) {
    throw new UnauthorizedException('Missing client headers');
  }

  if (
    headerClientId !== envClientId ||
    headerClientSecret !== envClientSecret
  ) {
    throw new UnauthorizedException('Invalid client credentials');
  }

  return true;
}


  // canActivate(context: ExecutionContext): boolean {
  //   const request = context.switchToHttp().getRequest();
    
  //   // Extraer de las cabeceras
  //   const clientId = this.configService.get<string>('AUTH_CLIENT_ID');
  //   const clientSecret = request.headers['client-secret'];

  //   if (!clientId || !clientSecret) {
  //     throw new UnauthorizedException(this.i18n.t('general.HEADERS_INITIAL_REQUIRED', {lang, args: {},}));
  //   }

  //   if (clientId !== this.VALID_CLIENT_ID || clientSecret !== this.VALID_CLIENT_SECRET) {
  //     throw new UnauthorizedException(this.i18n.t('general.INVALID_CREDENTIALS', {lang, args: {},}));
  //   }

  //   return true;
  // }
}