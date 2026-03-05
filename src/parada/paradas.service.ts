import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class ParadasService {
  constructor(private supabase: SupabaseService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CREAR
  // ─────────────────────────────────────────────────────────────────────────

  async crearParada(
    nombre: string,
    id_ruta: number,
    latitud: number,
    longitud: number,
    orden?: number,
  ) {
    // Si no se pasa orden, se asigna automáticamente el siguiente disponible
    let ordenFinal = orden;
    if (ordenFinal === undefined || ordenFinal === null) {
      const { data: existentes } = await this.supabase
        .getClient()
        .from('paradas')
        .select('orden')
        .eq('id_ruta', id_ruta)
        .order('orden', { ascending: false })
        .limit(1);

      const maxOrden = existentes?.[0]?.orden ?? 0;
      ordenFinal = maxOrden + 1;
    }

    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .insert([{ nombre, id_ruta, latitud, longitud, orden: ordenFinal, activa: true }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDITAR
  // ─────────────────────────────────────────────────────────────────────────

  async editarParada(
    id: number,
    updates: {
      nombre?: string;
      latitud?: number;
      longitud?: number;
      orden?: number;
    },
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

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIVAR / DESACTIVAR
  // ─────────────────────────────────────────────────────────────────────────

  // Activar o desactivar una parada individual
  async setParadaActiva(id: number, activa: boolean) {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .update({ activa })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      message: activa
        ? 'Parada activada correctamente'
        : 'Parada desactivada correctamente',
      data,
    };
  }

  // Activar TODAS las paradas de una ruta (útil para reset al inicio del recorrido)
  async activarTodasParadasDeRuta(id_ruta: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .update({ activa: true })
      .eq('id_ruta', id_ruta)
      .select();

    if (error) throw new Error(error.message);
    return {
      message: `Todas las paradas de la ruta ${id_ruta} fueron activadas`,
      total: data.length,
      data,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REORDENAR
  // ─────────────────────────────────────────────────────────────────────────

  // Recibe un array [{ id, orden }] y actualiza cada parada en paralelo
  async reordenarParadas(
    id_ruta: number,
    paradas: { id: number; orden: number }[],
  ) {
    const actualizaciones = paradas.map(({ id, orden }) =>
      this.supabase
        .getClient()
        .from('paradas')
        .update({ orden })
        .eq('id', id)
        .eq('id_ruta', id_ruta) // seguridad: solo paradas de esa ruta
        .select()
        .single(),
    );

    const resultados = await Promise.all(actualizaciones);

    const errores = resultados
      .filter((r) => r.error)
      .map((r) => r.error!.message);

    if (errores.length) {
      throw new Error(`Errores al reordenar: ${errores.join(', ')}`);
    }

    return {
      message: 'Paradas reordenadas correctamente',
      data: resultados.map((r) => r.data),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONSULTAS
  // ─────────────────────────────────────────────────────────────────────────

  // Obtener paradas de una ruta ordenadas por el campo `orden`
  async obtenerParadasPorRuta(id_ruta: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .select('*')
      .eq('id_ruta', id_ruta)
      .order('orden', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  // Obtener todas las paradas
  async obtenerTodasParadas() {
    const { data, error } = await this.supabase
      .getClient()
      .from('paradas')
      .select('*')
      .order('id_ruta', { ascending: true })
      .order('orden', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ELIMINAR
  // ─────────────────────────────────────────────────────────────────────────

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

  // Intercambiar orden entre dos paradas (swap)
  async intercambiarOrden(id_ruta: number, id_parada_a: number, id_parada_b: number) {
    // 1. Obtener las dos paradas y verificar que pertenezcan a la ruta
    const { data: paradas, error } = await this.supabase
      .getClient()
      .from('paradas')
      .select('id, orden')
      .in('id', [id_parada_a, id_parada_b])
      .eq('id_ruta', id_ruta);

    if (error) throw new Error(error.message);
    if (!paradas || paradas.length !== 2)
      throw new Error('Una o ambas paradas no existen en esta ruta');

    const [paradaA, paradaB] = paradas;

    // 2. Intercambiar los valores de orden entre sí
    await Promise.all([
      this.supabase
        .getClient()
        .from('paradas')
        .update({ orden: paradaB.orden })
        .eq('id', paradaA.id),
      this.supabase
        .getClient()
        .from('paradas')
        .update({ orden: paradaA.orden })
        .eq('id', paradaB.id),
    ]);

    return {
      message: `Paradas intercambiadas: #${paradaA.id} ahora es orden ${paradaB.orden}, #${paradaB.id} ahora es orden ${paradaA.orden}`,
      data: [
        { id: paradaA.id, orden: paradaB.orden },
        { id: paradaB.id, orden: paradaA.orden },
      ],
    };
  }
}