import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AgendaService } from "../services/agenda.service";
import { CreateRoleDto } from "../dtos/payload/agenda-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { AuthErrorDto } from "../dtos/general.dto";
import {
  CreateRolResponseErrorDto,
  CreateRolResponseDto,
  UpdateRolResponseDto,
  RolesListResponseDto,
  GetRolResponseDto,
  DeleteRolResponseDto
} from "../dtos/responses/agenda-response.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";

const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const t = (key: string) => getSwaggerText("agenda", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);

@UseGuards(AuthGuard)
@ApiTags(t("TITLE"))
@ApiBearerAuth("access-token")
@Controller("agenda")
@ApiResponse({ status: 403, description: g("AUTH_ERROR"), type: AuthErrorDto })
@ApiResponse({ status: 401, description: g("DATA_ERROR"), type: CreateRolResponseErrorDto })
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @ApiOperation({ summary: t("CREATE_SUMMARY") })
  @ApiResponse({ status: 201, description: t("CREATE_DESC"), type: CreateRolResponseDto })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.agendaService.create(createRoleDto);
  }

  @Put(":id")
  @ApiOperation({ summary: t("UPDATE_SUMMARY") })
  @ApiParam({ name: "id", description: t("PARAM_ID"), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiResponse({ status: 200, description: t("UPDATE_DESC"), type: UpdateRolResponseDto })
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() createRoleDto: CreateRoleDto) {
    return await this.agendaService.update(id, createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: t("LIST_SUMMARY") })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  @ApiQuery({ name: "_fields", required: false, description: t("QUERY_FIELDS") })
  @ApiQuery({ name: "_where", required: false, description: t("QUERY_WHERE") })
  @ApiResponse({ status: 200, description: t("LIST_DESC"), type: RolesListResponseDto })
  async findAll(@Query("_fields") _fields?: string, @Query("_where") _where?: string) {
    return await this.agendaService.findAll(_fields, _where);
  }

  @Get(":id")
  @ApiOperation({ summary: t("GET_DETAIL_SUMMARY") })
  @ApiParam({ name: "id", description: t("PARAM_ID"), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiResponse({ status: 200, description: t("GET_DETAIL_DESC"), type: GetRolResponseDto })
  async getRegister(@Param("id", ParseUUIDPipe) id: string) {
    return await this.agendaService.findOne(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: t("DELETE_SUMMARY") })
  @ApiParam({ name: "id", description: t("PARAM_ID"), example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiResponse({ status: 200, description: t("DELETE_DESC"), type: DeleteRolResponseDto })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.agendaService.delete(id);
  }
}