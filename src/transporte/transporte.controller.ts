import { Controller, Post, Patch, Get, Body, Param, Delete } from '@nestjs/common';
import { TransporteService } from './transporte.service';

@Controller('transporte')
export class TransporteController {
  constructor(private transporteService: TransporteService) {}

  // ── Rutas ESTÁTICAS primero (antes de cualquier :id) ──────────────────────

  @Get()
  obtenerTransportes() {
    return this.transporteService.obtenerTransportes();
  }

  @Get('sin-ruta')                          // ✅ antes de :id
  async obtenerTransportesSinRuta() {
    return this.transporteService.obtenerTransportesSinRuta();
  }

  @Get('choferes/sin-transporte')           // ✅ antes de :id
  async obtenerChoferesSinTransporte() {
    return this.transporteService.obtenerChoferesSinTransporte();
  }

  // ── Rutas DINÁMICAS después ───────────────────────────────────────────────

  @Get('chofer/:chofer_id')
  async obtenerTransportePorChofer(@Param('chofer_id') chofer_id: string) {
    return this.transporteService.obtenerTransportePorChofer(Number(chofer_id));
  }

  @Get(':id')
  obtenerTransporte(@Param('id') id: string) {
    return this.transporteService.obtenerTransportePorId(Number(id));
  }

  @Get(':id/ubicaciones')
  async obtenerUbicaciones(@Param('id') id: string) {
    return this.transporteService.obtenerUltimaUbicacion(Number(id));
  }

  // ── POST ──────────────────────────────────────────────────────────────────

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

  @Post(':id/rutas')
  asignarRutas(@Param('id') id: string, @Body() body: { ruta_ids: number[] }) {
    return this.transporteService.asignarRutas(Number(id), body.ruta_ids);
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

  // ── PATCH ─────────────────────────────────────────────────────────────────

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

  @Patch(':id/desasignar-chofer')
  async desasignarChofer(@Param('id') id: string) {
    return this.transporteService.desasignarChofer(Number(id));
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  @Delete(':id')
  async eliminarTransporte(@Param('id') id: string) {
    return this.transporteService.eliminarTransporte(Number(id));
  }

  @Delete(':id/rutas/:ruta_id')
  async desasignarRuta(
    @Param('id') id: string,
    @Param('ruta_id') ruta_id: string,
  ) {
    return this.transporteService.desasignarRuta(Number(id), Number(ruta_id));
  }
}