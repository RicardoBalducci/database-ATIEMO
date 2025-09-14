import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from 'src/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

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
}
