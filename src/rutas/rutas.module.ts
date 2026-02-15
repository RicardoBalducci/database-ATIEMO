import { Module } from '@nestjs/common';
import { RutasService } from './rutas.service';
import { RutasController } from './rutas.controller';
import { SupabaseService } from '../supabase.service';
import { ParadasModule } from 'src/parada/paradas.module';
import { TransporteModule } from 'src/transporte/transporte.module';

@Module({
    imports: [ParadasModule, TransporteModule], // ⚠️ Esto habilita inyección de ParadasService y TransporteService
  providers: [RutasService, SupabaseService],
  controllers: [RutasController],
})
export class RutasModule {}
