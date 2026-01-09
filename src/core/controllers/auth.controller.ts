import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth
} from "@nestjs/swagger";
import { AuthService } from "../services/auth/auth.service";
import { ApiClientGuard } from "../services/auth/guards/api-client.guard";

import { I18nContext, I18nService } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

@ApiTags(getSwaggerText('auth', 'TITLE', lang))
@Controller("api/v1/auth")
// Aplicamos los headers requeridos para todo el controlador
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("options")
  @UseGuards(ApiClientGuard)
  @ApiHeader({
    name: "client-id",
    description: getSwaggerText('auth', 'ID_CLIENT_APP', lang),
    required: true,
  })
  @ApiHeader({
    name: "client-secret",
    description: getSwaggerText('auth', 'SECRET_APP', lang),
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: getSwaggerText('auth', 'LIST_PROVIDER', lang),
    schema: {
      example: {
        state: "success",
        result: {
          providers: [
            {
              providerName: "accessEmail",
              label: getSwaggerText('auth', 'START_WITH_EMAIL', lang),
              description: "",
              iconUrl: "",
            },
          ],
        },
      },
    },
  })
  getOptions() {
    return this.authService.getOptions();
  }

  @Post("select")
  @UseGuards(ApiClientGuard)
  @ApiHeader({
    name: "client-id",
    description: getSwaggerText('auth', 'ID_CLIENT_APP', lang),
    required: true,
  })
  @ApiHeader({
    name: "client-secret",
    description: getSwaggerText('auth', 'SECRET_APP', lang),
    required: true,
  })
  @ApiOperation({ summary: getSwaggerText('auth', 'SELECTED_PROVIDER', lang) })
  @ApiBody({
    schema: {
      example: { providerName: getSwaggerText('auth', 'PROVIDER_DEFAULT', lang) },
    },
  })
  @ApiResponse({
    status: 201,
    description: getSwaggerText('auth', 'TOKEN_TEMP', lang),
    schema: {
      example: {
        state: getSwaggerText('general', 'SUCCESS', lang),
        result: {
          fields: {
            email: { description: getSwaggerText('auth', 'EMAIL_CLIENT', lang), type: "text" },
            password: { description: getSwaggerText('auth', 'PASS_CLIENT', lang), type: "password" },
          },
          authorization: { token: "eyJhbGci...", expires_in: 3600, token_type: "Bearer" },
        },
      },
    },
  })
  selectProvider(@Body() body: { providerName: string }) {
    return this.authService.selectProvider(body.providerName);
  }

  @Post("validate")
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: getSwaggerText('auth', 'VALID_CREDENTIALS_STEP_PREV', lang),
    description: getSwaggerText('auth', 'FIELDS_BEARER_TOKEN', lang),
  })
  // Documentamos los campos dinámicos en el Body
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        fields: {
          type: "object",
          example: { email: "usuario@correo.com", password: "myPassword123" },
          description: getSwaggerText('auth', 'VALUES_PREV_TEXT', lang),
        },
      },
    },
  })
  // La respuesta exitosa que solicitaste
  @ApiResponse({
    status: 200,
    description: getSwaggerText('auth', 'AUTH_SUCCESS_END', lang),
    schema: {
      example: {
        state: getSwaggerText('general', 'SUCCESS', lang),
        result: {
          access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          expires_in: 3600,
          token_type: "Bearer",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: getSwaggerText('general', 'ERROR_TOKEN_AUTH_INVALID', lang),
  })
  async validateStep(
    @Headers("authorization") authHeader: string,
    @Body() body: { token: string; fields: any }
  ) {
    console.log('authHeader',authHeader );
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException(getSwaggerText('general', 'ERROR_TOKEN_AUTH', lang));
    }
    return await this.authService.validateStep(token, body.fields);
  }
}
