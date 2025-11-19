import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Contact {
  id: string;
  organization_id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  position?: string | null;
  status: string;
  custom_fields: Record<string, any>;
  messages_sent: number;
  messages_received: number;
  last_contact_at?: string | null;
  lead_score: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactFilters {
  search?: string;
  status?: string;
  tags?: string[];
}

export function useContacts() {
  const { organization } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contacts from Supabase
  const loadContacts = useCallback(async (filters?: ContactFilters) => {
    if (!organization?.id) {
      setContacts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setContacts(data || []);
    } catch (err: any) {
      console.error('[useContacts] Error loading contacts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  // Create contact
  const createContact = useCallback(async (contactData: Partial<Contact>) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: organization.id,
          phone: contactData.phone,
          name: contactData.name,
          email: contactData.email,
          company: contactData.company,
          position: contactData.position,
          status: contactData.status || 'lead',
          custom_fields: contactData.custom_fields || {},
          messages_sent: 0,
          messages_received: 0,
          lead_score: contactData.lead_score || 0,
          notes: contactData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setContacts(prev => [data, ...prev]);

      return data;
    } catch (err: any) {
      console.error('[useContacts] Error creating contact:', err);
      throw err;
    }
  }, [organization?.id]);

  // Update contact
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organization.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setContacts(prev => prev.map(c => c.id === id ? data : c));

      return data;
    } catch (err: any) {
      console.error('[useContacts] Error updating contact:', err);
      throw err;
    }
  }, [organization?.id]);

  // Delete contact
  const deleteContact = useCallback(async (id: string) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('organization_id', organization.id);

      if (error) throw error;

      // Remove from local state
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('[useContacts] Error deleting contact:', err);
      throw err;
    }
  }, [organization?.id]);

  // Bulk create contacts
  const bulkCreateContacts = useCallback(async (contactsData: Partial<Contact>[]) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const contactsToInsert = contactsData.map(c => ({
        organization_id: organization.id,
        phone: c.phone!,
        name: c.name,
        email: c.email,
        company: c.company,
        position: c.position,
        status: c.status || 'lead',
        custom_fields: c.custom_fields || {},
        messages_sent: 0,
        messages_received: 0,
        lead_score: c.lead_score || 0,
        notes: c.notes,
      }));

      const { data, error } = await supabase
        .from('contacts')
        .insert(contactsToInsert)
        .select();

      if (error) throw error;

      // Add to local state
      setContacts(prev => [...data, ...prev]);

      return data;
    } catch (err: any) {
      console.error('[useContacts] Error bulk creating contacts:', err);
      throw err;
    }
  }, [organization?.id]);

  // Get contact stats
  const getStats = useCallback(async () => {
    if (!organization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('status')
        .eq('organization_id', organization.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        lead: data.filter(c => c.status === 'lead').length,
        qualified: data.filter(c => c.status === 'qualified').length,
        customer: data.filter(c => c.status === 'customer').length,
        inactive: data.filter(c => c.status === 'inactive').length,
      };

      return stats;
    } catch (err: any) {
      console.error('[useContacts] Error getting stats:', err);
      return null;
    }
  }, [organization?.id]);

  // Initial load
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          console.log('[useContacts] Real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            setContacts(prev => [payload.new as Contact, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setContacts(prev => prev.map(c => c.id === payload.new.id ? payload.new as Contact : c));
          } else if (payload.eventType === 'DELETE') {
            setContacts(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  return {
    contacts,
    isLoading,
    error,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
    bulkCreateContacts,
    getStats,
  };
}
