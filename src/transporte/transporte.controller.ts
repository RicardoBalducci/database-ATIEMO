import { Controller, Post, Patch, Get, Body, Param } from '@nestjs/common';
import { TransporteService } from './transporte.service';

@Controller('transporte')
export class TransporteController {
  constructor(private transporteService: TransporteService) {}

  @Post()
  crearTransporte(
    @Body() body: { nombre: string; chofer_id: number; activa?: boolean },
  ) {
    return this.transporteService.crearTransporte(
      body.nombre,
      body.chofer_id,
      body.activa,
    );
  }

  @Patch(':id')
  editarTransporte(
    @Param('id') id: string,
    @Body() body: { nombre?: string; chofer_id?: number; activa?: boolean },
  ) {
    return this.transporteService.editarTransporte(Number(id), body);
  }

  @Patch(':id/activar')
  activarTransporte(
    @Param('id') id: string,
    @Body() body: { activa: boolean },
  ) {
    return this.transporteService.setTransporteActivo(Number(id), body.activa);
  }

  @Post(':id/rutas')
  asignarRutas(@Param('id') id: string, @Body() body: { ruta_ids: number[] }) {
    return this.transporteService.asignarRutas(Number(id), body.ruta_ids);
  }

  @Get()
  obtenerTransportes() {
    return this.transporteService.obtenerTransportes();
  }
  @Get(':id')
  obtenerTransporte(@Param('id') id: string) {
    return this.transporteService.obtenerTransportePorId(Number(id));
  }

  @Post(':id/ubicacion')
  async enviarUbicacion(
    @Param('id') id: string,
    @Body() body: { latitud: number; longitud: number },
  ) {
    return this.transporteService.registrarUbicacion(
      Number(id),
      body.latitud,
      body.longitud,
    );
  }

  // Obtener recorrido/ubicaciones del transporte
  @Get(':id/ubicaciones')
  async obtenerUbicaciones(@Param('id') id: string) {
    return this.transporteService.obtenerUbicaciones(Number(id));
  }
}
