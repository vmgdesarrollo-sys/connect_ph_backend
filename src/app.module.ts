import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config"; // Importamos ConfigService
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from "nestjs-i18n";
import * as path from "path";
import { CoreModule } from "./core/core.module";

@Module({
  imports: [
    // 1. Mover ConfigModule al principio para asegurar la carga de variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env", 
    }),

    I18nModule.forRoot({
      fallbackLanguage: "es",
      loaderOptions: {
        path: path.join(process.cwd(), "dist/i18n/"),
        watch: true,
      },
      resolvers: [
        new QueryResolver(["lang"]),
        new HeaderResolver(["x-custom-lang"]),
        AcceptLanguageResolver,
      ],
    }),

    // 2. Usar forRootAsync para inyectar las variables de entorno correctamente
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<any>('DB_TYPE', 'postgres'),
        host: configService.get<string>('DB_HOST', 'localhost'),
        // El ConfigService puede castear automáticamente a número
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASS', '1475369'),
        database: configService.get<string>('DB_DATABASE', '1475369'),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        autoLoadEntities: true, // Recomendado para cargar entidades de los módulos
        synchronize: true,      // Solo para desarrollo
      }),
    }),

    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}