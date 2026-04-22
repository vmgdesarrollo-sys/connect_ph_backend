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
import { RefreshTokenDto } from "../dtos/payload/auth-refresh.dto";
import { SetPasswordDto } from "../dtos/payload/auth-set-password.dto";
import { ResetPasswordRequestDto } from "../dtos/payload/auth-reset-password.dto";

import { I18nContext, I18nService } from 'nestjs-i18n';
import {getSwaggerText} from "../../utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
const t = (key: string) => getSwaggerText("users", key, lang);
const g = (key: string) => getSwaggerText("general", key, lang);

@ApiTags(getSwaggerText('auth', 'TITLE', lang))
@Controller("auth")
// Aplicamos los headers requeridos para todo el controlador
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

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
          example: { email: "adancarrillo@gmail.com", password: "12345678" },
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
    
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException(getSwaggerText('general', 'ERROR_TOKEN_AUTH', lang));
    }
    return await this.authService.validateStep(token, body.fields);
  }

  @Post('refresh')
  @ApiOperation({ summary: getSwaggerText('auth', 'REFRESH_SUMMARY', lang) })
  @ApiResponse({
    status: 200,
    description: getSwaggerText('auth', 'REFRESH_DESC', lang),
    schema: {
      example: {
        state: getSwaggerText('general', 'SUCCESS', lang),
        result: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expires_in: 3600,
          token_type: 'Bearer',
          refresh_token: 'd2f7b8...',
          refresh_expires_in: 604800,
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: getSwaggerText('general', 'ERROR_TOKEN_AUTH_INVALID', lang),
  })
  async refresh(@Body() body: RefreshTokenDto, @Headers() headers: Record<string, string>) {
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'];
    const userAgent = headers['user-agent'];
    const result = await this.authService.refreshAccessToken(body.refresh_token, ip, userAgent);
    return {
      state: getSwaggerText('general', 'SUCCESS', lang),
      result,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: getSwaggerText('auth', 'LOGOUT_SUMMARY', lang) })
  @ApiResponse({
    status: 200,
    description: getSwaggerText('auth', 'LOGOUT_DESC', lang),
    schema: {
      example: {
        state: getSwaggerText('general', 'SUCCESS', lang),
        result: {
          message: getSwaggerText('auth', 'LOGOUT_SUCCESS', lang)
        }
      }
    }
  })
  async logout(@Body() body: RefreshTokenDto) {
    await this.authService.logout(body.refresh_token);
    return {
      state: getSwaggerText('general', 'SUCCESS', lang),
      result: { message: getSwaggerText('auth', 'LOGOUT_SUCCESS', lang) }
    };
  }

  @Post('set-password')
  @ApiOperation({ summary: getSwaggerText('auth', 'SET_PASSWORD_SUMMARY', lang) })
  @ApiResponse({
    status: 200,
    description: getSwaggerText('auth', 'SET_PASSWORD_DESC', lang),
    schema: {
      example: {
        state: getSwaggerText('general', 'SUCCESS', lang),
        result: { message: getSwaggerText('auth', 'SET_PASSWORD_DESC', lang) }
      }
    }
  })
  async setPassword(@Body() body: SetPasswordDto) {
    const result = await this.authService.setPassword(body);
    return { state: getSwaggerText('general', 'SUCCESS', lang), result };
  }

  @Post('reset-password-request')
  @ApiOperation({ summary: getSwaggerText('auth', 'RESET_PASSWORD_REQUEST_SUMMARY', lang) })
  @ApiResponse({
    status: 200,
    description: getSwaggerText('auth', 'RESET_PASSWORD_REQUEST_DESC', lang),
    schema: {
      example: {
        state: getSwaggerText('general', 'SUCCESS', lang),
        result: { message: getSwaggerText('auth', 'RESET_EMAIL_SENT', lang) }
      }
    }
  })
  async resetPasswordRequest(@Body() body: ResetPasswordRequestDto) {
    const result = await this.authService.resetPasswordRequest(body);
    return { state: getSwaggerText('general', 'SUCCESS', lang), result };
  }

}
