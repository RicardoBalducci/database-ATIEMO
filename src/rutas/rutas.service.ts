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
        paradas    ( id, nombre, latitud, longitud, orden, activa )
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
      paradas: (ruta.paradas ?? []).sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)),

      // Transportes con chofer y ubicación
      transportes: transportes.filter(Boolean),
    };
  }

async calcularTiempoLlegada(
  ruta_id: number,
  latUsuario: number,
  lonUsuario: number,
  parada_id: number,
) {
  // ── 1. Parada destino del usuario ────────────────────────────────────────
  const { data: paradaDestino, error: errParada } = await this.supabase
    .getClient()
    .from('paradas')
    .select('*')
    .eq('id', parada_id)
    .single();
  if (errParada || !paradaDestino) throw new Error('Parada no encontrada');

  // ── 2. Todas las paradas de la ruta ordenadas por `orden` ────────────────
  const { data: todasParadas, error: errParadas } = await this.supabase
    .getClient()
    .from('paradas')
    .select('*')
    .eq('id_ruta', ruta_id)
    .order('orden', { ascending: true });
  if (errParadas || !todasParadas?.length) throw new Error('No hay paradas en esta ruta');

  // ── 3. Transporte y última ubicación del bus ─────────────────────────────
  const transportes = await this.obtenerTransportesPorRuta(ruta_id);
  if (!transportes?.length) throw new Error('No hay transporte asignado a esta ruta');

  const transporte = transportes[0];
  const ubicBus = await this.transporteService.obtenerUltimaUbicacion(transporte.id);
  if (!ubicBus) throw new Error('El transporte no tiene ubicación registrada');

  const busLat = ubicBus.latitud;
  const busLon = ubicBus.longitud;

  // ── 4. Detectar en qué índice está el bus ────────────────────────────────
  // La primera parada ACTIVA más cercana al bus = próxima parada del bus
  const paradasActivas = todasParadas.filter((p) => p.activa);

  let indiceBusEnRuta = -1;

  if (paradasActivas.length > 0) {
    // Encontrar la parada activa más cercana al bus
    let menorDistancia = Infinity;
    let paradaMasCercana: any = null;

    for (const p of paradasActivas) {
      const dist = this.distanciaKm(busLat, busLon, p.latitud, p.longitud);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        paradaMasCercana = p;
      }
    }

    // Índice en el array ordenado total
    indiceBusEnRuta = todasParadas.findIndex((p) => p.id === paradaMasCercana.id);
  }

  // Índice de la parada del usuario en la ruta
  const indiceParadaUsuario = todasParadas.findIndex((p) => p.id === parada_id);
  if (indiceParadaUsuario === -1) throw new Error('La parada no pertenece a esta ruta');

  // ── 5. Construir waypoints según si el bus ya pasó o no ──────────────────
  let waypointsBus: string;
  let yaPaso = false;

  if (indiceBusEnRuta === -1 || indiceBusEnRuta <= indiceParadaUsuario) {
    // ✅ Caso normal: bus no ha llegado aún a la parada del usuario
    // Ruta: bus → paradas intermedias activas → parada destino
    const paradasIntermediasActivas = todasParadas
      .slice(indiceBusEnRuta === -1 ? 0 : indiceBusEnRuta, indiceParadaUsuario + 1)
      .filter((p) => p.activa);

    const puntos = [
      `${busLon},${busLat}`,
      ...paradasIntermediasActivas.map((p) => `${p.longitud},${p.latitud}`),
    ];

    // Si la parada destino no quedó incluida (inactiva), agregarla igual como destino final
    const ultimoPunto = puntos[puntos.length - 1];
    const destinoStr = `${paradaDestino.longitud},${paradaDestino.latitud}`;
    if (ultimoPunto !== destinoStr) puntos.push(destinoStr);

    waypointsBus = puntos.join(';');
  } else {
    // ⚠️ Caso ciclo: el bus ya pasó la parada del usuario
    // Ruta: bus → resto de paradas activas hasta el final → inicio → paradas hasta destino
    yaPaso = true;

    const restoDeRuta = todasParadas
      .slice(indiceBusEnRuta)
      .filter((p) => p.activa);

    const vueltaAlInicio = todasParadas
      .slice(0, indiceParadaUsuario + 1)
      .filter((p) => p.activa);

    const puntos = [
      `${busLon},${busLat}`,
      ...restoDeRuta.map((p) => `${p.longitud},${p.latitud}`),
      // Desde la última parada de la ruta vuelve al inicio siguiendo el orden
      ...vueltaAlInicio.map((p) => `${p.longitud},${p.latitud}`),
    ];

    // Garantizar que el destino final es la parada del usuario
    const destinoStr = `${paradaDestino.longitud},${paradaDestino.latitud}`;
    if (puntos[puntos.length - 1] !== destinoStr) puntos.push(destinoStr);

    waypointsBus = puntos.join(';');
  }

  // ── 6. Calcular ruta del usuario a la parada (directo) ───────────────────
  const waypointsUsuario = `${lonUsuario},${latUsuario};${paradaDestino.longitud},${paradaDestino.latitud}`;

  const [respUsuario, respBus] = await Promise.all([
    axios.get(`http://router.project-osrm.org/route/v1/driving/${waypointsUsuario}?overview=false`),
    axios.get(`http://router.project-osrm.org/route/v1/driving/${waypointsBus}?overview=false`),
  ]);

  const legUsuario = respUsuario.data.routes[0].legs[0];

  // Cuando hay múltiples legs (múltiples waypoints), sumar duración y distancia total
  const legsBus = respBus.data.routes[0].legs as Array<{ duration: number; distance: number }>;
  const duracionBusTotal  = legsBus.reduce((acc, l) => acc + l.duration, 0);
  const distanciaBusTotal = legsBus.reduce((acc, l) => acc + l.distance, 0);

  // ── 7. Respuesta ─────────────────────────────────────────────────────────
  return {
    tiempo_usuario_a_parada_min:   Math.ceil(legUsuario.duration / 60),
    distancia_usuario_a_parada_km: +(legUsuario.distance / 1000).toFixed(2),
    tiempo_bus_a_parada_min:       Math.ceil(duracionBusTotal / 60),
    distancia_bus_a_parada_km:     +(distanciaBusTotal / 1000).toFixed(2),
    ya_paso: yaPaso, // 🆕 el cliente puede mostrar "El bus ya pasó, viene en la próxima vuelta"
    detalle_trayecto: [
      {
        desde: 'usuario', hasta: 'parada',
        distancia_km: +(legUsuario.distance / 1000).toFixed(2),
        tiempo_min:   Math.ceil(legUsuario.duration / 60),
      },
      {
        desde: 'bus', hasta: 'parada',
        distancia_km: +(distanciaBusTotal / 1000).toFixed(2),
        tiempo_min:   Math.ceil(duracionBusTotal / 60),
        ciclo_completo: yaPaso, // 🆕 indica si tuvo que dar vuelta completa
      },
    ],
  };
}

// ── Helper: distancia haversine en km ────────────────────────────────────────
private distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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