import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from '../common/types';

@Injectable()
export class OrganizationsService {
  // Mock data storage (in-memory)
  private organizations: Organization[] = [
    {
      id: '1',
      name: 'Pizzería Don Juan (Demo)',
      slug: 'pizzeria-don-juan-demo',
      plan: 'starter',
      isActive: true,
      aiEnabled: true,
      aiRole: 'vendedor',
      aiCompanyInfo: 'Pizzería familiar desde 1980. Vendemos pizzas artesanales con ingredientes frescos.',
      aiProductsInfo: '• Pizza Margarita - $150\n• Pizza Pepperoni - $180\n• Pizza Hawaiana - $170\n• Bebidas - $30',
      aiObjective: 'Tomar pedidos y dar información sobre productos',
      aiBusinessHoursOnly: false,
      whatsappMethod: 'qr',
      whatsappConnected: false,
      followupEnabled: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  async findAll(): Promise<Organization[]> {
    return this.organizations;
  }

  async findOne(id: string): Promise<Organization> {
    const organization = this.organizations.find((org) => org.id === id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return organization;
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const newOrganization: Organization = {
      id: uuidv4(),
      name: data.name || 'New Organization',
      slug: data.slug || this.generateSlug(data.name || 'new-organization'),
      plan: data.plan || 'starter',
      isActive: true,
      aiEnabled: data.aiEnabled !== undefined ? data.aiEnabled : true,
      aiRole: data.aiRole || 'asistente',
      aiCompanyInfo: data.aiCompanyInfo || '',
      aiProductsInfo: data.aiProductsInfo || '',
      aiObjective: data.aiObjective || 'Ayudar a los clientes',
      aiBusinessHoursOnly: data.aiBusinessHoursOnly || false,
      whatsappMethod: data.whatsappMethod || 'qr',
      whatsappConnected: false,
      followupEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.organizations.push(newOrganization);
    return newOrganization;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const index = this.organizations.findIndex((org) => org.id === id);
    if (index === -1) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    const updated = {
      ...this.organizations[index],
      ...data,
      updatedAt: new Date(),
    };

    this.organizations[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = this.organizations.findIndex((org) => org.id === id);
    if (index === -1) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    this.organizations.splice(index, 1);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
}
