import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from "typeorm";
import { User } from "../entities/user.entity";
import { UserRol } from "../entities/user_rol.entity";
import { UnitAssignment } from "../entities/unit_assignment.entity";
import { UserRolePh } from "../entities/user_roles_phs.entity";
import { CreateUserDto } from "../dtos/payload/user-payload.dto";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth/auth.service";


import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class UsersService {
  constructor(
    private readonly i18n: I18nService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRol)
    private readonly userRolRepository: Repository<UserRol>,
    @InjectRepository(UnitAssignment)
    private readonly unitAssignmentRepository: Repository<UnitAssignment>,
    @InjectRepository(UserRolePh)
    private readonly userRolePhRepository: Repository<UserRolePh>
  ) {}
// Crear un nuevo usuario
  async create(createUserDto: CreateUserDto): Promise<any> {
    
    const { email, password } = createUserDto;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException("El correo electrónico ya está registrado");
    }

    // 2. Cifrar la contraseña solo si se proporciona
    let hashedPassword: string | undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // 3. Crear instancia y guardar
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      is_active: !!password,
    });

    const savedUser = await this.userRepository.save(newUser);

    if (!password) {
      console.log('[UsersService] Usuario creado sin password, enviando link de activación a:', savedUser.email);
      try {
        await this.authService.sendActivationLink(savedUser);
        console.log('[UsersService] Email de activación enviado exitosamente a:', savedUser.email);
      } catch (error) {
        console.error('[UsersService] Error al enviar email de activación:', (error as any)?.message || error);
        throw error;
      }
    } else {
      console.log('[UsersService] Usuario creado con password, no se envía email de activación.');
    }

    // Eliminamos el password del objeto de respuesta por seguridad
    const { password: _, ...userWithoutPassword } = savedUser;

    const activationRequired = !password;

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: activationRequired
        ? this.i18n.t("users.MSG_CREATE_PENDING", { lang, args: {} })
        : this.i18n.t("users.MSG_CREATE", { lang, args: {} }),
      activation_required: activationRequired,
      data: userWithoutPassword,
    };
  }
// Listar todos los usuarios, opcionalmente filtrados por copropiedad
  async findAll(_fields?: string, _where?: string, phId?: string): Promise<any> {
    const selectFields = [
      'u.id', 'u.first_name', 'u.last_name', 'u.type_person', 'u.gender', 'u.avatar_url',
      'u.email', 'u.document_type', 'u.document_number', 'u.phone_number', 'u.is_active', 'u.created_at'
    ];

    const qb = this.userRepository
      .createQueryBuilder('u')
      .select(selectFields);

    // Si se pasa phId, filtrar usuarios vinculados a esa copropiedad vía user_roles_phs
    if (phId) {
      qb.innerJoin('user_roles', 'ur', 'ur.users_id = u.id AND ur.is_active = true')
        .innerJoin('user_roles_phs', 'urp', 'urp.user_roles_id = ur.id AND urp.phs_id = :phId AND urp.is_active = true', { phId });
    }

    // Aplicar filtros adicionales desde _where
    if (_where) {
      try {
        const parsed = JSON.parse(_where);
        for (const [key, value] of Object.entries(parsed)) {
          qb.andWhere(`u.${key} = :${key}`, { [key]: value });
        }
      } catch {
        // Si _where no es JSON válido, ignorar
      }
    }

    const users = await qb.distinct(true).getRawMany();

    // Normalizar nombres de columnas (getRawMany devuelve con prefijo u_)
    const data = users.map(row => ({
      id: row.u_id,
      first_name: row.u_first_name,
      last_name: row.u_last_name,
      type_person: row.u_type_person,
      gender: row.u_gender,
      avatar_url: row.u_avatar_url,
      email: row.u_email,
      document_type: row.u_document_type,
      document_number: row.u_document_number,
      phone_number: row.u_phone_number,
      is_active: row.u_is_active,
      created_at: row.u_created_at,
    }));

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_LIST", { lang, args: {} }),
      data,
      properties: {
        total_items: data.length,
        items_per_page: 10,
        current_page: 1,
        total_pages: Math.ceil(data.length / 10),
      },
    };
  }
// Obtener detalle de un usuario por ID
  async findOne(id: string): Promise<any> {
    // Permitir filtrar por is_active desde id o mostrar todos si no se especifica
    let whereClause: any = { id };
    // Si necesitas filtrar por is_active, pásalo como parte del objeto
    // Ejemplo: findOne(id, { is_active: true })
    // Para compatibilidad, puedes ajustar el controller para aceptar un parámetro opcional
    const user = await this.userRepository.findOne({
      where: whereClause,
      select: ['id', 'first_name', 'last_name', 'type_person', 'gender', 'avatar_url', 
               'email', 'document_type', 'document_number', 'phone_number', 'is_active', 'created_at']
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t("general.NOT_FOUND", { lang, args: { id } })
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_GET", { lang, args: {} }),
      data: user,
    };
  }
// Obtener detalle de un usuario por email
  async findByEmail(email: string): Promise<any | null> {
    const user = await this.userRepository.findOne({
      where: { email, is_active: true },
      select: ['id', 'first_name', 'last_name', 'type_person', 'gender', 'avatar_url', 
               'email', 'document_type', 'document_number', 'phone_number', 'is_active', 'created_at']
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t("general.NOT_FOUND", { lang, args: { email } })
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_GET", { lang, args: {} }),
      data: user,
    };
  }
// Eliminar un usuario por ID (soft delete)
  async delete(id: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(
        this.i18n.t("general.NOT_FOUND", { lang, args: { id } })
      );
    }

    // Soft delete: cambiar is_active a false
    user.is_active = false;
    await this.userRepository.save(user);

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_DELETE", { lang, args: { id } }),
    };
  }

  // Actualizar un usuario por ID
  async update(id: string, createUserDto: CreateUserDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(
        this.i18n.t("general.NOT_FOUND", { lang, args: { id } })
      );
    }

    // Si está cambiando el email, verificar que no exista en otro usuario
    if (createUserDto.email && createUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      
      if (existingUser) {
        throw new ConflictException("El correo electrónico ya está registrado");
      }
    }

    // Si se envía contraseña en la actualización, cifrarla antes de guardar
    if (createUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    }

    // Actualizar campos del usuario
    Object.assign(user, createUserDto);
    
    const updatedUser = await this.userRepository.save(user);
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_UPDATE", { lang, args: {} }),
      data: userWithoutPassword,
    };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
      select: [
        'id',
        'email',
        'first_name',
        'last_name',
        'document_type',
        'document_number',
        'phone_number',
        'avatar_url'
      ]
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t("users.NOT_FOUND", { lang, args: { id: userId } })
      );
    }

    const userRoles = await this.userRolRepository.find({
      where: { users_id: user.id, is_active: true },
      relations: ['role']
    });

    const roles = userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name
    }));
    const scopes = userRoles.flatMap(ur => ur.role.scopes || []);
    const uniqueScopes = scopes.length > 0 ? [...new Set(scopes)] : ["read_only"];

    let ownerships: any[] = [];
    if (userRoles.length > 0) {
      const roleIds = userRoles.map(ur => ur.id);
      const rolePhAssignments = await this.userRolePhRepository.find({
        where: {
          user_roles_id: In(roleIds),
          is_active: true,
        },
        relations: ['ph'],
      });

      const unitAssignments = await this.unitAssignmentRepository.find({
        where: {
          user_id: user.id,
          is_active: true
        },
        relations: ['unit', 'unit.ph']
      });

      const ownershipMap = new Map<string, any>();

      for (const assignment of rolePhAssignments) {
        const ph = assignment?.ph;
        if (!ph || ownershipMap.has(ph.id)) continue;

        ownershipMap.set(ph.id, {
          id: ph.id,
          name: ph.name,
          tax_id: ph.tax_id,
          address: ph.address,
          city: ph.city,
          country: ph.country,
          state: ph.state,
          logo_url: ph.logo_url
        });
      }

      for (const assignment of unitAssignments) {
        const ph = assignment?.unit?.ph;
        if (!ph || ownershipMap.has(ph.id)) continue;

        ownershipMap.set(ph.id, {
          id: ph.id,
          name: ph.name,
          tax_id: ph.tax_id,
          address: ph.address,
          city: ph.city,
          country: ph.country,
          state: ph.state,
          logo_url: ph.logo_url
        });
      }

      ownerships = Array.from(ownershipMap.values());
    }

    return {
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
      userId: user.id,
      ownerships: ownerships,
      scope: uniqueScopes
    };
  }
}
