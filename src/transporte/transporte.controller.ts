import { Controller, Post, Patch, Get, Body, Param, Delete } from '@nestjs/common';
import { TransporteService } from './transporte.service';

@Controller('transporte')
export class TransporteController {
  constructor(private transporteService: TransporteService) {}

  @Post()// listo
  crearTransporte(
    @Body() body: { nombre: string; chofer_id: number; activa?: boolean },
  ) {
    return this.transporteService.crearTransporte(
      body.nombre,
      body.chofer_id,
      body.activa,
    );
  }

  @Patch(':id')// listo
  editarTransporte(
    @Param('id') id: string,
    @Body() body: { nombre?: string; chofer_id?: number; activa?: boolean },
  ) {
    return this.transporteService.editarTransporte(Number(id), body);
  }

  @Patch(':id/activar')// listo
  activarTransporte(
    @Param('id') id: string,
    @Body() body: { activa: boolean },
  ) {
    return this.transporteService.setTransporteActivo(Number(id), body.activa);
  }

  @Post(':id/rutas') //asignar transporte a ruta // listo
  asignarRutas(@Param('id') id: string, @Body() body: { ruta_ids: number[] }) {
    return this.transporteService.asignarRutas(Number(id), body.ruta_ids);
  }

  @Get()// listo
  obtenerTransportes() {
    return this.transporteService.obtenerTransportes();
  }

  @Get(':id') // listo
  obtenerTransporte(@Param('id') id: string) {
    return this.transporteService.obtenerTransportePorId(Number(id));
  }

  @Post(':id/ubicacion')// listo
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
  @Get(':id/ubicaciones') // listo
  async obtenerUbicaciones(@Param('id') id: string) {
    return this.transporteService.obtenerUltimaUbicacion(Number(id));
  }

    @Get('chofer/:chofer_id')
  async obtenerTransportePorChofer(@Param('chofer_id') chofer_id: string) {
    return this.transporteService.obtenerTransportePorChofer(Number(chofer_id));
  }

  @Get('choferes/sin-transporte')
  async obtenerChoferesSinTransporte() {
    return this.transporteService.obtenerChoferesSinTransporte();
  }

  @Patch(':id/rutas/:ruta_id')
  async cambiarRuta(
    @Param('id') id: string, 
    @Param('ruta_id') ruta_id: string,
    @Body() body: { ruta_id_nueva: number },
  ) {
    return this.transporteService.cambiarRuta(
      Number(id),
      Number(ruta_id),
      body.ruta_id_nueva,
    );
  }

    // Eliminar transporte
  @Delete(':id')
  async eliminarTransporte(@Param('id') id: string) {
    return this.transporteService.eliminarTransporte(Number(id));
  }

  // Desasignar chofer del transporte
  @Patch(':id/desasignar-chofer')
  async desasignarChofer(@Param('id') id: string) {
    return this.transporteService.desasignarChofer(Number(id));
  }

  // Desasignar ruta del transporte
  @Delete(':id/rutas/:ruta_id')
  async desasignarRuta(
    @Param('id') id: string,
    @Param('ruta_id') ruta_id: string,
  ) {
    return this.transporteService.desasignarRuta(Number(id), Number(ruta_id));
  }
}
