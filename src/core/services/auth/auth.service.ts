import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Any } from "typeorm";

import { I18nContext, I18nService } from 'nestjs-i18n';
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@Injectable()
export class AuthService {
  constructor(private readonly i18n: I18nService, private readonly jwtService: JwtService) {}

  // 1. Listar opciones (puedes traer esto de una DB o config)
  getOptions() {
    return {
      state: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      result: {
        providers: [
          {
            providerName: "accessEmail",
            label: "Inicio con Email y contraseña.",
            description: "Inicio con Email y contraseña.",
            iconUrl: "",
          },
        ],
      },
    };
  }

  // 2. Al seleccionar un proveedor, generamos el "contrato" de campos y el token
  async selectProvider(providerName: string): Promise<any> {
    let fields = [];

    // Lógica dinámica según proveedor
    if (providerName === "accessEmail") {
      fields = {
        email: { description: "email cliente", type: "text" },
        password: { description: "password cliente", type: "password" },
      } as any;
    }

    // Generamos un token que "recuerda" que estamos en este flujo
    const token = this.jwtService.sign({
        provider: providerName
      });
    const expires_in = 3600;
    const token_type = "Bearer";

    return {
      state: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      result: {
        fields,
        authorization: { token: token, expires_in, token_type },
      },
    };
  }

  async validateStep(token: string, fields: Record<string, any>) {
  try {
    // Verificar token temporal
    const payload = await this.jwtService.verifyAsync(token)

    // Verificar proveedor
    if (payload.provider !== 'accessEmail') {
      throw new UnauthorizedException('Proveedor inválido')
    }

    // DATOS QUEMADOS (PRUEBA)
    const VALID_EMAIL = 'admin@gmail.com'
    const VALID_PASSWORD = '123456'

    const { email, password } = fields

    // Validar credenciales
    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    // Generar TOKEN FINAL (sesión)
    const finalSessionToken = await this.jwtService.signAsync({
      sub: 'user_uuid_123',
      email,
      roles: ['admin'],
    })

    return {
      state: 'SUCCESS',
      result: {
        access_token: finalSessionToken,
        expires_in: 3600,
        token_type: 'Bearer',
      },
    }
  } catch (error) {
    throw new UnauthorizedException('Token inválido o expirado')
  }
}


  // async validateStep(token: string, fields: Record<string, any>) {
  //   try {
  //     // 1. Verificar el token que vino en el header
  //     // Este token contiene el { provider: "accessEmail", ... }
  //     const payload = await this.jwtService.verifyAsync(token);

  //     // 2. Aquí procesas los datos según el proveedor
  //     // Ejemplo: Validar contra la base de datos o servicio externo
  //     console.log(`Validando para el proveedor: ${payload.provider}`);

  //     // 3. Generar el Token de Sesión FINAL (El que usará el usuario para navegar)
  //     const finalSessionToken = await this.jwtService.signAsync({
  //       sub: "user_uuid_123",
  //       email: fields.email,
  //       userProfile: {
  //         email: "miemail@dominio.com",
  //         firstName: "Gabriel",
  //         lastName: "Martinez",
  //         document: "123456787",
  //         documentType: "CC",
  //         phone: "3012223432",
  //         avatar: "https://example.com/profiles/user.jpg",
  //         roles: ["admin"]
  //       },
  //       userId: "user_uuid_123",
  //       ownership: {
  //         id: "1",
  //         name: "Conjunto Los Soles",
  //         tax_id: "12222212-2",
  //         address: "calle 123 # 12-23",
  //         city: "Bogotá DC",
  //         country: "Colombia",
  //         state: "Bogotá DC"
  //       },
  //       scope: "full_access",
  //     });

  //     return {
  //       state: this.i18n.t('general.SUCCESS', {lang, args: {},}),
  //       result: {
  //         access_token: finalSessionToken,
  //         expires_in: 3600,
  //         token_type: "Bearer",
  //       },
  //     };
  //   } catch (error) {
  //     // Si el token del header expiró o es inválido
  //     throw new UnauthorizedException(
  //       this.i18n.t('general.TOKEN_EXPIRED', {lang, args: {},})
  //     );
  //   }
  // }

    // 👇 AGREGA ESTO JUSTO AQUÍ
  async verifyToken(token: string) {
    return await this.jwtService.verifyAsync(token);
  }

}
