import { Controller, Post, Get, Patch, Body, Param, Delete } from '@nestjs/common';
import { ParadasService } from './paradas.service';

@Controller('paradas')
export class ParadasController {
  constructor(private paradasService: ParadasService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // POST
  // ─────────────────────────────────────────────────────────────────────────

  // El orden se asigna automáticamente (1, 2, 3...) según las paradas existentes en la ruta
  @Post()
  crearParada(
    @Body()
    body: {
      nombre: string;
      id_ruta: number;
      latitud: number;
      longitud: number;
    },
  ) {
    return this.paradasService.crearParada(
      body.nombre,
      body.id_ruta,
      body.latitud,
      body.longitud,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET  —  estáticas antes que dinámicas
  // ─────────────────────────────────────────────────────────────────────────

  @Get()
  obtenerTodasParadas() {
    return this.paradasService.obtenerTodasParadas();
  }

  @Get('ruta/:id_ruta')
  obtenerParadasPorRuta(@Param('id_ruta') id_ruta: string) {
    return this.paradasService.obtenerParadasPorRuta(Number(id_ruta));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH  —  estáticas antes que dinámicas
  // ─────────────────────────────────────────────────────────────────────────

  // Activar una parada (operativa)
  @Patch(':id/activar')
  activarParada(@Param('id') id: string) {
    return this.paradasService.setParadaActiva(Number(id), true);
  }

  // Desactivar una parada (no operativa / ya pasó)
  @Patch(':id/desactivar')
  desactivarParada(@Param('id') id: string) {
    return this.paradasService.setParadaActiva(Number(id), false);
  }

  // Activar TODAS las paradas de una ruta (reset al inicio del recorrido)
  @Patch('ruta/:id_ruta/activar-todas')
  activarTodasParadas(@Param('id_ruta') id_ruta: string) {
    return this.paradasService.activarTodasParadasDeRuta(Number(id_ruta));
  }

  // Reordenar paradas: recibe array [{ id, orden }] con el nuevo orden deseado
  @Patch('ruta/:id_ruta/reordenar')
  reordenarParadas(
    @Param('id_ruta') id_ruta: string,
    @Body() body: { paradas: { id: number; orden: number }[] },
  ) {
    return this.paradasService.reordenarParadas(Number(id_ruta), body.paradas);
  }

  // Editar datos de una parada (solo nombre y coordenadas, el orden se gestiona aparte)
  @Patch(':id')
  editarParada(
    @Param('id') id: string,
    @Body()
    body: {
      nombre?: string;
      latitud?: number;
      longitud?: number;
    },
  ) {
    return this.paradasService.editarParada(Number(id), body);
  }

    // Intercambiar orden entre dos paradas
  @Patch('ruta/:id_ruta/swap')
  intercambiarOrden(
    @Param('id_ruta') id_ruta: string,
    @Body() body: { id_parada_a: number; id_parada_b: number },
  ) {
    return this.paradasService.intercambiarOrden(
      Number(id_ruta),
      body.id_parada_a,
      body.id_parada_b,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  eliminarParada(@Param('id') id: string) {
    return this.paradasService.eliminarParada(Number(id));
  }
}