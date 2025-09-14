import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const url = 'https://fcewuvmgibthopfuyqkb.supabase.co';
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZXd1dm1naWJ0aG9wZnV5cWtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg1NTgzMiwiZXhwIjoyMDczNDMxODMyfQ.UIMDpBHzi80XhtyLjJslwEbkCoWKaQkg_K70NZjJxAw';

    if (!url || !key) {
      throw new Error(
        'Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY',
      );
    }

    this.client = createClient(url, key);
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
