import { Module } from '@nestjs/common';
import { RutasService } from './rutas.service';
import { RutasController } from './rutas.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  providers: [RutasService, SupabaseService],
  controllers: [RutasController],
})
export class RutasModule {}
