import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { AssemblyAnnouncement } from "../entities/assembly_announcements.entity";
import { CreateAnnouncementDto } from "../dtos/payload/assembly_announcements-payload.dto";
import { I18nContext, I18nService } from "nestjs-i18n";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
// Servicio para gestionar los anuncios de asambleas
@Injectable()
export class AssemblyAnnouncementsService {
  constructor(
    private readonly i18n: I18nService,
    @InjectRepository(AssemblyAnnouncement)
    private readonly announcementRepository: Repository<AssemblyAnnouncement>,
  ) {}
// Crear un nuevo anuncio de asamblea
  async create(dto: CreateAnnouncementDto): Promise<any> {
    const newAnnouncement = this.announcementRepository.create(dto);
    const savedAnnouncement = await this.announcementRepository.save(newAnnouncement);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.CREAR_RES", { lang }),
      data: savedAnnouncement,
    };
  }
// Listar todos los anuncios de asambleas
  async findAll(_where?: string): Promise<any[]> {
    const announcements = await this.announcementRepository.find({
      order: { created_at: 'DESC' },
    });
    return announcements;
  }
// Actualizar un anuncio de asamblea por ID
  async update(id: string, dto: CreateAnnouncementDto): Promise<any> {
    const announcement = await this.announcementRepository.findOne({ where: { id } });
    
    if (!announcement) {
      throw new NotFoundException(
        this.i18n.t("assembly_announcements.NO_EXISTE", { lang, args: { id } }),
      );
    }

    Object.assign(announcement, dto);
    const updatedAnnouncement = await this.announcementRepository.save(announcement);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.ACTUALIZADA_RES", { lang }),
      data: updatedAnnouncement,
    };
  }
// Obtener detalle de un anuncio de asamblea por ID 
  async findOne(id: string): Promise<any> {
    const announcement = await this.announcementRepository.findOne({ where: { id } });

    if (!announcement) {
      throw new NotFoundException(
        this.i18n.t("assembly_announcements.NO_EXISTE", { lang, args: { id } }),
      );
    }

    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.DETALLE_RES", { lang }),
      data: announcement,
    };
  }
// Obtener detalle de un anuncio de asamblea por ID
  async delete(id: string): Promise<any> {
    const announcement = await this.announcementRepository.findOne({ where: { id } });
    
    if (!announcement) {
      throw new NotFoundException(
        this.i18n.t("assembly_announcements.NO_EXISTE", { lang, args: { id } }),
      );
    }

    await this.announcementRepository.remove(announcement);
    
    return {
      status: this.i18n.t("general.SUCCESS", { lang }),
      message: this.i18n.t("assembly_announcements.ELIMINADA_RES", { lang, args: { id } }),
    };
  }
}