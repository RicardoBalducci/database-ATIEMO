import { TransporteService } from './transporte.service';
import { TransporteController } from './transporte.controller';

import { Module } from '@nestjs/common';
import { SupabaseService } from 'src/supabase.service';

@Module({
  controllers: [TransporteController],
  providers: [TransporteService, SupabaseService],
})
export class TransporteModule {}
