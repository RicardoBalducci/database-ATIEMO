import { Module } from '@nestjs/common';
import { ParadasService } from './paradas.service';
import { ParadasController } from './paradas.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  imports: [],
  controllers: [ParadasController],
  providers: [ParadasService, SupabaseService],
})
export class ParadasModule {}
