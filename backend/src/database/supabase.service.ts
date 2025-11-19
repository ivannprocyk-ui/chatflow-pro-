/**
 * Supabase Service para NestJS Backend
 *
 * Este servicio proporciona acceso a Supabase desde el backend de NestJS.
 * Usa el service_role key para bypass RLS cuando sea necesario.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing SUPABASE_ANON_KEY environment variable');
    }

    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
    }

    // Cliente con anon key (respeta RLS)
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Cliente admin con service role key (bypass RLS)
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ Supabase clients initialized');
  }

  /**
   * Cliente normal (respeta RLS)
   * Usar para operaciones que deben respetar las políticas de seguridad
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Cliente admin (bypass RLS)
   * Usar SOLO cuando sea absolutamente necesario (crons, webhooks, operaciones del sistema)
   */
  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  /**
   * Crear un cliente con autenticación de usuario específico
   * Útil para operaciones en nombre de un usuario
   */
  async getClientForUser(userId: string): Promise<SupabaseClient> {
    // Crear un access token temporal para este usuario
    const { data, error } = await this.supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    // Retornar cliente configurado con el contexto de este usuario
    return this.supabase;
  }

  /**
   * Obtener organization_id de un usuario
   */
  async getOrganizationId(userId: string): Promise<string> {
    const { data, error } = await this.supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get organization_id: ${error.message}`);
    }

    return data.organization_id;
  }

  /**
   * Verificar que un usuario tiene acceso a una organización
   */
  async verifyOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
    const { data, error } = await this.supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  }

  /**
   * Ejecutar una función de Postgres
   */
  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<T> {
    const { data, error } = await this.supabaseAdmin.rpc(functionName, params);

    if (error) {
      throw new Error(`RPC error in ${functionName}: ${error.message}`);
    }

    return data as T;
  }

  /**
   * Crear una organización con usuario admin
   */
  async createOrganization(params: {
    name: string;
    slug: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
  }) {
    const { name, slug, adminEmail, adminPassword, adminName } = params;

    // 1. Crear la organización
    const { data: org, error: orgError } = await this.supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug,
        plan: 'starter',
        is_active: true,
      })
      .select()
      .single();

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // 2. Crear el usuario admin en Supabase Auth
    const { data: authUser, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        organization_id: org.id,
        full_name: adminName,
      },
    });

    if (authError) {
      // Rollback: eliminar organización
      await this.supabaseAdmin.from('organizations').delete().eq('id', org.id);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    // 3. Crear el usuario en la tabla users
    const { error: userError } = await this.supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      organization_id: org.id,
      email: adminEmail,
      full_name: adminName,
      role: 'admin',
      is_active: true,
    });

    if (userError) {
      // Rollback
      await this.supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await this.supabaseAdmin.from('organizations').delete().eq('id', org.id);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    // 4. Crear tags predefinidos
    const defaultTags = [
      { name: 'VIP', color: '#8B5CF6' },
      { name: 'Cliente Nuevo', color: '#10B981' },
      { name: 'Seguimiento Urgente', color: '#EF4444' },
      { name: 'Inactivo', color: '#6B7280' },
      { name: 'Prospecto Caliente', color: '#F59E0B' },
    ];

    await this.supabaseAdmin.from('tags').insert(
      defaultTags.map((tag) => ({
        organization_id: org.id,
        ...tag,
      }))
    );

    // 5. Crear campos CRM predefinidos
    const defaultFields = [
      { name: 'name', label: 'Nombre', field_type: 'text', required: true, order: 1 },
      { name: 'phone', label: 'Teléfono', field_type: 'phone', required: true, order: 2 },
      { name: 'email', label: 'Email', field_type: 'email', required: false, order: 3 },
      { name: 'company', label: 'Empresa', field_type: 'text', required: false, order: 4 },
      { name: 'position', label: 'Cargo', field_type: 'text', required: false, order: 5 },
      { name: 'cost', label: 'Costo/Valor', field_type: 'currency', required: false, order: 6 },
      { name: 'notes', label: 'Notas', field_type: 'textarea', required: false, order: 7 },
    ];

    await this.supabaseAdmin.from('crm_fields').insert(
      defaultFields.map((field) => ({
        organization_id: org.id,
        visible: true,
        ...field,
      }))
    );

    // 6. Crear estados CRM predefinidos
    const defaultStatuses = [
      { name: 'lead', label: 'Lead', color: 'blue', order: 1 },
      { name: 'contacted', label: 'Contactado', color: 'yellow', order: 2 },
      { name: 'customer', label: 'Cliente', color: 'purple', order: 3 },
      { name: 'active', label: 'Activo', color: 'green', order: 4 },
      { name: 'inactive', label: 'Inactivo', color: 'yellow', order: 5 },
      { name: 'blocked', label: 'Bloqueado', color: 'red', order: 6 },
    ];

    await this.supabaseAdmin.from('crm_statuses').insert(
      defaultStatuses.map((status) => ({
        organization_id: org.id,
        ...status,
      }))
    );

    return {
      organization: org,
      user: authUser.user,
    };
  }

  /**
   * Obtener estadísticas de la organización
   */
  async getOrganizationStats(organizationId: string) {
    return this.rpc('calculate_contact_stats', { org_id: organizationId });
  }

  /**
   * Obtener estadísticas de mensajes
   */
  async getMessageStats(organizationId: string, days: number = 30) {
    return this.rpc('calculate_message_stats', {
      org_id: organizationId,
      days,
    });
  }

  /**
   * Subscribe a cambios en una tabla (Realtime)
   */
  subscribeToTable(
    tableName: string,
    callback: (payload: any) => void,
    filter?: { column: string; value: string }
  ) {
    const channel = this.supabase
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
      channel.unsubscribe();
    };
  }
}
