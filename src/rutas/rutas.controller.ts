import { Controller, Post, Get, Patch, Body, Param, Query, Delete } from '@nestjs/common';
import { RutasService } from './rutas.service';

@Controller('rutas')
export class RutasController {
  constructor(private rutasService: RutasService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // POST
  // ─────────────────────────────────────────────────────────────────────────

  @Post()
  crearRuta(@Body() body: { nombre: string; activa?: boolean }) {
    return this.rutasService.crearRuta(body.nombre, body.activa);
  }

  @Post(':ruta_id/horas')
  agregarHora(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { hora: string; activa?: boolean },
  ) {
    return this.rutasService.agregarHora(Number(ruta_id), body.hora, body.activa);
  }

  @Post(':ruta_id/tiempo_llegada')
  async tiempoLlegada(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { latitud_usuario: number; longitud_usuario: number; parada_id: number },
  ) {
    return this.rutasService.calcularTiempoLlegada(
      Number(ruta_id),
      body.latitud_usuario,
      body.longitud_usuario,
      body.parada_id,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET  —  ⚠️ estáticas SIEMPRE antes que las dinámicas (:ruta_id)
  // ─────────────────────────────────────────────────────────────────────────

  @Get()
  obtenerRutas() {
    return this.rutasService.obtenerRutas();
  }

  @Get('disponibles/ahora')          // estática
  obtenerRutasDisponiblesAhora() {
    return this.rutasService.obtenerRutasDisponiblesAntesDeAhora();
  }

  @Get('sin-transporte')             // estática
  obtenerRutasSinTransporte() {
    return this.rutasService.obtenerRutasSinTransporte();
  }

  @Get(':ruta_id')                   // dinámica
  obtenerDetalleRuta(@Param('ruta_id') ruta_id: string) {
    return this.rutasService.obtenerDetalleRuta(Number(ruta_id));
  }

  @Get(':ruta_id/transportes')       // dinámica
  async obtenerTransportesPorRuta(@Param('ruta_id') ruta_id: string) {
    const transportes = await this.rutasService.obtenerTransportesPorRuta(Number(ruta_id));
    return Promise.all(
      transportes.map(async (t) => {
        const ubicacion = await this.rutasService.transporteService.obtenerUltimaUbicacion(t.id);
        return { ...t, ultimaUbicacion: ubicacion };
      }),
    );
  }

  @Get(':ruta_id/tiempo_llegada')    // dinámica
  async tiempoLlegadas(
    @Param('ruta_id') ruta_id: string,
    @Query('latitud_usuario') latitud_usuario: string,
    @Query('longitud_usuario') longitud_usuario: string,
    @Query('parada_id') parada_id: string,
  ) {
    return this.rutasService.calcularTiempoLlegada(
      Number(ruta_id),
      Number(latitud_usuario),
      Number(longitud_usuario),
      Number(parada_id),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH  —  estáticas antes que dinámicas
  // ─────────────────────────────────────────────────────────────────────────

  @Patch('horas/:hora_id')           // estática
  editarHora(
    @Param('hora_id') hora_id: string,
    @Body() body: { hora?: string; activa?: boolean },
  ) {
    return this.rutasService.editarHora(Number(hora_id), body);
  }

  @Patch('horas/:hora_id/activar')   // estática
  activarHora(
    @Param('hora_id') hora_id: string,
    @Body() body: { activa: boolean },
  ) {
    return this.rutasService.setHoraActiva(Number(hora_id), body.activa);
  }

  @Patch(':ruta_id')                 // dinámica
  editarRuta(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { nombre?: string; activa?: boolean },
  ) {
    return this.rutasService.editarRuta(Number(ruta_id), body);
  }

  @Patch(':ruta_id/activar')         // dinámica
  activarRuta(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { activa: boolean },
  ) {
    return this.rutasService.setRutaActiva(Number(ruta_id), body.activa);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE  —  estáticas antes que dinámicas
  // ─────────────────────────────────────────────────────────────────────────

  @Delete('horas/:hora_id')          // estática
  eliminarHora(@Param('hora_id') hora_id: string) {
    return this.rutasService.eliminarHora(Number(hora_id));
  }

  @Delete(':ruta_id')                // dinámica
  eliminarRuta(@Param('ruta_id') ruta_id: string) {
    return this.rutasService.eliminarRuta(Number(ruta_id));
  }
}