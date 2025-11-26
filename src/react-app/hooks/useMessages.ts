import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Message {
  id: string;
  organization_id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  template_name?: string | null;
  template_id?: string | null;
  message_content?: string | null;
  whatsapp_message_id?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  error_message?: string | null;
  metadata: Record<string, any>;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface MessageFilters {
  contact_id?: string;
  campaign_id?: string;
  status?: string;
  direction?: 'inbound' | 'outbound';
  dateFrom?: string;
  dateTo?: string;
}

export function useMessages() {
  const { organization } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load messages
  const loadMessages = useCallback(async (filters?: MessageFilters) => {
    if (!organization?.id) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('messages')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }
      if (filters?.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setMessages(data || []);
    } catch (err: any) {
      console.error('[useMessages] Error loading messages:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  // Create message
  const createMessage = useCallback(async (messageData: Partial<Message>) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          organization_id: organization.id,
          contact_id: messageData.contact_id!,
          direction: messageData.direction || 'outbound',
          status: messageData.status || 'pending',
          template_name: messageData.template_name,
          template_id: messageData.template_id,
          message_content: messageData.message_content,
          whatsapp_message_id: messageData.whatsapp_message_id,
          campaign_id: messageData.campaign_id,
          campaign_name: messageData.campaign_name,
          metadata: messageData.metadata || {},
          sent_at: messageData.sent_at,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [data, ...prev]);

      return data;
    } catch (err: any) {
      console.error('[useMessages] Error creating message:', err);
      throw err;
    }
  }, [organization?.id]);

  // Update message
  const updateMessage = useCallback(async (id: string, updates: Partial<Message>) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organization.id)
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => prev.map(m => m.id === id ? data : m));

      return data;
    } catch (err: any) {
      console.error('[useMessages] Error updating message:', err);
      throw err;
    }
  }, [organization?.id]);

  // Delete message
  const deleteMessage = useCallback(async (id: string) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .eq('organization_id', organization.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error('[useMessages] Error deleting message:', err);
      throw err;
    }
  }, [organization?.id]);

  // Get conversation for a contact
  const getConversation = useCallback(async (contactId: string) => {
    if (!organization?.id) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (err: any) {
      console.error('[useMessages] Error getting conversation:', err);
      return [];
    }
  }, [organization?.id]);

  // Get message stats
  const getStats = useCallback(async (dateRange?: { from: string; to: string }) => {
    if (!organization?.id) return null;

    try {
      let query = supabase
        .from('messages')
        .select('status, direction')
        .eq('organization_id', organization.id);

      if (dateRange) {
        query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        sent: data.filter(m => m.status === 'sent' || m.status === 'delivered' || m.status === 'read').length,
        delivered: data.filter(m => m.status === 'delivered' || m.status === 'read').length,
        read: data.filter(m => m.status === 'read').length,
        failed: data.filter(m => m.status === 'failed').length,
        pending: data.filter(m => m.status === 'pending').length,
        inbound: data.filter(m => m.direction === 'inbound').length,
        outbound: data.filter(m => m.direction === 'outbound').length,
      };

      return stats;
    } catch (err: any) {
      console.error('[useMessages] Error getting stats:', err);
      return null;
    }
  }, [organization?.id]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          console.log('[useMessages] Real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            setMessages(prev => [payload.new as Message, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  return {
    messages,
    isLoading,
    error,
    loadMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    getConversation,
    getStats,
  };
}
