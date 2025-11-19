export interface FollowUpSequence {
  id: string;
  organization_id: string;

  // Identificación
  name: string;
  description?: string;
  enabled: boolean;

  // Configuración de activación (TRIGGERS)
  trigger_type: 'keyword' | 'variable' | 'conversation_state' | 'bot_stage' | 'time_based' | 'action';
  trigger_config: TriggerConfig;

  // Estrategia
  strategy: 'passive' | 'moderate' | 'aggressive';

  // Condiciones adicionales
  conditions?: SequenceConditions;

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by?: string;

  // Estadísticas
  total_executions: number;
  successful_conversions: number;
}

export interface TriggerConfig {
  // Para trigger_type = 'keyword'
  keywords?: string[];

  // Para trigger_type = 'variable'
  variable_name?: string;
  value_exists?: boolean;
  expected_value?: string;

  // Para trigger_type = 'conversation_state'
  bot_sent_info?: boolean;
  no_response_minutes?: number;

  // Para trigger_type = 'bot_stage'
  stage_id?: string;

  // Para trigger_type = 'action'
  action_type?: 'document_sent' | 'quotation_sent' | 'link_sent' | 'image_sent';

  // Común
  min_no_response_minutes?: number;
}

export interface SequenceConditions {
  min_conversation_messages?: number;
  max_follow_ups_per_contact?: number;
  business_hours_only?: boolean;
  days_of_week?: number[]; // 0 = domingo, 6 = sábado
  hours_start?: string; // "09:00"
  hours_end?: string; // "18:00"
  exclude_keywords?: string[]; // No activar si se detectan estas palabras
}
