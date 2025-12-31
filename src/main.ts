import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import { I18nContext, I18nService } from 'nestjs-i18n';
import {getSwaggerText} from "./utils/swagger-i18n.loader"
const lang = I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(process.env.API_VERSION ?? 'api/v1');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina campos que no estén en el DTO
    forbidNonWhitelisted: true, // Lanza error si envían campos de más
    transform: true, // Convierte tipos automáticamente
  }));

  const config = new DocumentBuilder()
    .setTitle(getSwaggerText('general', 'APP_TITLE', lang))
    .setDescription(getSwaggerText('general', 'APP_DESCR', lang))
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: getSwaggerText('general', 'JWT_DESCR', lang),
        in: 'header',
      },
      'access-token', // Este es el nombre interno que usaremos en los decoradores
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

