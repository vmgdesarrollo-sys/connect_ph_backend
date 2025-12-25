import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
const mockRepository = {
  find: () => [],
  findOne: () => ({}),
  create: (dto) => dto,
  save: (dto) => ({ id: 'uuid-generado', ...dto }),
};
/** FIN simulacion */

@Module({
  imports:[],
  //imports: [
  //  TypeOrmModule.forFeature([
  //    User, 
  //    Role, 
  //    Ph
  //  ]), 
  //],
  controllers: [
    PhsController, 
    UsersController, 
    RolesController
  ],
  providers: [  
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