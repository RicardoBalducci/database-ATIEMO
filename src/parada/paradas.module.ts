import { Module } from '@nestjs/common';
import { ParadasService } from './paradas.service';
import { ParadasController } from './paradas.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  imports: [],
  controllers: [ParadasController],
  providers: [ParadasService, SupabaseService],
  exports: [ParadasService], // ⚠️ Esto es importante para que otros módulos puedan usarlo

})
export class ParadasModule {}
