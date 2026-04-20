import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
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

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = process.env.NODE_ENV === "production";
        const dbHost = configService.get<string>("DB_HOST", "localhost");
        const dbPort = configService.get<number>("DB_PORT", 5432);
        const dbUser = configService.get<string>("DB_USER", "postgres");
        const dbPass = configService.get<string>("DB_PASS", "1475369");
        const dbName = configService.get<string>("DB_DATABASE", "1475369");
        const ssl = configService.get<string>(
          "DB_SSL",
          isProduction ? "require" : "disable",
        );

        return {
          type: "postgres",
          host: dbHost,
          port: dbPort,
          username: dbUser,
          password: dbPass,
          database: dbName,
          entities: [__dirname + "/**/*.entity{.ts,.js}"],
          autoLoadEntities: true,
          synchronize: false, // NUNCA en producción - usar migraciones
          migrationsRun: !isProduction, // En producción ejecutar migraciones manualmente
          logging: isProduction ? ["error", "warn"] : ["log", "error", "warn"],
          // Connection Pooling crítico para +2,000 usuarios concurrentes
          extra: {
            // PgBouncer recomendado: max 100-200 conexiones por nodo
            // Si usas Cloud SQL, el connection pooler integrado ayuda
            max: configService.get<number>("DB_POOL_MAX", 100), // máximo de conexiones
            min: configService.get<number>("DB_POOL_MIN", 10), // mínimo de conexiones
            acquireTimeoutMillis: configService.get<number>(
              "DB_POOL_ACQUIRE_TIMEOUT",
              30000,
            ),
            idleTimeoutMillis: configService.get<number>(
              "DB_POOL_IDLE_TIMEOUT",
              30000,
            ),
            // SSL para Cloud SQL (producción)
            ...(ssl === "require" && {
              ssl: {
                rejectUnauthorized: false, // Cloud SQL usa self-signed certs
              },
            }),
          },
          // Timeouts para consultas largas (votaciones masivas)
          connectTimeoutMillis: 10000,
          queryTimeoutMillis: 30000, // 30 segundos máximo por query
        };
      },
    }),

    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
