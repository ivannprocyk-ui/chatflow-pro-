import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OrganizationsService } from '../organizations/organizations.service';
import { MessagesService } from '../messages/messages.service';
import { PROMPT_TEMPLATES } from './prompt-templates';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly flowiseUrl: string;
  private readonly flowiseApiKey: string;
  private readonly flowiseFlowId: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private organizationsService: OrganizationsService,
    private messagesService: MessagesService,
  ) {
    this.flowiseUrl = this.configService.get<string>('FLOWISE_API_URL') || '';
    this.flowiseApiKey = this.configService.get<string>('FLOWISE_API_KEY') || '';
    this.flowiseFlowId = this.configService.get<string>('FLOWISE_FLOW_ID') || '';
  }

  async generateResponse(
    organizationId: string,
    contactPhone: string,
    message: string,
    conversationHistory?: any[],
  ): Promise<string> {
    try {
      // Get organization config
      const org = await this.organizationsService.findOne(organizationId);

      if (!org.aiEnabled) {
        return 'Gracias por tu mensaje. Un agente humano te responderá pronto.';
      }

      // Build system prompt with organization data
      const systemPrompt = this.buildSystemPrompt(org);

      this.logger.log(`Generating AI response for org ${org.name}, role: ${org.aiRole}`);

      // Check if Flowise is configured
      if (!this.flowiseUrl || !this.flowiseApiKey || !this.flowiseFlowId) {
        this.logger.warn('Flowise not configured, using fallback response');
        return this.getFallbackResponse(org);
      }

      // Call Flowise API
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.flowiseUrl}/prediction/${this.flowiseFlowId}`,
          {
            question: message,
            overrideConfig: {
              sessionId: `org-${organizationId}-${contactPhone}`,
              systemMessagePrompt: systemPrompt,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.flowiseApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.text || response.data.answer || 'Lo siento, no pude generar una respuesta.';
    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      const org = await this.organizationsService.findOne(organizationId);
      return this.getFallbackResponse(org);
    }
  }

  private buildSystemPrompt(org: any): string {
    const template = PROMPT_TEMPLATES[org.aiRole] || PROMPT_TEMPLATES.asistente;

    return template
      .replace(/{{company_name}}/g, org.name)
      .replace(/{{company_info}}/g, org.aiCompanyInfo || 'Información no disponible')
      .replace(/{{products_list}}/g, org.aiProductsInfo || 'Productos no disponibles')
      .replace(/{{objective}}/g, org.aiObjective || 'Ayudar al cliente');
  }

  private getFallbackResponse(org: any): string {
    return `Gracias por tu mensaje. ${org.name} te responderá pronto durante nuestro horario de atención.`;
  }

  shouldAutoRespond(org: any, message: string): boolean {
    if (!org.aiEnabled) {
      return false;
    }

    // Check business hours if enabled
    if (org.aiBusinessHoursOnly) {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday

      // Default business hours: Mon-Fri 9am-6pm
      if (day === 0 || day === 6) return false; // Weekend
      if (hour < 9 || hour >= 18) return false; // Outside 9-6
    }

    // Check if message requests human
    const humanKeywords = [
      'hablar con persona',
      'hablar con humano',
      'agente real',
      'queja',
      'reclamo',
      'gerente',
      'supervisor',
    ];

    const messageLower = message.toLowerCase();
    if (humanKeywords.some((keyword) => messageLower.includes(keyword))) {
      return false;
    }

    return true;
  }

  // Lead scoring based on message content
  calculateLeadScore(message: string): number {
    const messageLower = message.toLowerCase();
    let score = 0;

    // Intent keywords
    if (messageLower.includes('precio') || messageLower.includes('costo')) score += 10;
    if (messageLower.includes('comprar') || messageLower.includes('ordenar')) score += 30;
    if (messageLower.includes('cuando') || messageLower.includes('horario')) score += 5;
    if (messageLower.includes('direccion') || messageLower.includes('ubicacion')) score += 15;
    if (messageLower.includes('tarjeta') || messageLower.includes('pago')) score += 20;

    return Math.min(score, 50); // Max 50 points per message
  }
}
