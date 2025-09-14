import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
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
}
