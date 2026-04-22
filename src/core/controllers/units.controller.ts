import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
  Put,
  Query,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { UnitsService } from "../services/units.service";
import { CreateUnitDto } from "../dtos/payload/unit-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { AuthErrorDto } from "../dtos/general.dto";

import {
  CreateUnitResponseErrorDto,
  CreateUnitResponseDto,
  UpdateUnitResponseDto,
  UnitsListResponseDto,
  GetUnitResponseDto,
  DeleteUnitResponseDto
} from "../dtos/responses/unit-response.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";
const KEY_JWT = process.env.JWT_SECRET || "CLAVE_SECRETA_PROVISIONAL";

const t = (key: string) => getSwaggerText("units", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);

@UseGuards(AuthGuard)
@ApiTags(t("TITLE"))
@ApiBearerAuth("access-token")
@Controller("units")
@ApiResponse({ status: 403, description: g("AUTH_ERROR"), type: AuthErrorDto })
@ApiResponse({
  status: 401,
  description: g("DATA_ERROR"),
  type: CreateUnitResponseErrorDto,
})
export class UnitsController {
  constructor(
    private readonly unitsService: UnitsService
  ) {}

  @Post("/register/:phs_id")
  @ApiOperation({ summary: t("REGISTER_SUMMARY") })
  @ApiParam({
    name: "phs_id",
    description: t("PARAM_PHS_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 201,
    description: t("REGISTER_DESC"),
    type: CreateUnitResponseDto,
  })
  async register(@Param("phs_id", ParseUUIDPipe) phs_id: string, @Body() createUnitDto: CreateUnitDto) {
    return await this.unitsService.create(phs_id, createUnitDto);
  }

  @Put("/:phs_id/:id")
  @ApiOperation({ summary: t("UPDATE_SUMMARY") })
  @ApiParam({
    name: "phs_id",
    description: t("PARAM_PHS_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiParam({
    name: "id",
    description: t("PARAM_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: t("UPDATE_DESC"),
    type: UpdateUnitResponseDto,
  })
  async update(
    @Param("phs_id", ParseUUIDPipe) phs_id: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() createUserDto: CreateUnitDto
  ) {
    return await this.unitsService.update(phs_id, id, createUserDto);
  }

  @Get("list/:phs_id")
  @ApiParam({
    name: "phs_id",
    description: t("PARAM_PHS_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiOperation({ summary: t("LIST_SUMMARY") })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  @ApiQuery({
    name: "_fields",
    required: false,
    description: g("QUERY_FIELDS"),
  })
  @ApiQuery({ name: "_where", required: false, description: g("QUERY_WHERE") })
  @ApiResponse({
    status: 200,
    description: t("LIST_DESC"),
    type: UnitsListResponseDto,
  })
  async findAll(
    @Param("phs_id", ParseUUIDPipe) phs_id: string,
    @Query("_fields") _fields?: string,
    @Query("_where") _where?: string
  ) {
    return await this.unitsService.findAll(phs_id, _fields, _where);
  }

  @Get("get/:phs_id/:id")
  @ApiOperation({ summary: t("GET_DETAIL_SUMMARY") })
  @ApiParam({
    name: "phs_id",
    description: t("PARAM_PHS_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiParam({
    name: "id",
    description: t("PARAM_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: t("GET_DETAIL_DESC"),
    type: GetUnitResponseDto,
  })
  async findOne(@Param("phs_id", ParseUUIDPipe) phs_id: string, @Param("id", ParseUUIDPipe) id: string) {
    return await this.unitsService.findOne(phs_id, id);
  }

  @Delete("/:phs_id/:id")
  @ApiOperation({ summary: t("DELETE_SUMMARY") })
  @ApiParam({
    name: "phs_id",
    description: t("PARAM_PHS_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiParam({
    name: "id",
    description: t("PARAM_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: t("DELETE_DESC"),
    type: DeleteUnitResponseDto,
  })
  async delete(@Param("phs_id", ParseUUIDPipe) phs_id: string, @Param("id", ParseUUIDPipe) id: string) {
    return await this.unitsService.delete(phs_id, id);
  }
}
