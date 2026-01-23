import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, Delete, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { QaEntriesService } from '../services/qa_entries.service';
import { CreateUserRolDto } from '../dtos/payload/qa_entries-payload.dto';
import { AuthGuard } from '../utils/auth.guard';
import { AuthErrorDto } from "../dtos/general.dto";

import {
  CreateUserRolResponseDto,
  GetUserRolResponseDto,
  CreateUserRolResponseErrorDto
} from "../dtos/responses/qa_entries-response.dto";

import { I18nContext, I18nService } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

const t = (key: string) => getSwaggerText("qa_entries", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);

@UseGuards(AuthGuard)
@ApiTags(t("TITLE"))
@ApiBearerAuth("access-token")
@Controller("qa_entries")
@ApiResponse({ status: 403, description: g("AUTH_ERROR"), type: AuthErrorDto })
@ApiResponse({ status: 401, description: g("DATA_ERROR"), type: CreateUserRolResponseErrorDto })
export class QaEntriesController {
  constructor(private readonly userRolesService: QaEntriesService) {}

  @Post('assing/:userId')
  @ApiOperation({ summary: t("REGISTER_SUMMARY") })
  @ApiParam({ name: "userId", description: t("PARAM_USERID"), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiResponse({ status: 201, description: t("REGISTER_DESC"), type: CreateUserRolResponseDto })
  async assingRol(@Param("userId", ParseUUIDPipe) id: string, @Body() createUserRolDto: CreateUserRolDto) {
    return await this.userRolesService.assingRol(id, createUserRolDto); 
  }

  @Get(':userId')
  @ApiOperation({ summary: t("GET_DETAIL_SUMMARY") })
  @ApiParam({ name: "userId", description: t("PARAM_USERID"), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiResponse({ status: 200, description: t("GET_DETAIL_DESC"), type: GetUserRolResponseDto })
  async findOne(@Param('userId', ParseUUIDPipe) id: string) {
    return await this.userRolesService.getRolPerUserId(id);
  }
}