import {
  Injectable,
  ConflictException,
  NotFoundException,
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
  // Listar todas las asambleas activas
  async findAll(_fields?: string, _where?: string): Promise<any[]> {
    const assemblies = await this.assemblyRepository.find({ where: { is_active: true } });
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