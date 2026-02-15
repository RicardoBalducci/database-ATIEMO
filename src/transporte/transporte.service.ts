import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class TransporteService {
  constructor(private supabase: SupabaseService) {}

  // Crear transporte
  async crearTransporte(nombre: string, chofer_id: number, activa = true) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte')
      .insert([{ nombre, chofer_id, activa }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Editar transporte
  async editarTransporte(
    transporte_id: number,
    updates: { nombre?: string; chofer_id?: number; activa?: boolean },
  ) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte')
      .update(updates)
      .eq('id', transporte_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Activar / desactivar transporte
  async setTransporteActivo(transporte_id: number, activa: boolean) {
    return this.editarTransporte(transporte_id, { activa });
  }

  // Asignar rutas a transporte
  async asignarRutas(transporte_id: number, ruta_ids: number[]) {
    // Obtener las rutas ya asignadas
    const { data: existentes, error: errorExistentes } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .select('ruta_id')
      .eq('transporte_id', transporte_id);

    if (errorExistentes) throw new Error(errorExistentes.message);

    const rutasNuevas = ruta_ids.filter(
      (id) => !existentes.some((e) => e.ruta_id === id),
    );

    if (rutasNuevas.length === 0) return []; // nada que insertar

    const { data, error } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .insert(rutasNuevas.map((ruta_id) => ({ transporte_id, ruta_id })))
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  // Obtener todos los transportes con rutas y paradas
  async obtenerTransportes() {
    const { data, error } = await this.supabase.getClient().from('transporte')
      .select(`
        id,
        nombre,
        chofer_id,
        activa,
        transporte_rutas (
          ruta_id,
          rutas (
            nombre,
            activa,
            ruta_horas (*),
            paradas (*)
          )
        )
      `);

    if (error) throw new Error(error.message);
    return data;
  }

  async obtenerTransportePorId(transporte_id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte')
      .select(
        `
      id,
      nombre,
      chofer_id,
      activa,
      transporte_rutas (
        ruta_id,
        rutas (
          nombre,
          activa,
          ruta_horas (*),
          paradas (*)
        )
      )
    `,
      )
      .eq('id', transporte_id)
      .single(); // <- devuelve un solo objeto

    if (error) throw new Error(error.message);
    return data;
  }

  // Registrar ubicación actual
  async registrarUbicacion(
    transporte_id: number,
    latitud: number,
    longitud: number,
  ) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte_ubicaciones')
      .insert([{ transporte_id, latitud, longitud }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Obtener todas las ubicaciones de un transporte
  async obtenerUltimaUbicacion(transporte_id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte_ubicaciones')
      .select('*')
      .eq('transporte_id', transporte_id)
      .order('registrada_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }
   async obtenerTransportePorChofer(chofer_id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte')
      .select(
        `
        id,
        nombre,
        chofer_id,
        activa,
        transporte_rutas (
          ruta_id,
          rutas (
            id,
            nombre,
            activa,
            ruta_horas (*),
            paradas (*)
          )
        )
      `,
      )
      .eq('chofer_id', chofer_id)
      .maybeSingle(); // 👈 por si no tiene transporte asignado

    if (error) throw new Error(error.message);

    if (!data) {
      return {
        message: 'Este chofer no tiene transporte asignado',
        transporte: null,
        rutas: [],
      };
    }

    return data;
  }
}
