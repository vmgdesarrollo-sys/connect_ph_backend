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
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "victormanuelgarcia",
      password: "",
      database: "conectando_ph",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true, //Solo para desarrollo
    }),
    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
