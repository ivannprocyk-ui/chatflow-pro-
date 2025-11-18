export interface FollowUpMessage {
  id: string;
  sequence_id: string;

  // Orden en la secuencia
  step_order: number;

  // Configuración de timing
  delay_amount: number;
  delay_unit: 'minutes' | 'hours' | 'days';

  // Contenido del mensaje
  message_template: string;
  message_type: 'fixed' | 'ai_generated';
  ai_context_instructions?: string;
  image_url?: string;

  // Variables disponibles
  available_variables: string[];

  // Condiciones para enviar este mensaje (opcional)
  send_conditions?: MessageSendConditions;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface MessageSendConditions {
  previous_message_opened?: boolean;
  previous_message_responded?: boolean;
  contact_active?: boolean;
  min_time_since_last_message?: number; // minutos
  max_attempts?: number;
}
