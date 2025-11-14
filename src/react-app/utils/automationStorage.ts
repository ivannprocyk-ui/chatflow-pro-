// Automation Storage - Gestión de flows de automatización en localStorage

export type TriggerType =
  | 'new_contact'           // Nuevo contacto agregado
  | 'contact_birthday'      // Cumpleaños del contacto
  | 'contact_inactive'      // X días sin interacción
  | 'contact_status_change' // Cambio de estado
  | 'specific_date'         // Fecha específica
  | 'tag_added'             // Tag agregado a contacto
  | 'manual';               // Ejecución manual

export type ActionType =
  | 'send_message'          // Enviar mensaje WhatsApp
  | 'add_tag'               // Agregar tag
  | 'remove_tag'            // Remover tag
  | 'update_field'          // Actualizar campo CRM
  | 'change_status'         // Cambiar estado
  | 'add_to_list'           // Agregar a lista
  | 'create_event';         // Crear evento en calendario

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'has_tag'
  | 'not_has_tag'
  | 'is_empty'
  | 'is_not_empty';

export interface AutomationNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  position: { x: number; y: number };
  data: any;
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TriggerNodeData {
  triggerType: TriggerType;
  config: {
    // Para 'contact_inactive'
    daysInactive?: number;
    // Para 'specific_date'
    date?: string;
    time?: string;
    // Para 'contact_status_change'
    fromStatus?: string;
    toStatus?: string;
    // Para 'tag_added'
    tagId?: string;
  };
}

export interface ActionNodeData {
  actionType: ActionType;
  config: {
    // Para 'send_message'
    templateId?: string;
    message?: string;
    // Para 'add_tag' / 'remove_tag'
    tagId?: string;
    // Para 'update_field'
    fieldName?: string;
    fieldValue?: string;
    // Para 'change_status'
    newStatus?: string;
    // Para 'add_to_list'
    listId?: string;
    // Para 'create_event'
    eventType?: string;
    eventTitle?: string;
    eventDate?: string;
  };
}

export interface ConditionNodeData {
  field: string;
  operator: ConditionOperator;
  value: string;
  trueTarget?: string;  // ID del nodo si es verdadero
  falseTarget?: string; // ID del nodo si es falso
}

export interface DelayNodeData {
  delayType: 'hours' | 'days' | 'weeks';
  delayAmount: number;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  active: boolean;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  createdAt: string;
  updatedAt: string;
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutedAt?: string;
  };
}

export interface AutomationExecution {
  id: string;
  automationId: string;
  automationName: string;
  contactId: string;
  contactName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentNodeId?: string;
  executionPath: string[]; // Array de node IDs ejecutados
  scheduledFor?: string;   // Fecha/hora programada (para delays)
  startedAt: string;
  completedAt?: string;
  error?: string;
  results: {
    nodeId: string;
    nodeType: string;
    success: boolean;
    message?: string;
    executedAt: string;
  }[];
}

const STORAGE_KEY = 'chatflow_automations';
const EXECUTIONS_KEY = 'chatflow_automation_executions';

// ==================== CRUD DE AUTOMATIONS ====================

export const loadAutomations = (): Automation[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading automations:', error);
    return [];
  }
};

export const saveAutomations = (automations: Automation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(automations));
  } catch (error) {
    console.error('Error saving automations:', error);
  }
};

export const getAutomationById = (id: string): Automation | undefined => {
  const automations = loadAutomations();
  return automations.find(a => a.id === id);
};

export const createAutomation = (automation: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Automation => {
  const newAutomation: Automation = {
    ...automation,
    id: `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    },
  };

  const automations = loadAutomations();
  automations.push(newAutomation);
  saveAutomations(automations);

  return newAutomation;
};

export const updateAutomation = (id: string, updates: Partial<Automation>): Automation | null => {
  const automations = loadAutomations();
  const index = automations.findIndex(a => a.id === id);

  if (index === -1) return null;

  automations[index] = {
    ...automations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveAutomations(automations);
  return automations[index];
};

export const deleteAutomation = (id: string): boolean => {
  const automations = loadAutomations();
  const filtered = automations.filter(a => a.id !== id);

  if (filtered.length === automations.length) return false;

  saveAutomations(filtered);
  return true;
};

export const toggleAutomationStatus = (id: string): Automation | null => {
  const automation = getAutomationById(id);
  if (!automation) return null;

  return updateAutomation(id, { active: !automation.active });
};

export const duplicateAutomation = (id: string): Automation | null => {
  const automation = getAutomationById(id);
  if (!automation) return null;

  const duplicate = createAutomation({
    name: `${automation.name} (Copia)`,
    description: automation.description,
    active: false,
    nodes: automation.nodes.map(node => ({
      ...node,
      id: `${node.id}_copy_${Date.now()}`,
    })),
    edges: automation.edges.map(edge => ({
      ...edge,
      id: `${edge.id}_copy_${Date.now()}`,
      source: `${edge.source}_copy_${Date.now()}`,
      target: `${edge.target}_copy_${Date.now()}`,
    })),
  });

  return duplicate;
};

// ==================== AUTOMATION EXECUTIONS ====================

export const loadExecutions = (): AutomationExecution[] => {
  try {
    const data = localStorage.getItem(EXECUTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading executions:', error);
    return [];
  }
};

export const saveExecutions = (executions: AutomationExecution[]): void => {
  try {
    localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(executions));
  } catch (error) {
    console.error('Error saving executions:', error);
  }
};

export const createExecution = (
  automationId: string,
  contactId: string,
  contactName: string,
  scheduledFor?: string
): AutomationExecution => {
  const automation = getAutomationById(automationId);
  if (!automation) {
    throw new Error(`Automation ${automationId} not found`);
  }

  const execution: AutomationExecution = {
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    automationId,
    automationName: automation.name,
    contactId,
    contactName,
    status: scheduledFor ? 'pending' : 'running',
    executionPath: [],
    scheduledFor,
    startedAt: new Date().toISOString(),
    results: [],
  };

  const executions = loadExecutions();
  executions.push(execution);
  saveExecutions(executions);

  return execution;
};

export const updateExecution = (id: string, updates: Partial<AutomationExecution>): AutomationExecution | null => {
  const executions = loadExecutions();
  const index = executions.findIndex(e => e.id === id);

  if (index === -1) return null;

  executions[index] = {
    ...executions[index],
    ...updates,
  };

  saveExecutions(executions);
  return executions[index];
};

export const getExecutionsByAutomation = (automationId: string): AutomationExecution[] => {
  const executions = loadExecutions();
  return executions.filter(e => e.automationId === automationId);
};

export const getPendingExecutions = (): AutomationExecution[] => {
  const executions = loadExecutions();
  const now = new Date().toISOString();
  return executions.filter(e =>
    e.status === 'pending' &&
    e.scheduledFor &&
    e.scheduledFor <= now
  );
};

export const updateAutomationStats = (automationId: string, success: boolean): void => {
  const automation = getAutomationById(automationId);
  if (!automation) return;

  updateAutomation(automationId, {
    stats: {
      totalExecutions: automation.stats.totalExecutions + 1,
      successfulExecutions: success
        ? automation.stats.successfulExecutions + 1
        : automation.stats.successfulExecutions,
      failedExecutions: success
        ? automation.stats.failedExecutions
        : automation.stats.failedExecutions + 1,
      lastExecutedAt: new Date().toISOString(),
    },
  });
};

// ==================== UTILITY FUNCTIONS ====================

export const getActiveAutomations = (): Automation[] => {
  return loadAutomations().filter(a => a.active);
};

export const getAutomationsByTrigger = (triggerType: TriggerType): Automation[] => {
  const automations = getActiveAutomations();
  return automations.filter(automation => {
    const triggerNode = automation.nodes.find(node => node.type === 'trigger');
    return triggerNode && triggerNode.data.triggerType === triggerType;
  });
};

export const validateAutomation = (automation: Automation): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Verificar que tenga al menos un trigger
  const triggers = automation.nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) {
    errors.push('La automatización debe tener al menos un trigger');
  }

  // Verificar que tenga al menos una acción
  const actions = automation.nodes.filter(n => n.type === 'action');
  if (actions.length === 0) {
    errors.push('La automatización debe tener al menos una acción');
  }

  // Verificar que los nodos estén conectados
  if (automation.nodes.length > 1 && automation.edges.length === 0) {
    errors.push('Los nodos deben estar conectados');
  }

  // Verificar que no haya nodos huérfanos (excepto el trigger)
  const connectedNodes = new Set<string>();
  automation.edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  automation.nodes.forEach(node => {
    if (node.type !== 'trigger' && !connectedNodes.has(node.id)) {
      errors.push(`El nodo ${node.id} no está conectado`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const getTriggerLabel = (triggerType: TriggerType): string => {
  const labels: Record<TriggerType, string> = {
    new_contact: 'Nuevo Contacto',
    contact_birthday: 'Cumpleaños',
    contact_inactive: 'Contacto Inactivo',
    contact_status_change: 'Cambio de Estado',
    specific_date: 'Fecha Específica',
    tag_added: 'Tag Agregado',
    manual: 'Manual',
  };
  return labels[triggerType];
};

export const getActionLabel = (actionType: ActionType): string => {
  const labels: Record<ActionType, string> = {
    send_message: 'Enviar Mensaje',
    add_tag: 'Agregar Tag',
    remove_tag: 'Remover Tag',
    update_field: 'Actualizar Campo',
    change_status: 'Cambiar Estado',
    add_to_list: 'Agregar a Lista',
    create_event: 'Crear Evento',
  };
  return labels[actionType];
};

// Inicializar con datos demo si no hay automations
export const initializeDemoAutomations = (): void => {
  const existing = loadAutomations();
  if (existing.length > 0) return;

  const demoAutomations: Automation[] = [
    {
      id: 'demo_welcome',
      name: 'Mensaje de Bienvenida',
      description: 'Envía un mensaje de bienvenida cuando se agrega un nuevo contacto',
      active: true,
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            triggerType: 'new_contact',
            config: {},
          },
        },
        {
          id: 'action_1',
          type: 'action',
          position: { x: 400, y: 100 },
          data: {
            actionType: 'send_message',
            config: {
              message: '¡Bienvenido! Gracias por unirte a nuestra comunidad.',
            },
          },
        },
      ],
      edges: [
        {
          id: 'edge_1',
          source: 'trigger_1',
          target: 'action_1',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
      },
    },
  ];

  saveAutomations(demoAutomations);
};
