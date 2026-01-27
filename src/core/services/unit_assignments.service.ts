import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateAssingmentUnitDto } from "../dtos/payload/unit_assignment-payload.dto";
import * as bcrypt from "bcrypt";
import { getRepositoryToken } from "@nestjs/typeorm";

import { I18nContext, I18nService } from "nestjs-i18n";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

@Injectable()
export class UnitAssignmentsService {
  constructor(
    private readonly i18n: I18nService,
    //@InjectRepository(User)
    //private readonly userRepository: Repository<User>,

    @Inject(getRepositoryToken(User))
    private readonly userRepository: Repository<User>
  ) {}

  async assingRol(id: string, createAssingmentUnitDto: CreateAssingmentUnitDto): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('unit_assignments.MSG_CREATE', {lang, args: {},}),
      data: createAssingmentUnitDto
    };
  }

  async getRolPerUserId(id: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('unit_assignments.MSG_GET', {lang, args: {},}),
      data: [ "admin", "supervisor"]
    };
  }

}
