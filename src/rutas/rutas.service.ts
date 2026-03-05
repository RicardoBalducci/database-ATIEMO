import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { ParadasService } from 'src/parada/paradas.service';
import { TransporteService } from 'src/transporte/transporte.service';
import axios from 'axios';

@Injectable()
export class RutasService {
  constructor(
    private supabase: SupabaseService,
    private paradasService: ParadasService,
    public transporteService: TransporteService,
  ) {}

  // Crear ruta
  async crearRuta(nombre: string, activa = true) {
    const { data: ruta, error } = await this.supabase
      .getClient()
      .from('rutas')
      .insert([{ nombre, activa }])
      .select()
      .single();

    if (error) throw new Error(error.message);
/*     await this.paradasService.crearParada('UDO', ruta.id, 10.995095, -63.868602); */
    return ruta;
  }

  // Editar ruta
  async editarRuta(ruta_id: number, updates: { nombre?: string; activa?: boolean }) {
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

  async setRutaActiva(ruta_id: number, activa: boolean) {
    return this.editarRuta(ruta_id, { activa });
  }

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

  async editarHora(hora_id: number, updates: { hora?: string; activa?: boolean }) {
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

  async setHoraActiva(hora_id: number, activa: boolean) {
    return this.editarHora(hora_id, { activa });
  }

  async obtenerRutas() {
    const { data, error } = await this.supabase
      .getClient()
      .from('rutas')
      .select(`*, ruta_horas(*)`);
    if (error) throw new Error(error.message);
    return data;
  }

  async obtenerRutasDisponiblesAntesDeAhora() {
    const ahora = new Date().toTimeString().slice(0, 8);
    const { data, error } = await this.supabase
      .getClient()
      .from('rutas')
      .select(`id, nombre, activa, ruta_horas(id, hora, activa)`)
      .eq('activa', true)
      .eq('ruta_horas.activa', true)
      .lt('ruta_horas.hora', ahora);
    if (error) throw new Error(error.message);
    return data;
  }

  async obtenerTransportesPorRuta(rutaId: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .select(`transporte(id, nombre, chofer_id, activa)`)
      .eq('ruta_id', rutaId);
    if (error) throw new Error(error.message);
    return data.map((t: any) => t.transporte);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DETALLE COMPLETO DE UNA RUTA
  //
  // Devuelve:
  // {
  //   id, nombre, activa,
  //   horas:    [ { id, hora, activa } ],
  //   paradas:  [ { id, nombre, latitud, longitud } ],
  //   transportes: [{s
  //     id, nombre, placa, activa,
  //     ultima_ubicacion: { latitud, longitud, registrada_en },
  //     chofer: {
  //       id, alias, email, telefono, tipo
  //     }
  //   }]
  // }
  // ─────────────────────────────────────────────────────────────────────────
  async obtenerDetalleRuta(ruta_id: number) {

    // ── 1. Ruta base + horas + paradas ────────────────────────────────────
    const { data: ruta, error: errorRuta } = await this.supabase
      .getClient()
      .from('rutas')
      .select(`
        id,
        nombre,
        activa,
        ruta_horas ( id, hora, activa ),
        paradas    ( id, nombre, latitud, longitud )
      `)
      .eq('id', ruta_id)
      .single();

    if (errorRuta || !ruta) throw new Error('Ruta no encontrada');

    // ── 2. Transportes asignados a la ruta ────────────────────────────────
    const { data: transporteRutas, error: errorTransporte } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .select(`
        transporte (
          id,
          nombre,
          activa,
          chofer_id
        )
      `)
      .eq('ruta_id', ruta_id);

    if (errorTransporte) throw new Error(errorTransporte.message);

    // ── 3. Para cada transporte: chofer + última ubicación ────────────────
    const transportes = await Promise.all(
      (transporteRutas ?? []).map(async (tr: any) => {
        const t = tr.transporte;
        if (!t) return null;

        // 3a. Datos del chofer desde tabla users
        let chofer: any = null;
        if (t.chofer_id) {
          const { data: choferData } = await this.supabase
            .getClient()
            .from('users')
            .select('id, alias, email, telefono, tipo')
            .eq('id', t.chofer_id)
            .single();
          chofer = choferData ?? null;
        }

        // 3b. Última ubicación registrada del bus
        const ultima_ubicacion = await this.transporteService
          .obtenerUltimaUbicacion(t.id)
          .catch(() => null);

        return {
          id:               t.id,
          nombre:           t.nombre,
          activa:           t.activa,
          chofer_id:        t.chofer_id ?? null,
          // Datos completos del chofer
          chofer: chofer
            ? {
                id:       chofer.id,
                alias:    chofer.alias    ?? null,
                email:    chofer.email    ?? null,
                telefono: chofer.telefono ?? null,
                tipo:     chofer.tipo     ?? null,
              }
            : null,
          // Última posición GPS del bus
          ultima_ubicacion: ultima_ubicacion
            ? {
                latitud:       ultima_ubicacion.latitud,
                longitud:      ultima_ubicacion.longitud,
                registrada_en: ultima_ubicacion.registrada_en ?? null,
              }
            : null,
        };
      }),
    );

    // ── 4. Respuesta ensamblada ───────────────────────────────────────────
    return {
      id:      ruta.id,
      nombre:  ruta.nombre,
      activa:  ruta.activa,

      // Horarios de la ruta ordenados cronológicamente
      horas: (ruta.ruta_horas ?? []).sort((a: any, b: any) =>
        (a.hora ?? '').localeCompare(b.hora ?? ''),
      ),

      // Paradas en el orden en que fueron insertadas
      paradas: ruta.paradas ?? [],

      // Transportes con chofer y ubicación
      transportes: transportes.filter(Boolean),
    };
  }

  // Calcular tiempo de llegada
  async calcularTiempoLlegada(
    ruta_id: number,
    latUsuario: number,
    lonUsuario: number,
    parada_id: number,
  ) {
    const { data: parada, error: errParada } = await this.supabase
      .getClient()
      .from('paradas')
      .select('*')
      .eq('id', parada_id)
      .single();
    if (errParada || !parada) throw new Error('Parada no encontrada');

    const transportes = await this.obtenerTransportesPorRuta(ruta_id);
    if (!transportes?.length) throw new Error('No hay transporte asignado a esta ruta');

    const transporte = transportes[0];
    const ubicBus = await this.transporteService.obtenerUltimaUbicacion(transporte.id);
    if (!ubicBus) throw new Error('El transporte no tiene ubicación registrada');

    const waypointsUsuario = `${lonUsuario},${latUsuario};${parada.longitud},${parada.latitud}`;
    const respUsuario = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${waypointsUsuario}?overview=false`,
    );
    const legUsuario = respUsuario.data.routes[0].legs[0];

    const waypointsBus = `${ubicBus.longitud},${ubicBus.latitud};${parada.longitud},${parada.latitud}`;
    const respBus = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${waypointsBus}?overview=false`,
    );
    const legBus = respBus.data.routes[0].legs[0];

    return {
      tiempo_usuario_a_parada_min:   Math.ceil(legUsuario.duration / 60),
      distancia_usuario_a_parada_km: +(legUsuario.distance / 1000).toFixed(2),
      tiempo_bus_a_parada_min:       Math.ceil(legBus.duration / 60),
      distancia_bus_a_parada_km:     +(legBus.distance / 1000).toFixed(2),
      detalle_trayecto: [
        {
          desde: 'usuario', hasta: 'parada',
          distancia_km: +(legUsuario.distance / 1000).toFixed(2),
          tiempo_min:   Math.ceil(legUsuario.duration / 60),
        },
        {
          desde: 'bus', hasta: 'parada',
          distancia_km: +(legBus.distance / 1000).toFixed(2),
          tiempo_min:   Math.ceil(legBus.duration / 60),
        },
      ],
    };
  }

  // Eliminar ruta (cascade)
  async eliminarRuta(ruta_id: number) {
    await this.supabase.getClient().from('transporte_rutas').delete().eq('ruta_id', ruta_id);
    await this.supabase.getClient().from('paradas').delete().eq('id_ruta', ruta_id);
    await this.supabase.getClient().from('ruta_horas').delete().eq('ruta_id', ruta_id);

    const { data, error } = await this.supabase
      .getClient()
      .from('rutas')
      .delete()
      .eq('id', ruta_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { message: 'Ruta eliminada correctamente', data };
  }

  async obtenerRutasSinTransporte() {
    const { data: rutasAsignadas, error: errorRutas } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .select('ruta_id');
    if (errorRutas) throw new Error(errorRutas.message);

    const rutaIdsOcupadas = rutasAsignadas.map((r) => r.ruta_id);
    const query = this.supabase.getClient().from('rutas').select('*');

    if (rutaIdsOcupadas.length > 0) {
      query.not('id', 'in', `(${rutaIdsOcupadas.join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async eliminarHora(hora_id: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('ruta_horas')
      .delete()
      .eq('id', hora_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { message: 'Hora eliminada correctamente', data };
  }
}