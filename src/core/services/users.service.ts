import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dtos/payload/user-payload.dto";
import * as bcrypt from "bcrypt";


import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class UsersService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
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

    // 2. Cifrar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear instancia y guardar
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Eliminamos el password del objeto de respuesta por seguridad
    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_CREATE", { lang, args: {} }),
      data: userWithoutPassword,
    };
  }
// Listar todos los usuarios activos
  async findAll(_fields?: string, _where?: string): Promise<any> {
    const users = await this.userRepository.find({
      where: { is_active: true },
      select: ['id', 'first_name', 'last_name', 'type_person', 'gender', 'avatar_url', 
               'email', 'document_type', 'document_number', 'phone_number', 'is_active', 'created_at']
    });
// Retornar la lista de usuarios
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_LIST", { lang, args: {} }),
      data: users,
      properties: {
        total_items: users.length,
        items_per_page: 10,
        current_page: 1,
        total_pages: Math.ceil(users.length / 10),
      },
    };
  }
// Obtener detalle de un usuario por ID
  async findOne(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id, is_active: true },
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

    // Actualizar campos
    Object.assign(user, createUserDto);
    
    const updatedUser = await this.userRepository.save(user);
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("users.MSG_UPDATE", { lang, args: {} }),
      data: userWithoutPassword,
    };
  }
}
