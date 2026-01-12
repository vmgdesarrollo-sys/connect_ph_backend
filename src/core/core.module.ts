import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entidades (Asegúrate de importar todas las del Excel para esta etapa)
import { User } from './entities/user.entity';
import { UserRol } from './entities/user_rol.entity';
import { Role } from './entities/role.entity';
import { Ph } from './entities/ph.entity';

// Controladores
import { UsersController } from './controllers/users.controller';
import { UserRolesController } from './controllers/user_roles.controller';
import { RolesController } from './controllers/roles.controller';
import { PhsController } from './controllers/phs.controller';

// Servicios
import { UsersService } from './services/users.service';
import { UserRolesService } from './services/user_roles.service';
import { RolesService } from './services/roles.service';
import { PhsService } from './services/phs.service';

/**
 * Borrarme porque soy simulacion
 */
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth/auth.service';
const mockRepository = {
  find: () => [],
  findOne: () => ({}),
  create: (dto) => dto,
  save: (dto) => ({ id: 'uuid-generado', ...dto }),
};
/** FIN simulacion */

@Module({
  imports:[
    JwtModule.register({
      global: true, // Esto permite usar el JwtService en otros módulos sin re-importarlo
      secret: process.env.JWT_SECRET || 'CLAVE_SECRETA_PROVISIONAL',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  //imports: [
  //  TypeOrmModule.forFeature([
  //    User, 
  //    Role, 
  //    Ph
  //  ]), 
  //],
  controllers: [
    AuthController,
    PhsController, 
    UsersController, 
    RolesController,
    UserRolesController, 
  ],
  providers: [  
    AuthService,
    PhsService, 
    UsersService, 
    RolesService,
    UserRolesService,

    // Proveedores falsos para que no pida DataSource
    { provide: getRepositoryToken(User), useValue: mockRepository },
    { provide: getRepositoryToken(Role), useValue: mockRepository },
    { provide: getRepositoryToken(Ph), useValue: mockRepository },
    { provide: getRepositoryToken(UserRol), useValue: mockRepository },
  ],
  //exports: [
    //UsersService, 
    //PhsService, 
    //TypeOrmModule
  //],
})
export class CoreModule {}