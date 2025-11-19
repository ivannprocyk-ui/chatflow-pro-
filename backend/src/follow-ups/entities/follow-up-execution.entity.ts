export interface FollowUpExecution {
  id: string;
  sequence_id: string;
  organization_id: string;

  // Contacto objetivo
  contact_phone: string;
  contact_name?: string;

  // Estado de la ejecución
  status: 'active' | 'paused' | 'completed' | 'abandoned' | 'cancelled';

  // Progreso
  current_step: number;
  next_scheduled_at?: Date;

  // Contexto capturado
  conversation_context: ConversationContext;
  trigger_data: TriggerData;

  // Metadata
  started_at: Date;
  completed_at?: Date;
  last_message_sent_at?: Date;

  // Resultado
  converted: boolean;
  total_messages_sent: number;
}

export interface ConversationContext {
  // Variables capturadas del bot
  [key: string]: any;

  // Ejemplos comunes:
  nombre?: string;
  producto?: string;
  precio?: string;
  email?: string;
  fecha?: string;
}

export interface TriggerData {
  trigger_type: string;
  timestamp: Date;

  // Datos específicos según el trigger
  keyword?: string;
  variable_name?: string;
  variable_value?: any;
  bot_stage?: string;
  action_type?: string;
}
