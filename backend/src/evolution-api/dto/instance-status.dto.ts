export interface InstanceStatusDto {
  instance: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qrcode?: string;
  connectedPhone?: string;
  connectedAt?: string;
}

export interface QRCodeDto {
  instance: string;
  qrcode: string; // base64 image
  code: string;   // raw QR code string
}

export interface EvolutionWebhookDto {
  event: string;
  instance: string;
  data: any;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}
