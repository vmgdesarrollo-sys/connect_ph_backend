import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Assembly } from "../entities/assemblies.entity";
import { CreateAssemblyDto } from "../dtos/payload/assemblies-payload.dto";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class AssembliesService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(Assembly)
    private readonly assemblyRepository: Repository<Assembly>,
  ) {}
 // Crear una nueva asamblea
  async create(createAssemblyDto: CreateAssemblyDto): Promise<any> {
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
  // Eliminar una asamblea por ID (soft delete)
  async delete(id: string): Promise<any> {
    const assembly = await this.assemblyRepository.findOne({ where: { id, is_active: true } });
    
    if (!assembly) {
      throw new NotFoundException(
        this.i18n.t("assemblies.ERRORS.NO_EXISTE", { lang, args: { id } }),
      );
    }

    assembly.is_active = false;
    await this.assemblyRepository.save(assembly);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assemblies.ELIMINADA_RES", { lang, args: { id } }),
    };
  }
}