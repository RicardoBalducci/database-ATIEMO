import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ParadasService } from './paradas.service';

@Controller('paradas')
export class ParadasController {
  constructor(private paradasService: ParadasService) {}

  // Crear parada
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

  // Editar parada
  @Patch(':id')
  editarParada(
    @Param('id') id: string,
    @Body() body: { nombre?: string; latitud?: number; longitud?: number },
  ) {
    return this.paradasService.editarParada(Number(id), body);
  }

  // Obtener todas las paradas de una ruta
  @Get('ruta/:id_ruta')
  obtenerParadasPorRuta(@Param('id_ruta') id_ruta: string) {
    return this.paradasService.obtenerParadasPorRuta(Number(id_ruta));
  }

  @Get()
  obtenerTodasParadas() {
    return this.paradasService.obtenerTodasParadas();
  }
}
