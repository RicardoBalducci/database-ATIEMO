import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class ParadasService {
  constructor(private supabase: SupabaseService) {}

  // Crear parada
  async crearParada(
    nombre: string,
    id_ruta: number,
    latitud: number,
    longitud: number,
  ) {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .insert([{ nombre, id_ruta, latitud, longitud }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Editar parada
  async editarParada(
    id: number,
    updates: { nombre?: string; latitud?: number; longitud?: number },
  ) {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Eliminar parada
  async eliminarParada(id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { message: 'Parada eliminada correctamente', data };
  }

  // Obtener todas las paradas de una ruta
  async obtenerParadasPorRuta(id_ruta: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .select('*')
      .eq('id_ruta', id_ruta);
    if (error) throw new Error(error.message);
    return data;
  }

  // Obtener todas las paradas
  async obtenerTodasParadas() {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .select('*');
    if (error) throw new Error(error.message);
    return data;
  }
}