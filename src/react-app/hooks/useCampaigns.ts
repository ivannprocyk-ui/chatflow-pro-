import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  template_name?: string | null;
  template_id?: string | null;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  const { organization } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    if (!organization?.id) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCampaigns(data || []);
    } catch (err: any) {
      console.error('[useCampaigns] Error loading campaigns:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  // Create campaign
  const createCampaign = useCallback(async (campaignData: Partial<Campaign>) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          organization_id: organization.id,
          name: campaignData.name!,
          description: campaignData.description,
          template_name: campaignData.template_name,
          template_id: campaignData.template_id,
          status: campaignData.status || 'draft',
          total_contacts: campaignData.total_contacts || 0,
          sent_count: 0,
          delivered_count: 0,
          read_count: 0,
          failed_count: 0,
          scheduled_at: campaignData.scheduled_at,
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [data, ...prev]);

      return data;
    } catch (err: any) {
      console.error('[useCampaigns] Error creating campaign:', err);
      throw err;
    }
  }, [organization?.id]);

  // Update campaign
  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organization.id)
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => prev.map(c => c.id === id ? data : c));

      return data;
    } catch (err: any) {
      console.error('[useCampaigns] Error updating campaign:', err);
      throw err;
    }
  }, [organization?.id]);

  // Delete campaign
  const deleteCampaign = useCallback(async (id: string) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
        .eq('organization_id', organization.id);

      if (error) throw error;

      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('[useCampaigns] Error deleting campaign:', err);
      throw err;
    }
  }, [organization?.id]);

  // Get campaign stats
  const getStats = useCallback(async () => {
    if (!organization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('status, sent_count, failed_count')
        .eq('organization_id', organization.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        completed: data.filter(c => c.status === 'completed').length,
        running: data.filter(c => c.status === 'running').length,
        totalSent: data.reduce((sum, c) => sum + c.sent_count, 0),
        totalFailed: data.reduce((sum, c) => sum + c.failed_count, 0),
      };

      return stats;
    } catch (err: any) {
      console.error('[useCampaigns] Error getting stats:', err);
      return null;
    }
  }, [organization?.id]);

  // Initial load
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          console.log('[useCampaigns] Real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            setCampaigns(prev => [payload.new as Campaign, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCampaigns(prev => prev.map(c => c.id === payload.new.id ? payload.new as Campaign : c));
          } else if (payload.eventType === 'DELETE') {
            setCampaigns(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  return {
    campaigns,
    isLoading,
    error,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getStats,
  };
}
