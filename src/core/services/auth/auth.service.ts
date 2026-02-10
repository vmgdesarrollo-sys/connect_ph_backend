import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { User } from "../../entities/user.entity";
import { UserRol } from "../../entities/user_rol.entity";
import { UnitAssignment } from "../../entities/unit_assignment.entity";
import { Ph } from "../../entities/ph.entity";
import { Role } from "../../entities/role.entity";

import { I18nContext, I18nService } from 'nestjs-i18n';
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@Injectable()
export class AuthService {
  constructor(
    private readonly i18n: I18nService, 
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRol)
    private readonly userRolRepository: Repository<UserRol>,
    @InjectRepository(UnitAssignment)
    private readonly unitAssignmentRepository: Repository<UnitAssignment>,
    @InjectRepository(Ph)
    private readonly phRepository: Repository<Ph>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

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
      }),
      expires_in = 3600,
      token_type = "Bearer";

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
      // Verificar el token que vino en el header
      // Este token contiene el { provider: "accessEmail", ... }
      const payload = await this.jwtService.verifyAsync(token);

      // Validar credenciales según el proveedor
      console.log(`Validando para el proveedor: ${payload.provider}`);

      if (payload.provider === "accessEmail") {
        const { email, password } = fields;

        if (!email || !password) {
          throw new UnauthorizedException(
            this.i18n.t('general.INVALID_CREDENTIALS', {lang, args: {},})
          );
        }

        // Validar usuario contra la base de datos
        const userData = await this.validateUserCredentials(email, password);

        // Generar el Token de Sesión final con toda la info del usuario y sus permisos
        const finalSessionToken = await this.jwtService.signAsync({
          sub: userData.userId,
          email: userData.userProfile.email,
          userProfile: userData.userProfile,
          userId: userData.userId,
          ownership: userData.ownership,
          scope: userData.scope,
        });

        return {
          state: this.i18n.t('general.SUCCESS', {lang, args: {},}),
          result: {
            access_token: finalSessionToken,
            expires_in: 3600,
            token_type: "Bearer",
          },
        };
      }

      throw new UnauthorizedException(
        this.i18n.t('general.INVALID_CREDENTIALS', {lang, args: {},})
      );
    } catch (error) {
      // Si el token del header expiró o es inválido
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        this.i18n.t('general.TOKEN_EXPIRED', {lang, args: {},})
      );
    }
  }

  private async validateUserCredentials(email: string, password: string) {
    // Buscar usuario por email (incluyendo password que está en select: false)
    const user = await this.userRepository.findOne({
      where: { email, is_active: true },
      select: ['id', 'email', 'password', 'first_name', 'last_name', 
               'document_type', 'document_number', 'phone_number', 'avatar_url']
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('general.INVALID_CREDENTIALS', {lang, args: {},})
      );
    }

    // Verificar la contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('general.INVALID_CREDENTIALS', {lang, args: {},})
      );
    }

    // Actualizar last_login
    await this.userRepository.update(user.id, { last_login: new Date() });

    // Obtener roles del usuario
    const userRoles = await this.userRolRepository.find({
      where: { users_id: user.id, is_active: true },
      relations: ['role']
    });

    const roles = userRoles.map(ur => ur.role.name);
    
    // Obtener el scope del primer rol activo
    const scope = userRoles.length > 0 && userRoles[0].role.scopes 
      ? userRoles[0].role.scopes 
      : "read_only"; // Scope por defecto si no tiene roles

    // 5. Obtener asignaciones de unidades y PH
    let ownership: any = null;
    if (userRoles.length > 0) {
      const unitAssignment = await this.unitAssignmentRepository.findOne({
        where: { 
          user_roles_id: userRoles[0].id,
          is_active: true 
        },
        relations: ['unit', 'unit.ph']
      });
      // Si el usuario tiene una unidad asignada y esa unidad tiene un PH, incluimos la info del PH en ownership
      if (unitAssignment?.unit?.ph) {
        const ph = unitAssignment.unit.ph;
        ownership = {
          id: ph.id,
          name: ph.name,
          tax_id: ph.tax_id,
          address: ph.address,
          city: ph.city,
          country: ph.country,
          state: ph.state,
          logo_url: ph.logo_url
        };
      }
    }

    // Construir el objeto de respuesta
    return {
      userId: user.id,
      userProfile: {
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        document: user.document_number,
        documentType: user.document_type,
        phone: user.phone_number,
        avatar: user.avatar_url,
        roles: roles
      },
      ownership: ownership,
      scope: scope
    };
  }
}
