import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Obtener todos los usuarios
  @Get()
  async getAllUsers() {
    return await this.usersService.findAllUsers();
  }

  // Obtener todos los choferes
  @Get('choferes')
  async getAllDrivers() {
    return await this.usersService.findAllDrivers();
  }

  // Modificar datos de un usuario por ID
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: any, // Recomendable crear un DTO
  ) {
    return await this.usersService.updateUser(+id, updateData);
  }
}
