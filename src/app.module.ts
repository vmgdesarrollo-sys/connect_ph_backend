import { Module } from "@nestjs/common";
//import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from "./core/core.module";
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
        path: path.join(__dirname, "/i18n/"),
        watch: true,
      },
      resolvers: [
        new QueryResolver(["lang"]), // ?lang=en
        new HeaderResolver(["x-custom-lang"]),
        AcceptLanguageResolver, // Header standard: Accept-Language
      ],
    }),
    //TypeOrmModule.forRoot({
    //type: 'postgres',
    //host: 'localhost',
    //port: 5432,
    //username: 'tu_usuario',
    //password: 'tu_password',
    //database: 'tu_db_ph',
    //entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //synchronize: true, // Solo para desarrollo
    //}),
    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
