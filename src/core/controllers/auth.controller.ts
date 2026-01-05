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

@ApiTags("Authentication")
@Controller("api/v1/auth")
// Aplicamos los headers requeridos para todo el controlador
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("options")
  @UseGuards(ApiClientGuard)
  @ApiHeader({
    name: "client-id",
    description: "ID de la aplicación cliente",
    required: true,
  })
  @ApiHeader({
    name: "client-secret",
    description: "Secreto de la aplicación cliente",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Lista de proveedores disponibles",
    schema: {
      example: {
        state: "success",
        result: {
          providers: [
            {
              providerName: "accessEmail",
              label: "Inicia con email...",
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
    description: "ID de la aplicación cliente",
    required: true,
  })
  @ApiHeader({
    name: "client-secret",
    description: "Secreto de la aplicación cliente",
    required: true,
  })
  @ApiOperation({ summary: "Seleccionar un proveedor y obtener campos/token" })
  @ApiBody({
    schema: {
      example: { providerName: "accessEmail" },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Pasos y token de autorización temporal",
    schema: {
      example: {
        state: "success",
        result: {
          fields: {
            email: { description: "email cliente", type: "text" },
            password: { description: "password cliente", type: "password" },
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
    summary: "Validar credenciales del paso previo",
    description:
      "Recibe los campos dinámicos y el Bearer Token generado en /select",
  })
  // Documentamos los campos dinámicos en el Body
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        fields: {
          type: "object",
          example: { email: "usuario@correo.com", password: "myPassword123" },
          description: "Valores de los campos solicitados en el paso anterior",
        },
      },
    },
  })
  // La respuesta exitosa que solicitaste
  @ApiResponse({
    status: 200,
    description: "Autenticación final exitosa",
    schema: {
      example: {
        state: "success",
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
    description: "Token inválido o credenciales incorrectas",
  })
  async validateStep(
    @Headers("authorization") authHeader: string,
    @Body() body: { token: string; fields: any }
  ) {
    console.log('authHeader',authHeader );
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("Token no proporcionado en la cabecera");
    }
    return await this.authService.validateStep(token, body.fields);
  }
}
