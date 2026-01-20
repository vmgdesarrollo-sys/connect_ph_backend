import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Unit } from "../entities/unit.entity";
import { CreateUnitDto } from "../dtos/payload/unit-payload.dto";
import { getRepositoryToken } from "@nestjs/typeorm";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class UnitsService {
  constructor(
    private readonly i18n: I18nService,
    //@InjectRepository(Ph)
    //private readonly phRepository: Repository<Ph>,

    @Inject(getRepositoryToken(Unit))
    private readonly phRepository: Repository<Unit>,
  ) {}

  async create(phs_id: string, createUnitDto: CreateUnitDto): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.REGISTER_CREATED", { lang, args: {} }),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...createUnitDto,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
  }
  async update(
    phs_id: string,
    id: string,
    createUnitDto: CreateUnitDto,
  ): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.REGISTER_UPDATED", { lang, args: {} }),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        ...createUnitDto,
        created_at: "2025-12-25T13:45:00Z",
        updated_at: "2025-12-25T13:45:00Z",
      },
    };
  }

  async findAll(
    phs_id: string,
    _fields?: string,
    _where?: string,
  ): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.MSG_LIST", { lang, args: {} }),
      data: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          block: "Boque 1",
          unit_number: "306",
          type: "Apartamento",
          coefficient: "30",
          floor: "Piso 1",
          area: "42",
          tax_responsible: "Carlos Gomez",
          tax_responsible_document_type: "CC",
          tax_responsible_document: "123456789",
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

  async findOne(phs_id: string, id: string): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.REGISTER_DETAILS", { lang, args: {} }),
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        block: "Boque 1",
        unit_number: "306",
        type: "Apartamento",
        coefficient: "30",
        floor: "Piso 1",
        area: "42",
        tax_responsible: "Carlos Gomez",
        tax_responsible_document_type: "CC",
        tax_responsible_document: "123456789",
        is_active: true,
        created_at: "2026-01-08 12:00:00",
      },
    };
  }

  async delete(phs_id: string, id: string): Promise<any> {
    return {
      status: this.i18n.t("general.SUCCESS", { lang, args: {} }),
      message: this.i18n.t("units.MSG_DELETE", { lang, args: { id, phs_id } }),
    };
  }
}
