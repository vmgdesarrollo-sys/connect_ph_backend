import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, Delete, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UnitAssignmentsService } from '../services/unit_assignments.service';
import { CreateAssingmentUnitDto } from '../dtos/payload/unit_assignment-payload.dto';
import { AuthGuard } from '../utils/auth.guard';
import { AuthErrorDto } from "../dtos/general.dto";

import {
  CreateUserUnitResponseDto,
  GetUserUnitResponseDto,
  CreateUserUnitResponseErrorDto
} from "../dtos/responses/unit_assignment-response.dto";

import { I18nContext, I18nService } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

const t = (key: string) => getSwaggerText("unit_assignments", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);

@UseGuards(AuthGuard)
@ApiTags(t("TITLE"))
@ApiBearerAuth("access-token")
@Controller("unit_assignments")
@ApiResponse({ status: 403, description: g("AUTH_ERROR"), type: AuthErrorDto })
@ApiResponse({ status: 401, description: g("DATA_ERROR"), type: CreateUserUnitResponseErrorDto })
export class UnitAssignmentsController {
  constructor(private readonly unitAssignmentsService: UnitAssignmentsService) {}

  @Post('assing/:userRolId')
  @ApiOperation({ summary: t("REGISTER_SUMMARY") })
  @ApiParam({ name: "userRolId", description: t("PARAM_USERID"), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiResponse({ status: 201, description: t("REGISTER_DESC"), type: CreateUserUnitResponseDto })
  async assingRol(@Param("userRolId", ParseUUIDPipe) id: string, @Body() createAssingmentUnitDto: CreateAssingmentUnitDto) {
    return await this.unitAssignmentsService.assingRol(id, createAssingmentUnitDto); 
  }

  @Get(':userRolId')
  @ApiOperation({ summary: t("GET_DETAIL_SUMMARY") })
  @ApiParam({ name: "userRolId", description: t("PARAM_USERID"), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiResponse({ status: 200, description: t("GET_DETAIL_DESC"), type: GetUserUnitResponseDto })
  async findOne(@Param('userRolId', ParseUUIDPipe) id: string) {
    return await this.unitAssignmentsService.getRolPerUserId(id);
  }
}