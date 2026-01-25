import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entidades (Asegúrate de importar todas las del Excel para esta etapa)
import { User } from './entities/user.entity';
import { UserRol } from './entities/user_rol.entity';
import { Role } from './entities/role.entity';
import { Ph } from './entities/ph.entity';
import { Unit } from './entities/unit.entity';
import { UnitAssignment } from './entities/unit_assignment.entity';
import { Agenda } from './entities/agenda.entity';
import { Assembly } from './entities/assemblies.entity';
import { AssemblyAnnouncement } from './entities/assembly_announcements.entity';
import { AssemblyAttendance } from './entities/assembly_attendances.entity';
import { QaEntry } from './entities/qa_entries.entity';

// Controladores
import { UsersController } from './controllers/users.controller';
import { UserRolesController } from './controllers/user_roles.controller';
import { RolesController } from './controllers/roles.controller';
import { PhsController } from './controllers/phs.controller';
import { UnitsController } from './controllers/units.controller';
import { UnitAssignmentsController } from './controllers/unit_assignments.controller';
import { AgendaController } from './controllers/agenda.controller';
import { AssembliesController } from './controllers/assemblies.controller';
import { AssemblyAnnouncementsController } from './controllers/assembly_announcements.controller';
import { AssemblyAttendancesController } from './controllers/assembly_attendances.controller';
import { QaEntriesController } from './controllers/qa_entries.controller';
import { QuestionsOptionsController } from './controllers/questions_options.controller';
import { VotesController } from './controllers/votes.controller';
import { VotingQuestionsController } from './controllers/voting_questions.controller';

// Servicios
import { UsersService } from './services/users.service';
import { UserRolesService } from './services/user_roles.service';
import { RolesService } from './services/roles.service';
import { PhsService } from './services/phs.service';
import { UnitsService } from './services/units.service';
import { UnitAssignmentsService } from './services/unit_assignments.service';
import { AgendaService } from './services/agenda.service';
import { AssembliesService } from './services/assemblies.service';
import { AssemblyAnnouncementsService } from './services/assembly_announcements.service';
import { AssemblyAttendancesService } from './services/assembly_attendances.service';
import { QaEntriesService } from './services/qa_entries.service';
import { QuestionsOptionsService } from './services/questions_options.service';
import { VotesService } from './services/votes.service';
import { VotingQuestionsService } from './services/voting_questions.service';

import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth/auth.service';

/**
 * Borrarme porque soy simulacion
 */
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
    UnitsController,
    UnitAssignmentsController, 
    AgendaController,
    AssembliesController,
    AssemblyAnnouncementsController,
    AssemblyAttendancesController,
    QaEntriesController,
    QuestionsOptionsController,
    VotesController,
    VotingQuestionsController,

  ],
  providers: [  
    AuthService,
    PhsService, 
    UsersService, 
    RolesService,
    UserRolesService,
    UnitsService,
    UnitAssignmentsService, 
    AgendaService,
    AssembliesService,
    AssemblyAnnouncementsService,
    AssemblyAttendancesService,
    QaEntriesService,
    QuestionsOptionsService,
    VotesService,
    VotingQuestionsService,


    // Proveedores falsos para que no pida DataSource
    { provide: getRepositoryToken(User), useValue: mockRepository },
    { provide: getRepositoryToken(Role), useValue: mockRepository },
    { provide: getRepositoryToken(Ph), useValue: mockRepository },
    { provide: getRepositoryToken(UserRol), useValue: mockRepository },
    { provide: getRepositoryToken(Unit), useValue: mockRepository },
    { provide: getRepositoryToken(UnitAssignment), useValue: mockRepository },
    { provide: getRepositoryToken(Agenda), useValue: mockRepository },
    { provide: getRepositoryToken(Assembly), useValue: mockRepository },
    { provide: getRepositoryToken(AssemblyAnnouncement), useValue: mockRepository },
    { provide: getRepositoryToken(AssemblyAttendance), useValue: mockRepository },
    { provide: getRepositoryToken(QaEntry), useValue: mockRepository },
  ],
  //exports: [
    //UsersService, 
    //PhsService, 
    //TypeOrmModule
  //],
})
export class CoreModule {}