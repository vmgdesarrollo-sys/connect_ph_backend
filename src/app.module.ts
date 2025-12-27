import { Module } from '@nestjs/common';
//import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
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
