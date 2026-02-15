import { TransporteService } from './transporte.service';
import { TransporteController } from './transporte.controller';

import { Module } from '@nestjs/common';
import { SupabaseService } from 'src/supabase.service';

@Module({
  exports: [TransporteService], // Exportamos para usar en RutasService
  controllers: [TransporteController],
  providers: [TransporteService, SupabaseService],
})
export class TransporteModule {}
