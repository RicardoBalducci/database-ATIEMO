import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from 'src/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async findAllUsers() {
    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  }
  async create(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .insert([{ ...userData, password: hashedPassword }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findByEmail(email: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  async findAllDrivers() {
    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .select('*')
      .eq('tipo', 'Chofer'); // Filtra por tipo = "Chofer"

    if (error) throw new Error(error.message);
    return data;
  }

  async updateUser(id: number, updateData: any) {
    // Si la contraseña se incluye, la hasheamos
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteUser(id: number) {
  const { data, error } = await this.supabase
    .getClient()
    .from('users')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { message: 'Usuario eliminado correctamente', data };
}
}
