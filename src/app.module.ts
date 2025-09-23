import { TransporteModule } from './transporte/transporte.module';
import { ParadasModule } from './parada/paradas.module';
import { RutasModule } from './rutas/rutas.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TransporteModule,
    ParadasModule,
    RutasModule,
    ConfigModule.forRoot({
      isGlobal: true, // hace que las variables estén disponibles en todo el proyecto
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
