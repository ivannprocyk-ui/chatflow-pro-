import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BotConfigService } from '../bot-config/bot-config.service';
import { ConnectInstanceDto } from './dto/connect-instance.dto';
import { InstanceStatusDto, QRCodeDto } from './dto/instance-status.dto';

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private botConfigService: BotConfigService,
  ) {}

  /**
   * Create or connect an Evolution API instance
   */
  async createInstance(dto: ConnectInstanceDto): Promise<any> {
    try {
      this.logger.log(`Creating Evolution API instance: ${dto.instanceName}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${dto.apiUrl}/instance/create`,
          {
            instanceName: dto.instanceName,
            token: dto.apiKey,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          },
          {
            headers: {
              apikey: dto.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Instance created successfully: ${dto.instanceName}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error creating instance ${dto.instanceName}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to create Evolution API instance: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Fetch QR Code for an instance
   */
  async fetchQRCode(
    apiUrl: string,
    instanceName: string,
    apiKey: string,
  ): Promise<QRCodeDto> {
    try {
      this.logger.log(`Fetching QR code for instance: ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${apiUrl}/instance/connect/${instanceName}`,
          {
            headers: {
              apikey: apiKey,
            },
          },
        ),
      );

      this.logger.log(`QR code fetched for instance: ${instanceName}`);

      return {
        instance: instanceName,
        qrcode: response.data.base64 || response.data.qrcode?.base64,
        code: response.data.code || response.data.qrcode?.code,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching QR code for ${instanceName}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to fetch QR code: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get instance connection status
   */
  async getInstanceStatus(
    apiUrl: string,
    instanceName: string,
    apiKey: string,
  ): Promise<InstanceStatusDto> {
    try {
      this.logger.log(`Fetching status for instance: ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${apiUrl}/instance/connectionState/${instanceName}`,
          {
            headers: {
              apikey: apiKey,
            },
          },
        ),
      );

      const data = response.data;
      const state = data.state || data.instance?.state;

      this.logger.log(`Instance ${instanceName} status: ${state}`);

      return {
        instance: instanceName,
        status: this.mapConnectionState(state),
        connectedPhone: data.instance?.owner || data.owner,
        connectedAt: data.instance?.createdAt || data.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching status for ${instanceName}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to fetch instance status: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Disconnect/logout instance
   */
  async disconnectInstance(
    apiUrl: string,
    instanceName: string,
    apiKey: string,
  ): Promise<void> {
    try {
      this.logger.log(`Disconnecting instance: ${instanceName}`);

      await firstValueFrom(
        this.httpService.delete(
          `${apiUrl}/instance/logout/${instanceName}`,
          {
            headers: {
              apikey: apiKey,
            },
          },
        ),
      );

      this.logger.log(`Instance disconnected: ${instanceName}`);
    } catch (error) {
      this.logger.error(
        `Error disconnecting instance ${instanceName}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to disconnect instance: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Delete instance completely
   */
  async deleteInstance(
    apiUrl: string,
    instanceName: string,
    apiKey: string,
  ): Promise<void> {
    try {
      this.logger.log(`Deleting instance: ${instanceName}`);

      await firstValueFrom(
        this.httpService.delete(
          `${apiUrl}/instance/delete/${instanceName}`,
          {
            headers: {
              apikey: apiKey,
            },
          },
        ),
      );

      this.logger.log(`Instance deleted: ${instanceName}`);
    } catch (error) {
      this.logger.error(
        `Error deleting instance ${instanceName}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to delete instance: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Set webhook for instance
   */
  async setWebhook(
    apiUrl: string,
    instanceName: string,
    apiKey: string,
    webhookUrl: string,
  ): Promise<void> {
    try {
      this.logger.log(`Setting webhook for instance: ${instanceName}`);

      await firstValueFrom(
        this.httpService.post(
          `${apiUrl}/webhook/set/${instanceName}`,
          {
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: true,
            events: [
              'QRCODE_UPDATED',
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'SEND_MESSAGE',
            ],
          },
          {
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Webhook set for instance: ${instanceName}`);
    } catch (error) {
      this.logger.error(
        `Error setting webhook for ${instanceName}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to set webhook: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Handle CONNECTION_UPDATE webhook
   */
  async handleConnectionUpdate(
    instanceName: string,
    state: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Connection update for ${instanceName}: ${state}`,
      );

      // Find bot config by instance name
      const allConfigs = await this.botConfigService.findAll();
      const config = allConfigs.find(
        (c) => c.evolutionInstanceName === instanceName,
      );

      if (!config) {
        this.logger.warn(
          `No bot config found for instance ${instanceName}`,
        );
        return;
      }

      // Update connection status
      const status = this.mapConnectionState(state);
      await this.botConfigService.updateConnectionStatus(
        config.organizationId,
        status,
      );

      this.logger.log(
        `Updated connection status for org ${config.organizationId}: ${status}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling connection update: ${error.message}`,
      );
    }
  }

  /**
   * Send text message via Evolution API
   */
  async sendTextMessage(
    apiUrl: string,
    instanceName: string,
    apiKey: string,
    phone: string,
    text: string,
  ): Promise<any> {
    try {
      this.logger.log(`Sending text message to ${phone} via ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${apiUrl}/message/sendText/${instanceName}`,
          {
            number: this.formatPhone(phone),
            text,
          },
          {
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Message sent successfully to ${phone}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error sending text message to ${phone}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to send text message: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Send media message (image, video, audio, document)
   */
  async sendMediaMessage(
    apiUrl: string,
    instanceName: string,
    apiKey: string,
    phone: string,
    mediaUrl: string,
    caption?: string,
    mediaType: 'image' | 'video' | 'audio' | 'document' = 'image',
  ): Promise<any> {
    try {
      this.logger.log(`Sending ${mediaType} message to ${phone} via ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${apiUrl}/message/sendMedia/${instanceName}`,
          {
            number: this.formatPhone(phone),
            mediatype: mediaType,
            media: mediaUrl,
            caption: caption || '',
          },
          {
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Media message sent successfully to ${phone}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error sending media message to ${phone}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to send media message: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Format phone number for WhatsApp
   * Ensures format: 5491234567890@s.whatsapp.net
   */
  private formatPhone(phone: string): string {
    // Remove non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Add WhatsApp suffix if not present
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@s.whatsapp.net';
    }

    return cleaned;
  }

  /**
   * Extract clean phone number from WhatsApp format
   */
  extractPhone(whatsappId: string): string {
    return whatsappId.replace('@s.whatsapp.net', '').replace('@c.us', '');
  }

  /**
   * Map Evolution API connection state to our status
   */
  private mapConnectionState(
    state: string,
  ): 'connected' | 'disconnected' | 'connecting' {
    const stateLower = (state || '').toLowerCase();

    if (stateLower === 'open' || stateLower === 'connected') {
      return 'connected';
    } else if (stateLower === 'connecting' || stateLower === 'qr') {
      return 'connecting';
    } else {
      return 'disconnected';
    }
  }
}
