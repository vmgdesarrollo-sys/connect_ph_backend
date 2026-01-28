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
import { UsersService } from "../services/users.service";
import { CreateUserDto } from "../dtos/payload/user-payload.dto";
import { AuthGuard } from "../utils/auth.guard";
import { AuthErrorDto } from "../dtos/general.dto";

import {
  CreateUserResponseErrorDto,
  CreateUserResponseDto,
  UpdateUserResponseDto,
  UsersListResponseDto,
  GetUserResponseDto,
  DeleteUserResponseDto,
} from "../dtos/responses/user-response.dto";

import { I18nContext, I18nService } from "nestjs-i18n";
import { getSwaggerText } from "../../utils/swagger-i18n.loader";
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? "es";

const t = (key: string) => getSwaggerText("users", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);

@UseGuards(AuthGuard)
@ApiTags(t("TITLE"))
@ApiBearerAuth("access-token")
@Controller("users")
@ApiResponse({ status: 403, description: g("AUTH_ERROR"), type: AuthErrorDto })
@ApiResponse({
  status: 401,
  description: g("DATA_ERROR"),
  type: CreateUserResponseErrorDto,
})
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: t("REGISTER_SUMMARY") })
  @ApiResponse({
    status: 201,
    description: t("REGISTER_DESC"),
    type: CreateUserResponseDto,
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Put(":id")
  @ApiOperation({ summary: t("UPDATE_SUMMARY") })
  @ApiParam({
    name: "id",
    description: t("PARAM_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: t("UPDATE_DESC"),
    type: UpdateUserResponseDto,
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() createUserDto: CreateUserDto
  ) {
    return await this.usersService.update(id, createUserDto);
  }

  @Get()
  @ApiOperation({ summary: t("LIST_SUMMARY") })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  @ApiQuery({
    name: "_fields",
    required: false,
    description: t("QUERY_FIELDS"),
  })
  @ApiQuery({ name: "_where", required: false, description: t("QUERY_WHERE") })
  @ApiResponse({
    status: 200,
    description: t("LIST_DESC"),
    type: UsersListResponseDto,
  })
  async findAll(
    @Query("_fields") _fields?: string,
    @Query("_where") _where?: string
  ) {
    return await this.usersService.findAll(_fields, _where);
  }

  @Get("id/:id")
  @ApiOperation({ summary: t("GET_DETAIL_SUMMARY") })
  @ApiParam({
    name: "id",
    description: t("PARAM_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: t("GET_DETAIL_DESC"),
    type: GetUserResponseDto,
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.usersService.findOne(id);
  }

  @Get("email/:email")
  @ApiOperation({ summary: t("GET_EMAIL_SUMMARY") })
  @ApiParam({
    name: "email",
    description: t("PARAM_EMAIL"),
    example: "usuario@ejemplo.com",
  })
  @ApiResponse({
    status: 200,
    description: t("GET_DETAIL_DESC"),
    type: GetUserResponseDto,
  })
  async findByEmail(@Param("email") email: string) {
    return await this.usersService.findByEmail(email);
  }

  @Delete(":id")
  @ApiOperation({ summary: t("DELETE_SUMMARY") })
  @ApiParam({
    name: "id",
    description: t("PARAM_ID"),
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: t("DELETE_DESC"),
    type: DeleteUserResponseDto,
  })
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.usersService.delete(id);
  }
}
