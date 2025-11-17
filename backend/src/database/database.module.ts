import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): SupabaseClient => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseKey = configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase URL and Key must be configured');
        }

        return createClient(supabaseUrl, supabaseKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: false,
          },
        });
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class DatabaseModule {}
