import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly evolutionApiUrl: string;
  private readonly evolutionApiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private organizationsService: OrganizationsService,
  ) {
    this.evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL') || '';
    this.evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
  }

  async createInstance(organizationId: string): Promise<any> {
    try {
      const instanceName = `org-${organizationId}`;

      this.logger.log(`Creating Evolution API instance: ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.evolutionApiUrl}/instance/create`,
          {
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          },
          {
            headers: {
              apikey: this.evolutionApiKey,
            },
          },
        ),
      );

      // Update organization with instance ID
      await this.organizationsService.update(organizationId, {
        whatsappInstanceId: instanceName,
        whatsappMethod: 'qr',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error creating instance: ${error.message}`);
      throw error;
    }
  }

  async getQRCode(organizationId: string): Promise<string> {
    try {
      const org = await this.organizationsService.findOne(organizationId);
      const instanceName = org.whatsappInstanceId || `org-${organizationId}`;

      this.logger.log(`Getting QR code for instance: ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.evolutionApiUrl}/instance/qrcode/${instanceName}`, {
          headers: {
            apikey: this.evolutionApiKey,
          },
        }),
      );

      return response.data.base64 || response.data.qrcode;
    } catch (error) {
      this.logger.error(`Error getting QR code: ${error.message}`);
      throw error;
    }
  }

  async getConnectionStatus(organizationId: string): Promise<any> {
    try {
      const org = await this.organizationsService.findOne(organizationId);
      const instanceName = org.whatsappInstanceId || `org-${organizationId}`;

      this.logger.log(`Getting connection status for instance: ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.evolutionApiUrl}/instance/connectionState/${instanceName}`, {
          headers: {
            apikey: this.evolutionApiKey,
          },
        }),
      );

      const isConnected = response.data.state === 'open';

      // Update organization status
      if (isConnected && !org.whatsappConnected) {
        await this.organizationsService.update(organizationId, {
          whatsappConnected: true,
        });
      }

      return {
        connected: isConnected,
        state: response.data.state,
        instance: instanceName,
      };
    } catch (error) {
      this.logger.error(`Error getting connection status: ${error.message}`);
      return {
        connected: false,
        state: 'disconnected',
        error: error.message,
      };
    }
  }

  async sendMessage(organizationId: string, phone: string, message: string): Promise<any> {
    try {
      const org = await this.organizationsService.findOne(organizationId);

      if (org.whatsappMethod === 'qr') {
        return this.sendViaEvolutionAPI(organizationId, phone, message);
      } else {
        return this.sendViaMetaAPI(organizationId, phone, message);
      }
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw error;
    }
  }

  private async sendViaEvolutionAPI(organizationId: string, phone: string, message: string) {
    const org = await this.organizationsService.findOne(organizationId);
    const instanceName = org.whatsappInstanceId || `org-${organizationId}`;

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    this.logger.log(`Sending message via Evolution API to ${cleanPhone}`);

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.evolutionApiUrl}/message/sendText/${instanceName}`,
        {
          number: cleanPhone,
          text: message,
        },
        {
          headers: {
            apikey: this.evolutionApiKey,
          },
        },
      ),
    );

    return response.data;
  }

  private async sendViaMetaAPI(organizationId: string, phone: string, message: string) {
    const org = await this.organizationsService.findOne(organizationId);

    if (!org.metaAccessToken || !org.metaWabaId) {
      throw new Error('Meta API not configured for this organization');
    }

    this.logger.log(`Sending message via Meta API to ${phone}`);

    // Meta WhatsApp Business API implementation
    const response = await firstValueFrom(
      this.httpService.post(
        `https://graph.facebook.com/v18.0/${org.metaWabaId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${org.metaAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }

  async disconnect(organizationId: string): Promise<any> {
    try {
      const org = await this.organizationsService.findOne(organizationId);
      const instanceName = org.whatsappInstanceId || `org-${organizationId}`;

      this.logger.log(`Disconnecting instance: ${instanceName}`);

      const response = await firstValueFrom(
        this.httpService.delete(`${this.evolutionApiUrl}/instance/logout/${instanceName}`, {
          headers: {
            apikey: this.evolutionApiKey,
          },
        }),
      );

      // Update organization
      await this.organizationsService.update(organizationId, {
        whatsappConnected: false,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error disconnecting: ${error.message}`);
      throw error;
    }
  }
}
