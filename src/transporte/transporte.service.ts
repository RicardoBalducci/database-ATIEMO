import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class TransporteService {
  constructor(private supabase: SupabaseService) {}

  // Crear transporte
  async crearTransporte(nombre: string, chofer_id: number | null = null, activa = true) {
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
    updates: { nombre?: string; chofer_id?: number | null; activa?: boolean },
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
    const { data: existentes, error: errorExistentes } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .select('ruta_id')
      .eq('transporte_id', transporte_id);

    if (errorExistentes) throw new Error(errorExistentes.message);

    const rutasNuevas = ruta_ids.filter(
      (id) => !existentes.some((e) => e.ruta_id === id),
    );

    if (rutasNuevas.length === 0) return [];

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
      `)
      .eq('id', transporte_id)
      .single();

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

  // Obtener choferes (users con tipo 'Chofer') sin transporte asignado
  async obtenerChoferesSinTransporte() {
    // Obtener todos los chofer_id ya ocupados
    const { data: transportesActivos, error: errorTransportes } = await this.supabase
      .getClient()
      .from('transporte')
      .select('chofer_id')
      .not('chofer_id', 'is', null);

    if (errorTransportes) throw new Error(errorTransportes.message);

    const choferIdsOcupados = transportesActivos.map((t) => t.chofer_id);

    // Buscar en tabla users los que son Chofer y no están asignados
    const query = this.supabase
      .getClient()
      .from('users')
      .select('*')
      .eq('tipo', 'Chofer');

    if (choferIdsOcupados.length > 0) {
      query.not('id', 'in', `(${choferIdsOcupados.join(',')})`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  // Obtener última ubicación de un transporte
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
      .select(`
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
      `)
      .eq('chofer_id', chofer_id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return {
        success: false,
        message: 'Este chofer no tiene transporte asignado',
        transporte: null,
        rutas: [],
      };
    }

    return data;
  }

  async cambiarRuta(transporte_id: number, ruta_id_antigua: number, ruta_id_nueva: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .update({ ruta_id: ruta_id_nueva })
      .eq('transporte_id', transporte_id)
      .eq('ruta_id', ruta_id_antigua)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Eliminar transporte
  async eliminarTransporte(transporte_id: number) {
    await this.supabase
      .getClient()
      .from('transporte_rutas')
      .delete()
      .eq('transporte_id', transporte_id);

    const { data, error } = await this.supabase
      .getClient()
      .from('transporte')
      .delete()
      .eq('id', transporte_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { message: 'Transporte eliminado correctamente', data };
  }

  // Desasignar chofer — requiere que chofer_id sea nullable en la BD:
  // ALTER TABLE transporte ALTER COLUMN chofer_id DROP NOT NULL;
  async desasignarChofer(transporte_id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte')
      .update({ chofer_id: null })
      .eq('id', transporte_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Desasignar ruta específica del transporte
  async desasignarRuta(transporte_id: number, ruta_id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .delete()
      .eq('transporte_id', transporte_id)
      .eq('ruta_id', ruta_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { message: 'Ruta desasignada correctamente', data };
  }

  // Obtener transportes sin ninguna ruta asignada
async obtenerTransportesSinRuta() {
  // 1. Obtener todos los transporte_id que ya tienen al menos una ruta
  const { data: conRuta, error: errConRuta } = await this.supabase
    .getClient()
    .from('transporte_rutas')
    .select('transporte_id');

  if (errConRuta) throw new Error(errConRuta.message);

  const idsConRuta = conRuta.map((r) => r.transporte_id);

  // 2. Traer transportes cuyo id NO esté en esa lista
  const query = this.supabase
    .getClient()
    .from('transporte')
    .select('id, nombre, chofer_id, activa');

  if (idsConRuta.length > 0) {
    query.not('id', 'in', `(${idsConRuta.join(',')})`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}
}