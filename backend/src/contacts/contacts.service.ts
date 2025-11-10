import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Contact } from '../common/types';

@Injectable()
export class ContactsService {
  // Mock data storage (in-memory)
  private contacts: Contact[] = [
    {
      id: '1',
      organizationId: '1',
      phone: '+52 1 234 567 890',
      status: 'lead',
      customFields: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
      },
      messagesReceived: 5,
      messagesSent: 4,
      lastContactAt: new Date('2024-01-15'),
      leadScore: 45,
      followupCount: 0,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      organizationId: '1',
      phone: '+52 1 987 654 321',
      status: 'customer',
      customFields: {
        name: 'María García',
        email: 'maria@example.com',
      },
      messagesReceived: 12,
      messagesSent: 10,
      lastContactAt: new Date('2024-01-14'),
      leadScore: 85,
      followupCount: 0,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-14'),
    },
  ];

  async findAll(organizationId: string, filters: any = {}): Promise<Contact[]> {
    let filtered = this.contacts.filter((c) => c.organizationId === organizationId);

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.phone.includes(search) ||
          c.customFields?.name?.toLowerCase().includes(search) ||
          c.customFields?.email?.toLowerCase().includes(search),
      );
    }

    return filtered;
  }

  async findOne(id: string, organizationId: string): Promise<Contact> {
    const contact = this.contacts.find((c) => c.id === id && c.organizationId === organizationId);
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
    return contact;
  }

  async findByPhone(phone: string, organizationId: string): Promise<Contact | null> {
    return this.contacts.find((c) => c.phone === phone && c.organizationId === organizationId) || null;
  }

  async create(organizationId: string, data: Partial<Contact>): Promise<Contact> {
    // Check if contact already exists
    const existing = await this.findByPhone(data.phone!, organizationId);
    if (existing) {
      return existing;
    }

    const newContact: Contact = {
      id: uuidv4(),
      organizationId,
      phone: data.phone || '',
      status: data.status || 'lead',
      customFields: data.customFields || {},
      messagesReceived: 0,
      messagesSent: 0,
      leadScore: 0,
      followupCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contacts.push(newContact);
    return newContact;
  }

  async update(id: string, organizationId: string, data: Partial<Contact>): Promise<Contact> {
    const index = this.contacts.findIndex((c) => c.id === id && c.organizationId === organizationId);
    if (index === -1) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    const updated = {
      ...this.contacts[index],
      ...data,
      updatedAt: new Date(),
    };

    this.contacts[index] = updated;
    return updated;
  }

  async incrementMessageCount(contactId: string, direction: 'inbound' | 'outbound') {
    const contact = this.contacts.find((c) => c.id === contactId);
    if (contact) {
      if (direction === 'inbound') {
        contact.messagesReceived++;
      } else {
        contact.messagesSent++;
      }
      contact.lastContactAt = new Date();
      contact.updatedAt = new Date();
    }
  }

  async updateLeadScore(contactId: string, scoreIncrease: number) {
    const contact = this.contacts.find((c) => c.id === contactId);
    if (contact) {
      contact.leadScore = Math.min(100, contact.leadScore + scoreIncrease);
      contact.updatedAt = new Date();
    }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const index = this.contacts.findIndex((c) => c.id === id && c.organizationId === organizationId);
    if (index === -1) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    this.contacts.splice(index, 1);
  }

  // Analytics
  async getStats(organizationId: string) {
    const orgContacts = this.contacts.filter((c) => c.organizationId === organizationId);

    return {
      total: orgContacts.length,
      byStatus: {
        lead: orgContacts.filter((c) => c.status === 'lead').length,
        contacted: orgContacts.filter((c) => c.status === 'contacted').length,
        customer: orgContacts.filter((c) => c.status === 'customer').length,
        churned: orgContacts.filter((c) => c.status === 'churned').length,
      },
      averageLeadScore: orgContacts.reduce((sum, c) => sum + c.leadScore, 0) / (orgContacts.length || 1),
    };
  }
}
