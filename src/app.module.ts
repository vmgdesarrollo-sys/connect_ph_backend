import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoreModule } from "./core/core.module";
import { ConfigModule } from "@nestjs/config";
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from "nestjs-i18n";
import * as path from "path";

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: "es", // Idioma por defecto
      loaderOptions: {
        path: path.join(process.cwd(), "dist/i18n/"),
        watch: true,
      },
      resolvers: [
        new QueryResolver(["lang"]), // ?lang=en
        new HeaderResolver(["x-custom-lang"]),
        AcceptLanguageResolver, // Header standard: Accept-Language
      ],
    }),

    ConfigModule.forRoot({
      isGlobal: true, // Hace que no tengas que importarlo en otros módulos
      envFilePath: ".env", // Busca el archivo en la raíz
    }),
    TypeOrmModule.forRoot({
      type: ((process.env.DB_TYPE || 'postgres') as 'mysql' | 'postgres' | 'mariadb' | 'sqlite'),
      host: process?.env?.DB_HOST || "localhost",
      port: parseInt(process?.env?.DB_PORT || '5432', 10),
      username: process?.env?.DB_USER || "postgres",
      password: process?.env?.DB_PASS || "1475369",
      database: process?.env?.DB_DATABASE || "1475369",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true, //Solo para desarrollo
    }),
    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
