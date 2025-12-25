import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(process.env.API_VERSION ?? 'api/v1');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina campos que no estén en el DTO
    forbidNonWhitelisted: true, // Lanza error si envían campos de más
    transform: true, // Convierte tipos automáticamente
  }));

  const config = new DocumentBuilder()
    .setTitle('ERP Propiedad Horizontal API')
    .setDescription('Documentación de los servicios de PH y Usuarios')
    .setVersion('1.0')
    //.addBearerAuth() // Para cuando implementemos JWT
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

