import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from '../common/types';
import { SUPABASE_CLIENT } from '../database/database.module';

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async findAll(): Promise<Organization[]> {
    const { data: organizations, error } = await this.supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    return (organizations || []).map(this.mapDbOrgToOrg);
  }

  async findOne(id: string): Promise<Organization> {
    const { data: organization, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return this.mapDbOrgToOrg(organization);
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const newOrganization = {
      id: uuidv4(),
      name: data.name || 'New Organization',
      slug: data.slug || this.generateSlug(data.name || 'new-organization'),
      plan: data.plan || 'starter',
      is_active: true,
      ai_enabled: data.aiEnabled !== undefined ? data.aiEnabled : true,
      ai_role: data.aiRole || 'asistente',
      ai_company_info: data.aiCompanyInfo || '',
      ai_products_info: data.aiProductsInfo || '',
      ai_objective: data.aiObjective || 'Ayudar a los clientes',
      ai_business_hours_only: data.aiBusinessHoursOnly || false,
      whatsapp_method: data.whatsappMethod || 'qr',
      whatsapp_connected: false,
      followup_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdOrg, error } = await this.supabase
      .from('organizations')
      .insert(newOrganization)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create organization: ${error.message}`);
    }

    return this.mapDbOrgToOrg(createdOrg);
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.aiEnabled !== undefined) updateData.ai_enabled = data.aiEnabled;
    if (data.aiRole !== undefined) updateData.ai_role = data.aiRole;
    if (data.aiCompanyInfo !== undefined) updateData.ai_company_info = data.aiCompanyInfo;
    if (data.aiProductsInfo !== undefined) updateData.ai_products_info = data.aiProductsInfo;
    if (data.aiObjective !== undefined) updateData.ai_objective = data.aiObjective;
    if (data.aiBusinessHoursOnly !== undefined) updateData.ai_business_hours_only = data.aiBusinessHoursOnly;
    if (data.whatsappMethod !== undefined) updateData.whatsapp_method = data.whatsappMethod;
    if (data.whatsappConnected !== undefined) updateData.whatsapp_connected = data.whatsappConnected;
    if (data.whatsappPhone !== undefined) updateData.whatsapp_phone = data.whatsappPhone;
    if (data.whatsappInstanceId !== undefined) updateData.whatsapp_instance_id = data.whatsappInstanceId;
    if (data.metaAccessToken !== undefined) updateData.meta_access_token = data.metaAccessToken;
    if (data.metaWabaId !== undefined) updateData.meta_waba_id = data.metaWabaId;
    if (data.followupEnabled !== undefined) updateData.followup_enabled = data.followupEnabled;
    if (data.followupConfig !== undefined) updateData.followup_config = data.followupConfig;

    const { data: updatedOrg, error } = await this.supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedOrg) {
      throw new NotFoundException(`Failed to update organization: ${error?.message}`);
    }

    return this.mapDbOrgToOrg(updatedOrg);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new NotFoundException(`Failed to delete organization: ${error.message}`);
    }
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now()
    );
  }

  /**
   * Map database organization (snake_case) to application Organization (camelCase)
   */
  private mapDbOrgToOrg(dbOrg: any): Organization {
    return {
      id: dbOrg.id,
      name: dbOrg.name,
      slug: dbOrg.slug,
      plan: dbOrg.plan,
      isActive: dbOrg.is_active,
      aiEnabled: dbOrg.ai_enabled,
      aiRole: dbOrg.ai_role,
      aiCompanyInfo: dbOrg.ai_company_info,
      aiProductsInfo: dbOrg.ai_products_info,
      aiObjective: dbOrg.ai_objective,
      aiBusinessHoursOnly: dbOrg.ai_business_hours_only,
      whatsappMethod: dbOrg.whatsapp_method,
      whatsappConnected: dbOrg.whatsapp_connected,
      whatsappPhone: dbOrg.whatsapp_phone,
      whatsappInstanceId: dbOrg.whatsapp_instance_id,
      metaAccessToken: dbOrg.meta_access_token,
      metaWabaId: dbOrg.meta_waba_id,
      followupEnabled: dbOrg.followup_enabled,
      followupConfig: dbOrg.followup_config,
      createdAt: new Date(dbOrg.created_at),
      updatedAt: new Date(dbOrg.updated_at),
    };
  }
}
