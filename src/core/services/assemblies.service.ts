import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Assembly } from "../entities/assemblies.entity";
import { AssemblyAttendance } from "../entities/assembly_attendances.entity";
import { UnitAssignment } from "../entities/unit_assignment.entity";
import { Unit } from "../entities/unit.entity";
import { CreateAssemblyDto } from "../dtos/payload/assemblies-payload.dto";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class AssembliesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Assembly)
    private readonly assemblyRepository: Repository<Assembly>,
    @InjectRepository(AssemblyAttendance)
    private readonly attendanceRepository: Repository<AssemblyAttendance>,
    @InjectRepository(UnitAssignment)
    private readonly unitAssignmentRepository: Repository<UnitAssignment>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
  ) {}
 // Crear una nueva asamblea
  async create(createAssemblyDto: CreateAssemblyDto): Promise<any> {
    // Auto-generar livekit_room_name basado en el nombre de la asamblea + timestamp
    const timestamp = Date.now();
    const sanitizedName = createAssemblyDto.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    createAssemblyDto['livekit_room_name'] = `${sanitizedName}_${timestamp}`;

    const newAssembly = this.assemblyRepository.create(createAssemblyDto);
    const savedAssembly = await this.assemblyRepository.save(newAssembly);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.CREAR_RES", { lang }),
      data: savedAssembly,
    };
  }
  // Actualizar una asamblea por ID
  async update(id: string, updateDto: CreateAssemblyDto): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ where: { id, is_active: true } });
    
    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id } }),
      );
    }
    //Actualizar la asamblea
    Object.assign(assembly, updateDto);
    const updatedAssembly = await this.assemblyRepository.save(assembly);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.ACTUALIZADA_RES", { lang }),
      data: updatedAssembly,
    };
  }

  // Listar asambleas activas, con opción de filtrar por phs_id
  async findAll(params?:  { phs_id?: string; page?: number; limit?: number } ): Promise<Assembly[]> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const where: any = {
      is_active: true,
    };

    // Filtro por conjunto (phs_id)
    if (params?.phs_id) {
      if (!UUID_REGEX.test(params.phs_id)) {
        throw new BadRequestException('phs_id debe ser un UUID válido');
      }
      where.phs_id = params.phs_id;
    }

    const assemblies = await this.assemblyRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    return assemblies;
  }

  // Obtener asambleas por ID de PH (copropiedad)
  async findByPh(phsId: string): Promise<any[]> {
    const assemblies = await this.assemblyRepository.find({
      where: { phs_id: phsId, is_active: true },
      order: { scheduled_at: 'DESC' },
    });
    return assemblies;
  }
 // Obtener detalle de una asamblea por ID
  async findOne(id: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ where: { id, is_active: true } });

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.DETALLE_RES", { lang }),
      data: assembly,
    };
  }

  // Obtener detalle de una asamblea por livekit_room_name
  async findByLivekitRoomName(roomName: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ 
      where: { livekit_room_name: roomName, is_active: true } 
    });

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS_NO_EXISTE_POR_ROOM", { lang, args: { roomName } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.DETALLE_RES", { lang }),
      data: assembly,
    };
  }
  // Eliminar una asamblea por ID (soft delete)
  async delete(id: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ where: { id, is_active: true } });
    
    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS_NO_EXISTE", { lang, args: { id } }),
      );
    }

    assembly.is_active = false;
    await this.assemblyRepository.save(assembly);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.ELIMINADA_RES", { lang, args: { id } }),
    };
  }

  // Obtener citados (usuarios con derecho a voto en la asamblea)
  async getCited(assemblyId: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ 
      where: { id: assemblyId, is_active: true },
      relations: ['ph']
    });

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id: assemblyId } }),
      );
    }

    // Obtener todos los unit assignments con can_vote = true para el PH
    const citedAssignments = await this.unitAssignmentRepository
      .createQueryBuilder('ua')
      .innerJoin('ua.unit', 'u')
      .innerJoin('ua.user', 'user')
      .where('u.phs_id = :phsId', { phsId: assembly.phs_id })
      .andWhere('ua.can_vote = :canVote', { canVote: true })
      .andWhere('ua.is_active = :isActive', { isActive: true })
      .andWhere('u.is_active = :unitActive', { unitActive: true })
      .andWhere('user.is_active = :userActive', { userActive: true })
      .select([
        'ua.id',
        'user.id as userId',
        'user.email',
        'user.first_name',
        'user.last_name',
        'u.id as unitId',
        'u.unit_number',
        'u.block',
        'u.coefficient',
        'ua.is_main_resident'
      ])
      .getRawMany();

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.CITADOS_RES", { lang }),
      data: citedAssignments,
      properties: {
        total_citados: citedAssignments.length,
      },
    };
  }

  // Obtener asistentes (usuarios que asistieron a la asamblea)
  async getAttendees(assemblyId: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ 
      where: { id: assemblyId, is_active: true },
    });

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id: assemblyId } }),
      );
    }

    const attendances = await this.attendanceRepository.find({
      where: { assemblies_id: assemblyId },
      relations: ['unitAssignment', 'unitAssignment.user', 'unitAssignment.unit'],
    });

    const attendees = attendances.map(attendance => ({
      id: attendance.id,
      userId: attendance.unitAssignment?.user?.id,
      email: attendance.unitAssignment?.user?.email,
      firstName: attendance.unitAssignment?.user?.first_name,
      lastName: attendance.unitAssignment?.user?.last_name,
      unitId: attendance.unitAssignment?.unit?.id,
      unitNumber: attendance.unitAssignment?.unit?.unit_number,
      block: attendance.unitAssignment?.unit?.block,
      coefficient: attendance.unitAssignment?.unit?.coefficient,
      isPresent: attendance.is_present,
      arrivalAt: attendance.arrival_at,
      departureAt: attendance.departure_at,
      notes: attendance.notes,
    }));

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.ASISTENTES_RES", { lang }),
      data: attendees,
      properties: {
        total_asistentes: attendees.length,
      },
    };
  }

  // Obtener ausentes (usuarios citados que no asistieron)
  async getAbsences(assemblyId: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ 
      where: { id: assemblyId, is_active: true },
      relations: ['ph']
    });

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id: assemblyId } }),
      );
    }

    // Obtener todos los unit assignments con can_vote = true para el PH
    const citedAssignments = await this.unitAssignmentRepository
      .createQueryBuilder('ua')
      .innerJoin('ua.unit', 'u')
      .innerJoin('ua.user', 'user')
      .where('u.phs_id = :phsId', { phsId: assembly.phs_id })
      .andWhere('ua.can_vote = :canVote', { canVote: true })
      .andWhere('ua.is_active = :isActive', { isActive: true })
      .andWhere('u.is_active = :unitActive', { unitActive: true })
      .andWhere('user.is_active = :userActive', { userActive: true })
      .select(['ua.id', 'user.id as userId', 'user.email', 'user.first_name', 'user.last_name', 'u.id as unitId', 'u.unit_number', 'u.block', 'u.coefficient'])
      .getRawMany();

    const citedUserIds = citedAssignments.map(a => a.userId);

    // Obtener los IDs de usuarios que asistieron
    const attendances = await this.attendanceRepository.find({
      where: { assemblies_id: assemblyId, is_present: true },
      relations: ['unitAssignment', 'unitAssignment.user'],
    });

    const attendedUserIds = attendances
      .map(a => a.unitAssignment?.user?.id)
      .filter(id => id !== undefined);

    // Calcular ausentes (citados que no asistieron)
    const absences = citedAssignments.filter(c => !attendedUserIds.includes(c.userId));

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.AUSENTES_RES", { lang }),
      data: absences,
      properties: {
        total_ausentes: absences.length,
        total_citados: citedAssignments.length,
      },
    };
  }

  // Obtener coeficiente (suma de coeficientes de unidades asistentes)
  async getCoefficient(assemblyId: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ 
      where: { id: assemblyId, is_active: true },
    });

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id: assemblyId } }),
      );
    }

    // Obtener asistentes con sus coeficientes
    const attendances = await this.attendanceRepository
      .createQueryBuilder('a')
      .innerJoin('a.unitAssignment', 'ua')
      .innerJoin('ua.unit', 'u')
      .where('a.assemblies_id = :assemblyId', { assemblyId })
      .andWhere('a.is_present = :isPresent', { isPresent: true })
      .select('u.coefficient', 'coefficient')
      .getRawMany();

    const totalCoefficient = attendances.reduce((sum, a) => sum + parseFloat(a.coefficient || '0'), 0);

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.COEFICIENTE_RES", { lang }),
      data: {
        total_coefficient: totalCoefficient,
        unit_count: attendances.length,
      },
    };
  }

  // Obtener quorum (porcentaje de asistencia vs requerido)
  async getQuorum(assemblyId: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ 
      where: { id: assemblyId, is_active: true },
      relations: ['ph']
    });

    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id: assemblyId } }),
      );
    }

    // Obtener el coeficiente total del PH
    const totalPhCoefficient = await this.unitRepository
      .createQueryBuilder('u')
      .innerJoin('u.ph', 'ph')
      .where('ph.id = :phsId', { phsId: assembly.phs_id })
      .andWhere('u.is_active = :isActive', { isActive: true })
      .select('SUM(u.coefficient)', 'total')
      .getRawOne();

    const phTotalCoefficient = parseFloat(totalPhCoefficient?.total || '0');

    // Obtener coeficiente de asistentes
    const attendances = await this.attendanceRepository
      .createQueryBuilder('a')
      .innerJoin('a.unitAssignment', 'ua')
      .innerJoin('ua.unit', 'u')
      .where('a.assemblies_id = :assemblyId', { assemblyId })
      .andWhere('a.is_present = :isPresent', { isPresent: true })
      .select('u.coefficient', 'coefficient')
      .getRawMany();

    const attendedCoefficient = attendances.reduce((sum, a) => sum + parseFloat(a.coefficient || '0'), 0);

    // Calcular quorum
    const requiredQuorum = assembly.quorum_requirement || 0;
    const quorumPercentage = phTotalCoefficient > 0 
      ? (attendedCoefficient / phTotalCoefficient) * 100 
      : 0;
    
    const hasQuorum = quorumPercentage >= requiredQuorum;

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.QUORUM_RES", { lang }),
      data: {
        required_quorum: requiredQuorum,
        current_quorum: parseFloat(quorumPercentage.toFixed(2)),
        has_quorum: hasQuorum,
        attended_coefficient: attendedCoefficient,
        total_ph_coefficient: phTotalCoefficient,
        attendees_count: attendances.length,
      },
    };
  }
}