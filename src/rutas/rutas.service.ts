import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { ParadasService } from 'src/parada/paradas.service';
import { TransporteService } from 'src/transporte/transporte.service';
import axios from 'axios';

@Injectable()
export class RutasService {
  constructor(
    private supabase: SupabaseService,
    private paradasService: ParadasService, // Inyectamos ParadasService
    public transporteService: TransporteService, // Hacemos público para usarlo en controller

  ) {}

  // Crear ruta
// rutas.service.ts
  async crearRuta(nombre: string, activa = true) {
    // 1. Crear la ruta
    const { data: ruta, error } = await this.supabase
      .getClient()
      .from('rutas')
      .insert([{ nombre, activa }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 2. Crear la parada inicial "UDO"
    await this.paradasService.crearParada(
      'UDO',            // Nombre
      ruta.id,          // id_ruta de la nueva ruta creada
      10.995095,        // Latitud fija
      -63.868602        // Longitud fija
    );

  // 3. Devolver la ruta creada
  return ruta;
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
  // Obtener rutas activas con horas activas antes de la hora actual
async obtenerRutasDisponiblesAntesDeAhora() {
  // Hora actual en formato HH:mm:ss
  const ahora = new Date().toTimeString().slice(0, 8);

  const { data, error } = await this.supabase
    .getClient()
    .from('rutas')
    .select(`
      id,
      nombre,
      activa,
      ruta_horas (
        id,
        hora,
        activa
      )
    `)
    .eq('activa', true)
    .eq('ruta_horas.activa', true)
    .lt('ruta_horas.hora', ahora);

  if (error) throw new Error(error.message);

  return data;
}
   // Obtener transportes asignados a una ruta específica
  async obtenerTransportesPorRuta(rutaId: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from('transporte_rutas')
      .select(`
        transporte (
          id,
          nombre,
          chofer_id,
          activa
        )
      `)
      .eq('ruta_id', rutaId);

    if (error) throw new Error(error.message);

    // data es un arreglo de objetos { transporte: {...} }
    return data.map((t: any) => t.transporte);
  }
async calcularTiempoLlegada(
  ruta_id: number,
  latUsuario: number,
  lonUsuario: number,
  parada_id: number
) {
  // 1️⃣ Obtener la parada
  const { data: parada, error: errParada } = await this.supabase
    .getClient()
    .from('paradas')
    .select('*')
    .eq('id', parada_id)
    .single();
  if (errParada || !parada) throw new Error('Parada no encontrada');

  // 2️⃣ Obtener primer transporte asignado a la ruta
  const transportes = await this.obtenerTransportesPorRuta(ruta_id);
  if (!transportes || transportes.length === 0)
    throw new Error('No hay transporte asignado a esta ruta');

  const transporte = transportes[0];
  const ubicBus = await this.transporteService.obtenerUltimaUbicacion(transporte.id);
  if (!ubicBus) throw new Error('El transporte no tiene ubicación registrada');

  // 3️⃣ Calcular tiempos usando OSRM (usuario -> parada)
  const waypointsUsuario = `${lonUsuario},${latUsuario};${parada.longitud},${parada.latitud}`;
  const urlUsuario = `http://router.project-osrm.org/route/v1/driving/${waypointsUsuario}?overview=false`;
  const respUsuario = await axios.get(urlUsuario);
  const legUsuario = respUsuario.data.routes[0].legs[0];

  // 4️⃣ Calcular tiempos usando OSRM (bus -> parada)
  const waypointsBus = `${ubicBus.longitud},${ubicBus.latitud};${parada.longitud},${parada.latitud}`;
  const urlBus = `http://router.project-osrm.org/route/v1/driving/${waypointsBus}?overview=false`;
  const respBus = await axios.get(urlBus);
  const legBus = respBus.data.routes[0].legs[0];

  // 5️⃣ Construir respuesta
  return {
    tiempo_usuario_a_parada_min: Math.ceil(legUsuario.duration / 60),
    distancia_usuario_a_parada_km: +(legUsuario.distance / 1000).toFixed(2),
    tiempo_bus_a_parada_min: Math.ceil(legBus.duration / 60),
    distancia_bus_a_parada_km: +(legBus.distance / 1000).toFixed(2),
    detalle_trayecto: [
      {
        desde: 'usuario',
        hasta: 'parada',
        distancia_km: +(legUsuario.distance / 1000).toFixed(2),
        tiempo_min: Math.ceil(legUsuario.duration / 60)
      },
      {
        desde: 'bus',
        hasta: 'parada',
        distancia_km: +(legBus.distance / 1000).toFixed(2),
        tiempo_min: Math.ceil(legBus.duration / 60)
      }
    ]
  };
}

  async obtenerRutasSinTransporte() {
  // Obtener todos los ruta_id que ya tienen transporte asignado
  const { data: rutasAsignadas, error: errorRutas } = await this.supabase
    .getClient()
    .from('transporte_rutas')
    .select('ruta_id');

  if (errorRutas) throw new Error(errorRutas.message);

  const rutaIdsOcupadas = rutasAsignadas.map((r) => r.ruta_id);

  const query = this.supabase
    .getClient()
    .from('rutas')
    .select('*');

  if (rutaIdsOcupadas.length > 0) {
    query.not('id', 'in', `(${rutaIdsOcupadas.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
}
