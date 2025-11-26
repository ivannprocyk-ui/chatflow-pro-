/**
 * Supabase Client Configuration
 *
 * Este archivo configura el cliente de Supabase para el frontend.
 * Usa las variables de entorno para la URL y la clave anónima.
 */

import { createClient } from '@supabase/supabase-js';

// Validar que las variables de entorno existen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error(
    '❌ Missing environment variable: VITE_SUPABASE_URL\n' +
    'Please add it to your .env.local file and restart the dev server'
  );
}

if (!supabaseAnonKey) {
  console.error(
    '❌ Missing environment variable: VITE_SUPABASE_ANON_KEY\n' +
    'Please add it to your .env.local file and restart the dev server'
  );
}

/**
 * Cliente de Supabase configurado con:
 * - Autenticación automática
 * - Persistencia de sesión en localStorage
 * - Refresh automático de tokens
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Database Types
 *
 * Genera estos tipos automáticamente con:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/react-app/lib/database.types.ts
 */
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          is_active: boolean;
          ai_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: string;
          is_active?: boolean;
          ai_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: string;
          is_active?: boolean;
          ai_enabled?: boolean;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          phone: string;
          name: string | null;
          email: string | null;
          status: string;
          custom_fields: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          phone: string;
          name?: string | null;
          email?: string | null;
          status?: string;
          custom_fields?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          phone?: string;
          name?: string | null;
          email?: string | null;
          status?: string;
          custom_fields?: Record<string, any>;
          updated_at?: string;
        };
      };
      // Agregar más tipos según necesites
    };
    Views: {
      dashboard_analytics: {
        Row: {
          organization_id: string;
          organization_name: string;
          total_contacts: number;
          total_messages: number;
        };
      };
    };
    Functions: {
      calculate_contact_stats: {
        Args: { org_id: string };
        Returns: {
          total_contacts: number;
          active_contacts: number;
          leads: number;
          customers: number;
        };
      };
    };
  };
};

/**
 * Helper para obtener el organization_id del usuario actual
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Primero intentar obtenerlo del JWT
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user?.user_metadata?.organization_id) {
    return session.session.user.user_metadata.organization_id;
  }

  // Si no está en el JWT, buscarlo en la tabla users
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching organization_id:', error);
    return null;
  }

  return data?.organization_id || null;
}

/**
 * Helper para subscribe a cambios en tiempo real
 */
export function subscribeToTable(
  tableName: string,
  callback: (payload: any) => void,
  filter?: { column: string; value: string }
) {
  let subscription = supabase
    .channel(`public:${tableName}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Helper para autenticación
 */
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signUp: async (email: string, password: string, organizationId?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_id: organizationId,
        },
      },
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};

export default supabase;
