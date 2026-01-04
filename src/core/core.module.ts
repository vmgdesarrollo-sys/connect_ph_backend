import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entidades (Asegúrate de importar todas las del Excel para esta etapa)
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Ph } from './entities/ph.entity';

// Controladores
import { UsersController } from './controllers/users.controller';
import { RolesController } from './controllers/roles.controller';
import { PhsController } from './controllers/phs.controller';

// Servicios
import { UsersService } from './services/users.service';
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
  ],
  providers: [  
    AuthService,
    PhsService, 
    UsersService, 
    RolesService,

    // Proveedores falsos para que no pida DataSource
    { provide: getRepositoryToken(User), useValue: mockRepository },
    { provide: getRepositoryToken(Role), useValue: mockRepository },
    { provide: getRepositoryToken(Ph), useValue: mockRepository },
  ],
  //exports: [
    //UsersService, 
    //PhsService, 
    //TypeOrmModule
  //],
})
export class CoreModule {}