import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/payload/create-user.dto';
import * as bcrypt from 'bcrypt';

import { getRepositoryToken } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    //@InjectRepository(User)
    //private readonly userRepository: Repository<User>,

    @Inject(getRepositoryToken(User))
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return { first_name: "PH Temporal" } as User;
    const { email, password } = createUserDto;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
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

  async findAll(): Promise<User[]> {
    return [{ first_name: "PH Temporal" }] as User[];
    return await this.userRepository.find({
      where: { is_active: true }
    });
  }

  async findOne(id: string): Promise<User> {
    return { first_name: "PH Temporal" } as User;
    const user = await this.userRepository.findOne({ where: { id, is_active: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    // return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return { first_name: "PH Temporal" } as User;
    return await this.userRepository.findOne({ where: { email } });
  }
}