import { Controller, Get, Patch, Param, Body, Delete } from '@nestjs/common';
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

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: any, // Recomendable crear un DTO
  ) {
    return await this.usersService.updateUser(+id, updateData);
  }
  
  @Delete(':id')// Eliminar usuario
  async deleteUser(@Param('id') id: string) {
    return await this.usersService.deleteUser(+id);
  }
}
