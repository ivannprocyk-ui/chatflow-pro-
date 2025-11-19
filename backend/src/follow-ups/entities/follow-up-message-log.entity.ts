export interface FollowUpMessageLog {
  id: string;
  execution_id: string;
  message_id: string;

  // Detalles del envío
  step_number: number;
  sent_at: Date;

  // Contenido enviado (con variables reemplazadas)
  message_sent: string;

  // Estado del mensaje
  delivery_status: 'sent' | 'delivered' | 'read' | 'failed';

  // Respuesta del contacto
  contact_responded: boolean;
  response_received_at?: Date;
  response_text?: string;

  // Metadata de WhatsApp
  whatsapp_message_id?: string;
  error_message?: string;
}
