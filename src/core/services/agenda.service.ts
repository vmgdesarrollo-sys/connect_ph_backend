import { Injectable, NotFoundException, Inject } from "@nestjs/common";
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Agenda } from "../entities/agenda.entity";
import { CreateRoleDto } from "../dtos/payload/agenda-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class AgendaService {
  constructor(
    private readonly i18n: I18nService,
    //@InjectRepository(Role)
    //private readonly roleRepository: Repository<Role>,
    @Inject(getRepositoryToken(Agenda))
    private readonly roleRepository: Repository<Agenda>
  ) {}

  async create(CreateRoleDto: CreateRoleDto): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('agendaMSG_CREATE', {lang, args: {},}),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...CreateRoleDto,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
  }

  async findAll(_fields?: string, _where?: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('agendaMSG_LIST', {lang, args: {},}),
      data: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "admin",
          description: "Descripción detallada de las funciones del rol",
          scopes: "admin/read",
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
  }

  async findOne(id: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('agendaMSG_GET', {lang, args: {},}),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "admin",
        description: "rol de administrador",
        scopes: "admin/read",
        is_active: true,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
  }

  async delete(id: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('agendaMSG_DELETE', {lang, args: {id},}),
    };
  }

  async update(id: string, CreateRoleDto: CreateRoleDto): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('agendaMSG_UPDATE', {lang, args: {id},}),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...CreateRoleDto,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
  }
}
