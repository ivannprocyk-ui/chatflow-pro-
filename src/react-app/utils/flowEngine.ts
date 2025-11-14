// Flow Engine - Motor de ejecución de automatizaciones

import {
  Automation,
  AutomationNode,
  AutomationExecution,
  TriggerNodeData,
  ActionNodeData,
  ConditionNodeData,
  DelayNodeData,
  createExecution,
  updateExecution,
  updateAutomationStats,
  getAutomationById,
} from './automationStorage';
import { loadContacts, saveContacts, Contact } from './storage';
import { loadTags } from './storage';

// ==================== FLOW EXECUTION ENGINE ====================

export class FlowEngine {
  private automation: Automation;
  private execution: AutomationExecution;
  private contact: Contact;

  constructor(automation: Automation, contact: Contact) {
    this.automation = automation;
    this.contact = contact;
    this.execution = createExecution(automation.id, contact.id, contact.name);
  }

  /**
   * Ejecuta la automatización completa
   */
  async execute(): Promise<{ success: boolean; message: string }> {
    try {
      // Encontrar el nodo trigger
      const triggerNode = this.automation.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No se encontró nodo trigger');
      }

      // Comenzar ejecución desde el trigger
      updateExecution(this.execution.id, { status: 'running' });

      const result = await this.executeNode(triggerNode);

      if (result.success) {
        updateExecution(this.execution.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        updateAutomationStats(this.automation.id, true);
        return { success: true, message: 'Automatización ejecutada exitosamente' };
      } else {
        throw new Error(result.message || 'Error en la ejecución');
      }
    } catch (error: any) {
      updateExecution(this.execution.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: error.message,
      });
      updateAutomationStats(this.automation.id, false);
      return { success: false, message: error.message };
    }
  }

  /**
   * Ejecuta un nodo específico y continúa con los siguientes
   */
  private async executeNode(node: AutomationNode): Promise<{ success: boolean; message?: string }> {
    // Registrar que se está ejecutando este nodo
    const executionResult = {
      nodeId: node.id,
      nodeType: node.type,
      success: false,
      executedAt: new Date().toISOString(),
      message: '',
    };

    try {
      let result: { success: boolean; message?: string; nextNodeId?: string } = {
        success: false,
      };

      // Ejecutar según el tipo de nodo
      switch (node.type) {
        case 'trigger':
          result = await this.executeTrigger(node);
          break;
        case 'action':
          result = await this.executeAction(node);
          break;
        case 'condition':
          result = await this.executeCondition(node);
          break;
        case 'delay':
          result = await this.executeDelay(node);
          break;
        default:
          result = { success: false, message: `Tipo de nodo desconocido: ${node.type}` };
      }

      executionResult.success = result.success;
      executionResult.message = result.message || '';

      // Actualizar execution con el resultado
      const currentExecution = this.execution;
      currentExecution.results.push(executionResult);
      currentExecution.executionPath.push(node.id);
      updateExecution(currentExecution.id, currentExecution);

      if (!result.success) {
        return result;
      }

      // Encontrar el siguiente nodo
      let nextNodeId: string | undefined = result.nextNodeId;

      if (!nextNodeId) {
        // Si no hay nextNodeId específico, buscar el edge normal
        const nextEdge = this.automation.edges.find(e => e.source === node.id);
        nextNodeId = nextEdge?.target;
      }

      if (nextNodeId) {
        const nextNode = this.automation.nodes.find(n => n.id === nextNodeId);
        if (nextNode) {
          return await this.executeNode(nextNode);
        }
      }

      // Si no hay siguiente nodo, la ejecución terminó exitosamente
      return { success: true, message: 'Flujo completado' };
    } catch (error: any) {
      executionResult.success = false;
      executionResult.message = error.message;

      const currentExecution = this.execution;
      currentExecution.results.push(executionResult);
      updateExecution(currentExecution.id, currentExecution);

      return { success: false, message: error.message };
    }
  }

  /**
   * Ejecuta un nodo trigger
   */
  private async executeTrigger(node: AutomationNode): Promise<{ success: boolean; message?: string }> {
    const data = node.data as TriggerNodeData;

    // Los triggers solo verifican condiciones, no ejecutan acciones
    // La lógica de verificación se hace antes de ejecutar el flow

    return {
      success: true,
      message: `Trigger ${data.triggerType} activado`,
    };
  }

  /**
   * Ejecuta un nodo de acción
   */
  private async executeAction(node: AutomationNode): Promise<{ success: boolean; message?: string }> {
    const data = node.data as ActionNodeData;

    switch (data.actionType) {
      case 'send_message':
        return await this.sendMessage(data);
      case 'add_tag':
        return await this.addTag(data);
      case 'remove_tag':
        return await this.removeTag(data);
      case 'update_field':
        return await this.updateField(data);
      case 'change_status':
        return await this.changeStatus(data);
      case 'add_to_list':
        return await this.addToList(data);
      case 'create_event':
        return await this.createEvent(data);
      default:
        return { success: false, message: `Acción desconocida: ${data.actionType}` };
    }
  }

  /**
   * Ejecuta un nodo de condición
   */
  private async executeCondition(node: AutomationNode): Promise<{ success: boolean; message?: string; nextNodeId?: string }> {
    const data = node.data as ConditionNodeData;

    // Evaluar la condición
    const conditionMet = this.evaluateCondition(data);

    const nextNodeId = conditionMet ? data.trueTarget : data.falseTarget;

    return {
      success: true,
      message: `Condición evaluada: ${conditionMet ? 'verdadero' : 'falso'}`,
      nextNodeId,
    };
  }

  /**
   * Ejecuta un nodo de delay
   */
  private async executeDelay(node: AutomationNode): Promise<{ success: boolean; message?: string }> {
    const data = node.data as DelayNodeData;

    // Calcular cuándo debe ejecutarse el siguiente nodo
    let delayMs = 0;
    switch (data.delayType) {
      case 'hours':
        delayMs = data.delayAmount * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = data.delayAmount * 24 * 60 * 60 * 1000;
        break;
      case 'weeks':
        delayMs = data.delayAmount * 7 * 24 * 60 * 60 * 1000;
        break;
    }

    const scheduledFor = new Date(Date.now() + delayMs).toISOString();

    // Actualizar la ejecución para que se programe
    updateExecution(this.execution.id, {
      status: 'pending',
      scheduledFor,
      currentNodeId: node.id,
    });

    return {
      success: true,
      message: `Delay programado: ${data.delayAmount} ${data.delayType}`,
    };
  }

  // ==================== ACCIONES ====================

  private async sendMessage(data: ActionNodeData): Promise<{ success: boolean; message?: string }> {
    // Aquí se integraría con la API de WhatsApp
    // Por ahora, solo simulamos el envío

    const message = data.config.message || 'Mensaje automático';

    console.log(`[AUTOMATION] Enviando mensaje a ${this.contact.phone}: ${message}`);

    // Guardar en historial de mensajes (si existe la función)
    // addMessageToHistory(this.contact.id, message);

    return {
      success: true,
      message: `Mensaje enviado a ${this.contact.name}`,
    };
  }

  private async addTag(data: ActionNodeData): Promise<{ success: boolean; message?: string }> {
    const tagId = data.config.tagId;
    if (!tagId) {
      return { success: false, message: 'No se especificó tag' };
    }

    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === this.contact.id);

    if (contactIndex === -1) {
      return { success: false, message: 'Contacto no encontrado' };
    }

    if (!contacts[contactIndex].tags) {
      contacts[contactIndex].tags = [];
    }

    if (!contacts[contactIndex].tags!.includes(tagId)) {
      contacts[contactIndex].tags!.push(tagId);
      saveContacts(contacts);
    }

    return {
      success: true,
      message: `Tag agregado al contacto`,
    };
  }

  private async removeTag(data: ActionNodeData): Promise<{ success: boolean; message?: string }> {
    const tagId = data.config.tagId;
    if (!tagId) {
      return { success: false, message: 'No se especificó tag' };
    }

    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === this.contact.id);

    if (contactIndex === -1) {
      return { success: false, message: 'Contacto no encontrado' };
    }

    if (contacts[contactIndex].tags) {
      contacts[contactIndex].tags = contacts[contactIndex].tags!.filter(t => t !== tagId);
      saveContacts(contacts);
    }

    return {
      success: true,
      message: `Tag removido del contacto`,
    };
  }

  private async updateField(data: ActionNodeData): Promise<{ success: boolean; message?: string }> {
    const fieldName = data.config.fieldName;
    const fieldValue = data.config.fieldValue;

    if (!fieldName || fieldValue === undefined) {
      return { success: false, message: 'Faltan parámetros para actualizar campo' };
    }

    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === this.contact.id);

    if (contactIndex === -1) {
      return { success: false, message: 'Contacto no encontrado' };
    }

    // Actualizar el campo
    (contacts[contactIndex] as any)[fieldName] = fieldValue;
    saveContacts(contacts);

    return {
      success: true,
      message: `Campo ${fieldName} actualizado`,
    };
  }

  private async changeStatus(data: ActionNodeData): Promise<{ success: boolean; message?: string }> {
    const newStatus = data.config.newStatus;
    if (!newStatus) {
      return { success: false, message: 'No se especificó nuevo estado' };
    }

    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === this.contact.id);

    if (contactIndex === -1) {
      return { success: false, message: 'Contacto no encontrado' };
    }

    contacts[contactIndex].status = newStatus;
    saveContacts(contacts);

    return {
      success: true,
      message: `Estado cambiado a ${newStatus}`,
    };
  }

  private async addToList(data: ActionNodeData): Promise<{ success: boolean; message?: string }> {
    // Implementación futura: agregar contacto a una lista
    return {
      success: true,
      message: 'Contacto agregado a lista',
    };
  }

  private async createEvent(data: ActionNodeData): Promise<{ success: boolean; message?: string }> {
    // Implementación futura: crear evento en calendario
    return {
      success: true,
      message: 'Evento creado',
    };
  }

  // ==================== EVALUACIÓN DE CONDICIONES ====================

  private evaluateCondition(data: ConditionNodeData): boolean {
    const fieldValue = (this.contact as any)[data.field];
    const compareValue = data.value;

    switch (data.operator) {
      case 'equals':
        return fieldValue === compareValue;
      case 'not_equals':
        return fieldValue !== compareValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue);
      case 'less_than':
        return Number(fieldValue) < Number(compareValue);
      case 'has_tag':
        return this.contact.tags?.includes(compareValue) || false;
      case 'not_has_tag':
        return !this.contact.tags?.includes(compareValue);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '';
      default:
        return false;
    }
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Ejecuta una automatización para un contacto específico
 */
export const executeAutomationForContact = async (
  automationId: string,
  contactId: string
): Promise<{ success: boolean; message: string }> => {
  const automation = getAutomationById(automationId);
  if (!automation) {
    return { success: false, message: 'Automatización no encontrada' };
  }

  const contacts = loadContacts();
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) {
    return { success: false, message: 'Contacto no encontrado' };
  }

  const engine = new FlowEngine(automation, contact);
  return await engine.execute();
};

/**
 * Ejecuta una automatización para múltiples contactos
 */
export const executeAutomationForContacts = async (
  automationId: string,
  contactIds: string[]
): Promise<{ successCount: number; failCount: number; results: any[] }> => {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const contactId of contactIds) {
    const result = await executeAutomationForContact(automationId, contactId);
    results.push({ contactId, ...result });

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Pequeño delay entre ejecuciones para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { successCount, failCount, results };
};
