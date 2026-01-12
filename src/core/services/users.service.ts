import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dtos/payload/create-user.dto";
import * as bcrypt from "bcrypt";
import { getRepositoryToken } from "@nestjs/typeorm";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class UsersService {
  constructor(
    private readonly i18n: I18nService,
    //@InjectRepository(User)
    //private readonly userRepository: Repository<User>,

    @Inject(getRepositoryToken(User))
    private readonly userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('users.MSG_CREATE', {lang, args: {},}),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...createUserDto,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
    const { email } = createUserDto;
    const password: string = "12345678";

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
    return savedUser;
  }

  async findAll(_fields?: string, _where?: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('users.MSG_LIST', {lang, args: {},}),
      data: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          first_name: "Gabriel",
          last_name: "Gomez",
          type_person: "Natural",
          gender: "M",
          avatar_url: "https://google.com/fotos/miFoto.jpg",
          email: "miemail@dominio.com",
          document_type: "CC",
          document_number: "123456789",
          phone_number: "3019999999",
          is_active: true,
          created_at: "2026-01-08 12:00:00",
        },
      ],
      properties: {
        total_items: 100,
        items_per_page: 10,
        current_page: 1,
        total_pages: 1,
      },
    };
    return await this.userRepository.find({
      where: { is_active: true },
    });
  }

  async findOne(id: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('users.MSG_GET', {lang, args: {},}),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        first_name: "Gabriel",
        last_name: "Gomez",
        type_person: "Natural",
        gender: "M",
        avatar_url: "https://example.com/profiles/user.jpg",
        email: "gabriel@dominio.com",
        document_type: "CC",
        document_number: "123456789",
        phone_number: "3019999999",
        is_active: true,
        created_at: "2026-01-08 12:00:00",
      },
    };
  }

  async findByEmail(email: string): Promise<any | null> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('users.MSG_GET', {lang, args: {},}),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        first_name: "Gabriel",
        last_name: "Gomez",
        type_person: "Natural",
        gender: "M",
        avatar_url: "https://example.com/profiles/user.jpg",
        email: "gabriel@dominio.com",
        document_type: "CC",
        document_number: "123456789",
        phone_number: "3019999999",
        is_active: true,
        created_at: "2026-01-08 12:00:00",
      },
    };
  }

  async delete(id: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('users.MSG_DELETE', {lang, args: {id},}),
    };
  }

  async update(id: string, createUserDto: CreateUserDto): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('users.MSG_UPDATE', {lang, args: {},}),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...createUserDto,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
  }
}
