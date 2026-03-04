import { Injectable, UnauthorizedException, BadRequestException, GoneException, InternalServerErrorException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from 'crypto';

import { User } from "../../entities/user.entity";
import { UserRol } from "../../entities/user_rol.entity";
import { UnitAssignment } from "../../entities/unit_assignment.entity";
import { Ph } from "../../entities/ph.entity";
import { Role } from "../../entities/role.entity";
import { RefreshToken } from "../../entities/refresh_token.entity";
import { PasswordToken } from "../../entities/password_token.entity";
import { MailerService } from "../mailer.service";
import { SetPasswordDto } from "../../dtos/payload/auth-set-password.dto";
import { ResetPasswordRequestDto } from "../../dtos/payload/auth-reset-password.dto";

import { I18nContext, I18nService } from 'nestjs-i18n';
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

type SessionData = {
  userId: string;
  userProfile: {
    email: string;
    firstName: string;
    lastName: string;
    document: string | null;
    documentType: string | null;
    phone: string | null;
    avatar: string | null;
    roles: string[];
  };
  ownership: any;
  scope: string[];
};

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
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordToken)
    private readonly passwordTokenRepository: Repository<PasswordToken>,
    private readonly dataSource: DataSource,
    private readonly mailerService: MailerService,
  ) {}

  // Flujo de proveedor de autenticación (público)
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
        provider: providerName,
        token_type: 'temp'
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

  // 3. Validamos los campos que vinieron del cliente según el proveedor seleccionado y emitimos el token de sesión final con la info del usuario
  async validateStep(token: string, fields: Record<string, any>) {
    try {
      // Verificar el token que vino en el header
      // Este token contiene el { provider: "accessEmail", ... }
      const payload = await this.jwtService.verifyAsync(token);

      // Validar credenciales según el proveedor

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
        const finalSessionToken = await this.issueAccessToken(userData);

        const refreshToken = await this.issueRefreshToken(userData.userId);

        return {
          state: this.i18n.t('general.SUCCESS', {lang, args: {},}),
          result: {
            access_token: finalSessionToken,
            expires_in: 3600,
            token_type: "Bearer",
            refresh_token: refreshToken.token,
            refresh_expires_in: refreshToken.expiresIn,
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

  // Flujo de token de sesión (público)
  // Refrescar token de sesión usando el refresh token
  async refreshAccessToken(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { token_hash: tokenHash },
      relations: ['user']
    });

    if (!stored) {
      throw new BadRequestException(
        this.i18n.t('general.ERROR_TOKEN_AUTH_INVALID', { lang, args: {}, })
      );
    }

    if (stored.expires_at.getTime() <= Date.now()) {
      throw new GoneException(
        this.i18n.t('general.TOKEN_EXPIRED', { lang, args: {}, })
      );
    }

    const user = stored.user ?? await this.userRepository.findOne({
      where: { id: stored.user_id, is_active: true }
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('general.INVALID_CREDENTIALS', { lang, args: {}, })
      );
    }

    const userData = await this.buildSessionData(user);
    const accessToken = await this.issueAccessToken(userData);

    const newRefresh = await this.issueRefreshToken(userData.userId, ipAddress, userAgent);

    return {
      access_token: accessToken,
      expires_in: 3600,
      token_type: 'Bearer',
      refresh_token: newRefresh.token,
      refresh_expires_in: newRefresh.expiresIn,
    };
  }

  // Cierra la sesión del usuario eliminando el refresh token de la base de datos
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepository.delete({ token_hash: tokenHash });
  }

  // Flujo de contraseña (público)
  // Enviar email con link para establecer contraseña por primera vez (en el caso de usuarios creados por admin) o para resetearla (en el caso de usuarios que olvidaron su contraseña)
  async sendActivationLink(user: User): Promise<void> {
    await this.sendPasswordLinkEmail(
      user,
      'SET_PASSWORD',
      '/set-password',
      'auth.SET_PASSWORD_SUMMARY',
      'set-password'
    );
  }

  // Inicia el flujo de reseteo de contraseña enviando un email con un link que contiene un token para establecer la nueva contraseña
  async resetPasswordRequest(dto: ResetPasswordRequestDto): Promise<any> {
    const resetPasswordCooldownMs = 10 * 60 * 1000;

    const user = await this.userRepository.findOne({
      where: { email: dto.email }
    });

    if (!user) {
      return { message: this.i18n.t('auth.RESET_EMAIL_SENT', { lang }) };
    }

    const latestResetToken = await this.passwordTokenRepository.findOne({
      where: { user_id: user.id, type: 'RESET_PASSWORD' },
      order: { created_at: 'DESC' },
    });

    if (
      latestResetToken &&
      Date.now() - latestResetToken.created_at.getTime() < resetPasswordCooldownMs
    ) {
      return {
        message: this.i18n.t('auth.RESET_EMAIL_WAIT', { lang }),
      };
    }

    await this.sendPasswordLinkEmail(
      user,
      'RESET_PASSWORD',
      '/reset-password',
      'auth.RESET_PASSWORD_REQUEST_SUMMARY',
      'reset-password'
    );

    return { message: this.i18n.t('auth.RESET_EMAIL_SENT', { lang }) };
  }
// Lógica para establecer una nueva contraseña usando el token enviado por email
// El mismo método se puede usar para establecer la contraseña por primera vez (en el flujo de activación) o para resetearla
  async setPassword(dto: SetPasswordDto): Promise<any> {
    const tokenHash = this.hashToken(dto.token);
    await this.dataSource.transaction(async manager => {
      const stored = await manager.findOne(PasswordToken, {
        where: { token_hash: tokenHash },
        relations: ['user']
      });

      if (!stored) {
        throw new BadRequestException(this.i18n.t('auth.PASSWORD_TOKEN_INVALID', { lang }));
      }

      if (stored.used_at) {
        throw new GoneException(this.i18n.t('auth.PASSWORD_TOKEN_USED', { lang }));
      }

      if (stored.expires_at.getTime() <= Date.now()) {
        throw new GoneException(this.i18n.t('auth.PASSWORD_TOKEN_EXPIRED', { lang }));
      }

      const user = stored.user;

      if (!user) {
        throw new UnauthorizedException(this.i18n.t('general.INVALID_CREDENTIALS', { lang }));
      }

      user.password = await bcrypt.hash(dto.password, 10);
      user.is_active = true;
      await manager.save(User, user);

      await manager.delete(RefreshToken, { user_id: user.id });

      stored.used_at = new Date();
      await manager.save(PasswordToken, stored);
    });

    return { message: this.i18n.t('auth.SET_PASSWORD_DESC', { lang }) };
  }

  // Helpers de autenticación/sesión (privados)
  // Valida las credenciales del usuario y construye los datos de sesión (roles, permisos, propiedad a la que tiene acceso)
  private async validateUserCredentials(email: string, password: string) {
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

    if (!user.password) {
      throw new UnauthorizedException(
        this.i18n.t('general.INVALID_CREDENTIALS', {lang, args: {},})
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('general.INVALID_CREDENTIALS', {lang, args: {},})
      );
    }

    await this.userRepository.update(user.id, { last_login: new Date() });

    return await this.buildSessionData(user);
  }

  // Construye los datos de sesión del usuario, incluyendo roles, permisos y propiedad a la que tiene acceso (si aplica)
  private async buildSessionData(user: User): Promise<SessionData> {
    const userRoles = await this.userRolRepository.find({
      where: { users_id: user.id, is_active: true },
      relations: ['role']
    });

    const roles = userRoles.map(ur => ur.role.name);
    const scopes = userRoles.flatMap(ur => ur.role.scopes || []);
    const uniqueScopes = scopes.length > 0 ? [...new Set(scopes)] : ["read_only"];

    let ownership: any = null;
    if (userRoles.length > 0) {
      const unitAssignment = await this.unitAssignmentRepository.findOne({
        where: { 
          user_id: user.id,
          is_active: true 
        },
        relations: ['unit', 'unit.ph']
      });
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
      scope: uniqueScopes
    };
  }

  // Emite un token de acceso JWT con la información del usuario, roles, permisos y propiedad a la que tiene acceso (si aplica)
  private async issueAccessToken(userData: SessionData) {
    return this.jwtService.signAsync({
      sub: userData.userId,
      email: userData.userProfile.email,
      userProfile: userData.userProfile,
      userId: userData.userId,
      ownership: userData.ownership,
      scope: userData.scope,
      token_type: 'access',
    }, { expiresIn: 3600 });
  }

  // Emite un refresh token y lo guarda hasheado en la base de datos
  private async issueRefreshToken(userId: string, ipAddress?: string, userAgent?: string) {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresInSeconds = 60 * 60 * 24 * 7;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const existing = await this.refreshTokenRepository.findOne({
      where: { user_id: userId }
    });

    await this.refreshTokenRepository.save({
      ...(existing ?? {}),
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return { token: refreshToken, expiresIn: expiresInSeconds };
  }

  // Helpers de contraseña/correo (privados)
  // Envía un email con un link que contiene un token para establecer o resetear la contraseña
  private async sendPasswordLinkEmail(
    user: User,
    type: 'SET_PASSWORD' | 'RESET_PASSWORD',
    path: string,
    subjectKey: string,
    templateName: string
  ): Promise<void> {
    const token = await this.createPasswordToken(user.id, type);
    const baseUrl = process.env.APP_BASE_URL;

    if (!baseUrl) {
      throw new InternalServerErrorException(
        this.i18n.t('general.APP_BASE_URL_REQUIRED', { lang })
      );
    }

    const link = `${baseUrl}${path}?token=${token}`;

    await this.mailerService.sendTemplate(
      user.email,
      this.i18n.t(subjectKey, { lang }),
      templateName,
      {
        appName: process.env.APP_NAME || 'nuestra plataforma',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        link,
      }
    );
  }

  // Crea un token de contraseña (set o reset) y lo guarda hasheado en la base de datos. El token plano se envía por email.
  private async createPasswordToken(userId: string, type: 'SET_PASSWORD' | 'RESET_PASSWORD'): Promise<string> {
    const token = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.dataSource.transaction(async manager => {
      await manager.delete(PasswordToken, { user_id: userId, type });
      await manager.save(PasswordToken, {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        type,
      });
    });

    return token;
  }

  // Helpers de utilidad (privados)
  // Hashing de tokens para no guardar el valor plano en la base de datos
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
