import { Controller, Post, Get, Patch, Body, Param, Query, Delete } from '@nestjs/common';
import { RutasService } from './rutas.service';

@Controller('rutas')
export class RutasController {
  constructor(private rutasService: RutasService) {}

  // Crear ruta
  @Post()
  crearRuta(@Body() body: { nombre: string; activa?: boolean }) {
    return this.rutasService.crearRuta(body.nombre, body.activa);
  }

  // Obtener rutas con horas
  @Get()
  obtenerRutas() {
    return this.rutasService.obtenerRutas();
  }

  // Editar ruta
  @Patch(':ruta_id')
  editarRuta(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { nombre?: string; activa?: boolean },
  ) {
    return this.rutasService.editarRuta(Number(ruta_id), body);
  }

  // Activar / desactivar ruta
  @Patch(':ruta_id/activar')
  activarRuta(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { activa: boolean },
  ) {
    return this.rutasService.setRutaActiva(Number(ruta_id), body.activa);
  }

  // Agregar hora a ruta
  @Post(':ruta_id/horas')
  agregarHora(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { hora: string; activa?: boolean },
  ) {
    return this.rutasService.agregarHora(
      Number(ruta_id),
      body.hora,
      body.activa,
    );
  }

  // Editar hora
  @Patch('horas/:hora_id')
  editarHora(
    @Param('hora_id') hora_id: string,
    @Body() body: { hora?: string; activa?: boolean },
  ) {
    return this.rutasService.editarHora(Number(hora_id), body);
  }

  // Activar / desactivar hora
  @Patch('horas/:hora_id/activar')
  activarHora(
    @Param('hora_id') hora_id: string,
    @Body() body: { activa: boolean },
  ) {
    return this.rutasService.setHoraActiva(Number(hora_id), body.activa);
  }

  @Get('disponibles/ahora')
obtenerRutasDisponiblesAhora() {
  return this.rutasService.obtenerRutasDisponiblesAntesDeAhora();
}

  @Get(':ruta_id/transportes')
async obtenerTransportesPorRuta(@Param('ruta_id') ruta_id: string) {
  // Obtener transportes asignados a la ruta
  const transportes = await this.rutasService.obtenerTransportesPorRuta(Number(ruta_id));
  
  // Agregar la última ubicación de cada transporte
  const transportesConUbicacion = await Promise.all(
    transportes.map(async (t) => {
      const ubicacion = await this.rutasService.transporteService.obtenerUltimaUbicacion(t.id);
      return { ...t, ultimaUbicacion: ubicacion };
    }),
  );

  return transportesConUbicacion;
}

  @Post(':ruta_id/tiempo_llegada')
  async tiempoLlegada(
    @Param('ruta_id') ruta_id: string,
    @Body() body: { latitud_usuario: number; longitud_usuario: number; parada_id: number }
  ) {
    return this.rutasService.calcularTiempoLlegada(
      Number(ruta_id),
      body.latitud_usuario,
      body.longitud_usuario,
      body.parada_id
    );
  }

  @Get(':ruta_id/tiempo_llegada')
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
      Number(parada_id)
    );
  }
  @Get('sin-transporte')
  obtenerRutasSinTransporte() {
    return this.rutasService.obtenerRutasSinTransporte();
  }

  // Eliminar hora
  // Eliminar ruta (cascade: paradas, horas, transporte_rutas)
  @Delete(':ruta_id')
  eliminarRuta(@Param('ruta_id') ruta_id: string) {
    return this.rutasService.eliminarRuta(Number(ruta_id));
  }

}
