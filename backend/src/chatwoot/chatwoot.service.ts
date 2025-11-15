import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatWootService {
  private readonly logger = new Logger(ChatWootService.name);
  private readonly chatwootUrl: string;
  private readonly chatwootApiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.chatwootUrl = this.configService.get<string>('CHATWOOT_URL') || '';
    this.chatwootApiKey = this.configService.get<string>('CHATWOOT_API_KEY') || '';
  }

  /**
   * Send a message to ChatWoot conversation
   * This sends the AI response back to ChatWoot
   */
  async sendMessage(dto: SendMessageDto): Promise<any> {
    try {
      this.logger.log(`Sending message to ChatWoot conversation ${dto.conversationId}`);

      if (!this.chatwootUrl || !this.chatwootApiKey) {
        this.logger.warn('ChatWoot not configured');
        throw new Error('ChatWoot not configured');
      }

      const url = `${this.chatwootUrl}/api/v1/accounts/${dto.accountId}/conversations/${dto.conversationId}/messages`;

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            content: dto.content,
            message_type: dto.messageType || 'outgoing',
            private: dto.private || false,
          },
          {
            headers: {
              'api_access_token': this.chatwootApiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Message sent successfully to ChatWoot conversation ${dto.conversationId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending message to ChatWoot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get conversation details from ChatWoot
   */
  async getConversation(accountId: string, conversationId: number): Promise<any> {
    try {
      if (!this.chatwootUrl || !this.chatwootApiKey) {
        throw new Error('ChatWoot not configured');
      }

      const url = `${this.chatwootUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'api_access_token': this.chatwootApiKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting ChatWoot conversation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get conversation messages from ChatWoot
   */
  async getConversationMessages(
    accountId: string,
    conversationId: number,
  ): Promise<any[]> {
    try {
      if (!this.chatwootUrl || !this.chatwootApiKey) {
        throw new Error('ChatWoot not configured');
      }

      const url = `${this.chatwootUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'api_access_token': this.chatwootApiKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting ChatWoot messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggle conversation status (open/resolved)
   */
  async toggleConversationStatus(
    accountId: string,
    conversationId: number,
    status: 'open' | 'resolved' | 'pending',
  ): Promise<any> {
    try {
      if (!this.chatwootUrl || !this.chatwootApiKey) {
        throw new Error('ChatWoot not configured');
      }

      const url = `${this.chatwootUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_status`;

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          { status },
          {
            headers: {
              'api_access_token': this.chatwootApiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error toggling ChatWoot conversation status: ${error.message}`);
      throw error;
    }
  }
}
