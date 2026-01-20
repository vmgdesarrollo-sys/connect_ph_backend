import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserRolDto } from "../dtos/payload/user_rol-payload.dto";
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

  async assingRol(id: string, createUserRolDto: CreateUserRolDto): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('user_roles.MSG_CREATE', {lang, args: {},}),
      data: createUserRolDto
    };
  }

  async getRolPerUserId(id: string): Promise<any> {
    return {
      status: this.i18n.t('general.SUCCESS', {lang, args: {},}),
      message: this.i18n.t('user_roles.MSG_GET', {lang, args: {},}),
      data: [ "admin", "supervisor"]
    };
  }

}
