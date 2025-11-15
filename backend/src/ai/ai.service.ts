import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OrganizationsService } from '../organizations/organizations.service';
import { MessagesService } from '../messages/messages.service';
import { BotConfigService } from '../bot-config/bot-config.service';
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
    private botConfigService: BotConfigService,
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

  /**
   * Build custom prompt from bot-config
   * Uses bot-config instead of organization config
   */
  buildCustomPrompt(botConfig: any): string {
    // If custom prompt, use it directly
    if (botConfig.agentType === 'custom' && botConfig.customPrompt) {
      return this.replaceVariables(botConfig.customPrompt, botConfig);
    }

    // Use template based on agent type
    const template = PROMPT_TEMPLATES[botConfig.agentType] || PROMPT_TEMPLATES.asistente;
    return this.replaceVariables(template, botConfig);
  }

  /**
   * Replace variables in prompt template
   */
  private replaceVariables(template: string, botConfig: any): string {
    return template
      .replace(/{{company_name}}/g, botConfig.businessName || 'la empresa')
      .replace(/{{company_info}}/g, botConfig.businessDescription || 'Información no disponible')
      .replace(/{{products_list}}/g, botConfig.products || 'Productos no disponibles')
      .replace(/{{business_hours}}/g, botConfig.businessHours || 'Horario no especificado')
      .replace(/{{language}}/g, botConfig.language || 'es')
      .replace(/{{tone}}/g, botConfig.tone || 'casual')
      .replace(/{{objective}}/g, this.getObjectiveByAgentType(botConfig.agentType));
  }

  /**
   * Get objective based on agent type
   */
  private getObjectiveByAgentType(agentType: string): string {
    const objectives: Record<string, string> = {
      vendedor: 'Ayudar a los clientes a encontrar productos y cerrar ventas',
      asistente: 'Resolver dudas y problemas de los clientes',
      secretaria: 'Agendar citas y organizar reuniones',
      custom: 'Ayudar al cliente',
    };
    return objectives[agentType] || objectives.custom;
  }

  /**
   * Handle ChatWoot message webhook
   * Main method for processing messages from ChatWoot
   */
  async handleChatWootMessage(webhook: any): Promise<string> {
    try {
      this.logger.log('Processing ChatWoot message webhook');

      // Extract data from webhook
      const inboxId = webhook.inbox?.id;
      const conversationId = webhook.conversation?.id;
      const messageContent = webhook.content;
      const contactPhone = webhook.sender?.phone_number || webhook.sender?.id;

      if (!inboxId || !messageContent) {
        this.logger.warn('Invalid ChatWoot webhook - missing inbox or content');
        throw new Error('Invalid webhook data');
      }

      this.logger.log(`Message from inbox ${inboxId}: ${messageContent.substring(0, 50)}...`);

      // 1. Find bot config by inbox ID
      const botConfig = await this.botConfigService.findByInboxId(inboxId);

      if (!botConfig) {
        this.logger.warn(`No bot config found for inbox ${inboxId}`);
        throw new Error('Bot config not found');
      }

      // 2. Check if bot is enabled
      if (!botConfig.botEnabled) {
        this.logger.log(`Bot disabled for org ${botConfig.organizationId}`);
        return 'Bot is disabled';
      }

      // 3. Build custom prompt from bot config
      const systemPrompt = this.buildCustomPrompt(botConfig);

      this.logger.log(`Generating AI response for ${botConfig.businessName} (${botConfig.agentType})`);

      // 4. Get Flowise URL (use bot config override or global config)
      const flowiseUrl = botConfig.flowiseUrl || this.flowiseUrl;
      const flowiseApiKey = botConfig.flowiseApiKey || this.flowiseApiKey;
      const flowiseFlowId = this.flowiseFlowId;

      if (!flowiseUrl || !flowiseApiKey || !flowiseFlowId) {
        this.logger.warn('Flowise not configured');
        return this.getFallbackResponseFromConfig(botConfig);
      }

      // 5. Call Flowise API
      const response = await firstValueFrom(
        this.httpService.post(
          `${flowiseUrl}/prediction/${flowiseFlowId}`,
          {
            question: messageContent,
            overrideConfig: {
              sessionId: `org-${botConfig.organizationId}-${contactPhone}`,
              systemMessagePrompt: systemPrompt,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${flowiseApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const aiResponse = response.data.text || response.data.answer || 'Lo siento, no pude generar una respuesta.';

      this.logger.log(`AI response generated successfully (${aiResponse.length} chars)`);

      return aiResponse;
    } catch (error) {
      this.logger.error(`Error handling ChatWoot message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get fallback response from bot config
   */
  private getFallbackResponseFromConfig(botConfig: any): string {
    const businessName = botConfig.businessName || 'nuestro equipo';
    const businessHours = botConfig.businessHours || 'nuestro horario de atención';
    return `Gracias por tu mensaje. ${businessName} te responderá pronto durante ${businessHours}.`;
  }
}
