import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class RutasService {
  constructor(private supabase: SupabaseService) {}

  // Crear ruta
  async crearRuta(nombre: string, activa = true) {
    const { data, error } = await this.supabase
      .getClient()
      .from('rutas')
      .insert([{ nombre, activa }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Editar ruta
  async editarRuta(
    ruta_id: number,
    updates: { nombre?: string; activa?: boolean },
  ) {
    const { data, error } = await this.supabase
      .getClient()
      .from('rutas')
      .update(updates)
      .eq('id', ruta_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Activar / desactivar ruta
  async setRutaActiva(ruta_id: number, activa: boolean) {
    return this.editarRuta(ruta_id, { activa });
  }

  // Crear hora para ruta
  async agregarHora(ruta_id: number, hora: string, activa = true) {
    const { data, error } = await this.supabase
      .getClient()
      .from('ruta_horas')
      .insert([{ ruta_id, hora, activa }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Editar hora
  async editarHora(
    hora_id: number,
    updates: { hora?: string; activa?: boolean },
  ) {
    const { data, error } = await this.supabase
      .getClient()
      .from('ruta_horas')
      .update(updates)
      .eq('id', hora_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Activar / desactivar hora
  async setHoraActiva(hora_id: number, activa: boolean) {
    return this.editarHora(hora_id, { activa });
  }

  // Obtener rutas con horas
  async obtenerRutas() {
    const { data, error } = await this.supabase.getClient().from('rutas')
      .select(`
        *,
        ruta_horas(*)
      `);
    if (error) throw new Error(error.message);
    return data;
  }
}
