import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../utils/auth.guard';
import { AuthErrorDto } from '../dtos/general.dto';
import { UserRolesPhsService } from '../services/user_roles_phs.service';
import { CreateUserRolePhDto } from '../dtos/payload/user_roles_phs-payload.dto';
import {
  CreateUserRolePhResponseDto,
  CreateUserRolePhResponseErrorDto,
  GetUserRolePhResponseDto
} from '../dtos/responses/user_roles_phs-response.dto';

import { I18nContext } from 'nestjs-i18n';
import { getSwaggerText } from '../../utils/swagger-i18n.loader';
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

const t = (key: string) => getSwaggerText('user_roles_phs', key, lang);
const g = (key: string) => getSwaggerText('general', key, lang);

@UseGuards(AuthGuard)
@ApiTags(t('TITLE'))
@ApiBearerAuth('access-token')
@Controller('user_roles_phs')
@ApiResponse({ status: 403, description: g('AUTH_ERROR'), type: AuthErrorDto })
@ApiResponse({ status: 401, description: g('DATA_ERROR'), type: CreateUserRolePhResponseErrorDto })
export class UserRolesPhsController {
  constructor(private readonly userRolesPhsService: UserRolesPhsService) {}

  @Post('assign/:userRoleId')
  @ApiOperation({ summary: t('REGISTER_SUMMARY') })
  @ApiParam({ name: 'userRoleId', description: t('PARAM_USERROLEID'), example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 201, description: t('REGISTER_DESC'), type: CreateUserRolePhResponseDto })
  async assignPhs(
    @Param('userRoleId', ParseUUIDPipe) userRoleId: string,
    @Body() dto: CreateUserRolePhDto
  ) {
    return await this.userRolesPhsService.assignPhs(userRoleId, dto);
  }

  @Get(':userRoleId')
  @ApiOperation({ summary: t('GET_DETAIL_SUMMARY') })
  @ApiParam({ name: 'userRoleId', description: t('PARAM_USERROLEID'), example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: t('GET_DETAIL_DESC'), type: GetUserRolePhResponseDto })
  async getByUserRole(@Param('userRoleId', ParseUUIDPipe) userRoleId: string) {
    return await this.userRolesPhsService.getPhsByUserRole(userRoleId);
  }
}
