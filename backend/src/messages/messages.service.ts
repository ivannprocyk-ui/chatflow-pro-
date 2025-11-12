import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../common/types';
import { ContactsService } from '../contacts/contacts.service';

@Injectable()
export class MessagesService {
  // Mock data storage (in-memory)
  private messages: Message[] = [
    {
      id: '1',
      organizationId: '1',
      contactId: '1',
      direction: 'inbound',
      messageContent: 'Hola, tienen pizzas disponibles?',
      status: 'delivered',
      isAutoReply: false,
      sentAt: new Date('2024-01-15T14:30:00'),
    },
    {
      id: '2',
      organizationId: '1',
      contactId: '1',
      direction: 'outbound',
      messageContent: '¡Hola! Sí, tenemos pizzas disponibles. Margarita $150, Pepperoni $180...',
      status: 'delivered',
      isAutoReply: true,
      sentAt: new Date('2024-01-15T14:30:15'),
      deliveredAt: new Date('2024-01-15T14:30:16'),
    },
  ];

  constructor(private contactsService: ContactsService) {}

  async findAll(organizationId: string, filters: any = {}): Promise<Message[]> {
    let filtered = this.messages.filter((m) => m.organizationId === organizationId);

    if (filters.contactId) {
      filtered = filtered.filter((m) => m.contactId === filters.contactId);
    }

    if (filters.direction) {
      filtered = filtered.filter((m) => m.direction === filters.direction);
    }

    if (filters.status) {
      filtered = filtered.filter((m) => m.status === filters.status);
    }

    // Sort by date descending
    return filtered.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async findOne(id: string, organizationId: string): Promise<Message> {
    const message = this.messages.find((m) => m.id === id && m.organizationId === organizationId);
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async getConversation(contactId: string, organizationId: string, limit = 50): Promise<Message[]> {
    return this.messages
      .filter((m) => m.contactId === contactId && m.organizationId === organizationId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
      .slice(-limit);
  }

  async create(organizationId: string, data: Partial<Message>): Promise<Message> {
    const newMessage: Message = {
      id: uuidv4(),
      organizationId,
      contactId: data.contactId!,
      direction: data.direction || 'outbound',
      messageContent: data.messageContent || '',
      status: data.status || 'sent',
      isAutoReply: data.isAutoReply || false,
      templateName: data.templateName,
      campaignName: data.campaignName,
      metadata: data.metadata,
      sentAt: new Date(),
    };

    this.messages.push(newMessage);

    // Update contact message count
    await this.contactsService.incrementMessageCount(newMessage.contactId, newMessage.direction);

    return newMessage;
  }

  async updateStatus(id: string, status: Message['status']): Promise<Message> {
    const message = this.messages.find((m) => m.id === id);
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    message.status = status;

    if (status === 'delivered' && !message.deliveredAt) {
      message.deliveredAt = new Date();
    }

    if (status === 'read' && !message.readAt) {
      message.readAt = new Date();
    }

    return message;
  }

  // Analytics
  async getStats(organizationId: string, dateRange?: { start: Date; end: Date }) {
    let filtered = this.messages.filter((m) => m.organizationId === organizationId);

    if (dateRange) {
      filtered = filtered.filter(
        (m) => m.sentAt >= dateRange.start && m.sentAt <= dateRange.end,
      );
    }

    const totalMessages = filtered.length;
    const byDirection = {
      inbound: filtered.filter((m) => m.direction === 'inbound').length,
      outbound: filtered.filter((m) => m.direction === 'outbound').length,
    };

    const byStatus = {
      sent: filtered.filter((m) => m.status === 'sent').length,
      delivered: filtered.filter((m) => m.status === 'delivered').length,
      read: filtered.filter((m) => m.status === 'read').length,
      failed: filtered.filter((m) => m.status === 'failed').length,
    };

    const autoReplies = filtered.filter((m) => m.isAutoReply).length;

    // Average response time (for auto-replies)
    const responseTimes: number[] = [];
    for (let i = 1; i < filtered.length; i++) {
      const current = filtered[i];
      const previous = filtered[i - 1];
      if (
        current.direction === 'outbound' &&
        previous.direction === 'inbound' &&
        current.isAutoReply
      ) {
        const responseTime = current.sentAt.getTime() - previous.sentAt.getTime();
        responseTimes.push(responseTime);
      }
    }

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000 // in seconds
        : 0;

    // Messages by hour
    const byHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) byHour[i] = 0;
    filtered.forEach((m) => {
      const hour = m.sentAt.getHours();
      byHour[hour]++;
    });

    // Messages by day (last 7 days)
    const byDay: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    last7Days.forEach((day) => (byDay[day] = 0));
    filtered.forEach((m) => {
      const day = m.sentAt.toISOString().split('T')[0];
      if (byDay[day] !== undefined) byDay[day]++;
    });

    return {
      totalMessages,
      byDirection,
      byStatus,
      autoReplies,
      autoReplyPercentage: totalMessages > 0 ? (autoReplies / totalMessages) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      byHour,
      byDay,
      deliveryRate:
        byDirection.outbound > 0
          ? ((byStatus.delivered + byStatus.read) / byDirection.outbound) * 100
          : 0,
    };
  }
}
