// Message Tracker - Sistema de seguimiento de mensajes y respuestas
// Detecta cuando clientes no responden y puede disparar automatizaciones de seguimiento

import { MessageHistory, Contact, loadCRMData, saveCRMData } from './storage';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ConversationTracker {
  id: string;
  contactId: string;
  lastMessageSentAt: string;
  lastMessageId?: string;
  lastResponseAt?: string;
  awaitingResponse: boolean;
  noResponseThresholdHours: number; // Tiempo de espera antes de considerar "sin respuesta"
  followUpAutomationId?: string; // ID de automatización a ejecutar si no responde
  followUpSent: boolean;
  followUpSentAt?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface MessageResponseStats {
  totalSent: number;
  totalResponded: number;
  totalNoResponse: number;
  averageResponseTimeHours: number;
  responseRate: number; // Porcentaje
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEY_TRACKERS = 'conversation_trackers';
const STORAGE_KEY_RESPONSE_LOG = 'message_response_log';

// ============================================================================
// CONVERSATION TRACKER FUNCTIONS
// ============================================================================

/**
 * Carga todos los trackers de conversación
 */
export function loadConversationTrackers(): ConversationTracker[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TRACKERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading conversation trackers:', error);
    return [];
  }
}

/**
 * Guarda trackers de conversación
 */
export function saveConversationTrackers(trackers: ConversationTracker[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRACKERS, JSON.stringify(trackers));
  } catch (error) {
    console.error('Error saving conversation trackers:', error);
  }
}

/**
 * Crea o actualiza un tracker cuando se envía un mensaje
 */
export function trackMessageSent(
  contactId: string,
  messageId: string,
  options?: {
    noResponseThresholdHours?: number;
    followUpAutomationId?: string;
  }
): ConversationTracker {
  const trackers = loadConversationTrackers();
  const existingIndex = trackers.findIndex(t => t.contactId === contactId);

  const tracker: ConversationTracker = {
    id: existingIndex >= 0 ? trackers[existingIndex].id : `tracker_${Date.now()}_${contactId}`,
    contactId,
    lastMessageSentAt: new Date().toISOString(),
    lastMessageId: messageId,
    lastResponseAt: existingIndex >= 0 ? trackers[existingIndex].lastResponseAt : undefined,
    awaitingResponse: true,
    noResponseThresholdHours: options?.noResponseThresholdHours || 24,
    followUpAutomationId: options?.followUpAutomationId,
    followUpSent: false,
    metadata: {
      messageCount: (existingIndex >= 0 ? (trackers[existingIndex].metadata?.messageCount || 0) : 0) + 1,
    },
  };

  if (existingIndex >= 0) {
    trackers[existingIndex] = tracker;
  } else {
    trackers.push(tracker);
  }

  saveConversationTrackers(trackers);
  return tracker;
}

/**
 * Marca que un cliente respondió
 */
export function trackMessageResponse(contactId: string): void {
  const trackers = loadConversationTrackers();
  const index = trackers.findIndex(t => t.contactId === contactId);

  if (index >= 0) {
    trackers[index].lastResponseAt = new Date().toISOString();
    trackers[index].awaitingResponse = false;
    trackers[index].followUpSent = false; // Reset follow-up flag
    saveConversationTrackers(trackers);
  }

  // También actualizar el contacto con la fecha de última respuesta
  const contacts = loadCRMData();
  const contactIndex = contacts.findIndex(c => c.id === contactId);
  if (contactIndex >= 0) {
    (contacts[contactIndex] as any).lastResponseAt = new Date().toISOString();
    saveCRMData(contacts);
  }
}

/**
 * Marca que se envió un follow-up
 */
export function markFollowUpSent(contactId: string): void {
  const trackers = loadConversationTrackers();
  const index = trackers.findIndex(t => t.contactId === contactId);

  if (index >= 0) {
    trackers[index].followUpSent = true;
    trackers[index].followUpSentAt = new Date().toISOString();
    saveConversationTrackers(trackers);
  }
}

/**
 * Obtiene contactos que no han respondido dentro del threshold
 */
export function getNoResponseContacts(): Array<{
  tracker: ConversationTracker;
  contact: Contact;
  hoursSinceLastMessage: number;
}> {
  const trackers = loadConversationTrackers();
  const contacts = loadCRMData();
  const now = Date.now();
  const results: Array<{ tracker: ConversationTracker; contact: Contact; hoursSinceLastMessage: number }> = [];

  for (const tracker of trackers) {
    // Skip si no está esperando respuesta o ya se envió follow-up
    if (!tracker.awaitingResponse || tracker.followUpSent) {
      continue;
    }

    const lastMessageTime = new Date(tracker.lastMessageSentAt).getTime();
    const hoursSince = (now - lastMessageTime) / (1000 * 60 * 60);

    // Si pasó el threshold y no ha respondido
    if (hoursSince >= tracker.noResponseThresholdHours) {
      const contact = contacts.find(c => c.id === tracker.contactId);
      if (contact) {
        results.push({
          tracker,
          contact,
          hoursSinceLastMessage: hoursSince,
        });
      }
    }
  }

  return results;
}

/**
 * Obtiene estadísticas de respuesta de mensajes
 */
export function getMessageResponseStats(): MessageResponseStats {
  const trackers = loadConversationTrackers();
  const now = Date.now();

  let totalSent = 0;
  let totalResponded = 0;
  let totalNoResponse = 0;
  let totalResponseTimeHours = 0;
  let responseTimeCount = 0;

  for (const tracker of trackers) {
    totalSent += tracker.metadata?.messageCount || 1;

    if (tracker.lastResponseAt) {
      totalResponded++;

      // Calcular tiempo de respuesta
      const sentTime = new Date(tracker.lastMessageSentAt).getTime();
      const responseTime = new Date(tracker.lastResponseAt).getTime();
      const responseHours = (responseTime - sentTime) / (1000 * 60 * 60);

      totalResponseTimeHours += responseHours;
      responseTimeCount++;
    } else {
      // Verificar si pasó el threshold
      const lastMessageTime = new Date(tracker.lastMessageSentAt).getTime();
      const hoursSince = (now - lastMessageTime) / (1000 * 60 * 60);

      if (hoursSince >= tracker.noResponseThresholdHours) {
        totalNoResponse++;
      }
    }
  }

  const averageResponseTimeHours = responseTimeCount > 0
    ? totalResponseTimeHours / responseTimeCount
    : 0;

  const responseRate = totalSent > 0
    ? (totalResponded / totalSent) * 100
    : 0;

  return {
    totalSent,
    totalResponded,
    totalNoResponse,
    averageResponseTimeHours,
    responseRate,
  };
}

/**
 * Obtiene el tracker de un contacto específico
 */
export function getContactTracker(contactId: string): ConversationTracker | null {
  const trackers = loadConversationTrackers();
  return trackers.find(t => t.contactId === contactId) || null;
}

/**
 * Limpia trackers antiguos (más de 30 días)
 */
export function cleanupOldTrackers(): number {
  const trackers = loadConversationTrackers();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  const filtered = trackers.filter(tracker => {
    const lastActivity = tracker.lastResponseAt || tracker.lastMessageSentAt;
    const activityTime = new Date(lastActivity).getTime();
    return activityTime > thirtyDaysAgo;
  });

  const removed = trackers.length - filtered.length;
  if (removed > 0) {
    saveConversationTrackers(filtered);
  }

  return removed;
}

/**
 * Resetea el tracker de un contacto (útil para testing o reseteo manual)
 */
export function resetContactTracker(contactId: string): void {
  const trackers = loadConversationTrackers();
  const filtered = trackers.filter(t => t.contactId !== contactId);
  saveConversationTrackers(filtered);
}

// ============================================================================
// RESPONSE LOG FUNCTIONS
// ============================================================================

export interface ResponseLogEntry {
  id: string;
  contactId: string;
  timestamp: string;
  type: 'message_sent' | 'response_received' | 'followup_triggered';
  messageId?: string;
  automationId?: string;
  details?: string;
}

/**
 * Registra un evento en el log de respuestas
 */
export function logResponseEvent(
  contactId: string,
  type: 'message_sent' | 'response_received' | 'followup_triggered',
  details?: { messageId?: string; automationId?: string; details?: string }
): void {
  try {
    const log = loadResponseLog();
    const entry: ResponseLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId,
      timestamp: new Date().toISOString(),
      type,
      ...details,
    };

    log.push(entry);

    // Mantener solo los últimos 1000 eventos
    if (log.length > 1000) {
      log.splice(0, log.length - 1000);
    }

    localStorage.setItem(STORAGE_KEY_RESPONSE_LOG, JSON.stringify(log));
  } catch (error) {
    console.error('Error logging response event:', error);
  }
}

/**
 * Carga el log de respuestas
 */
export function loadResponseLog(): ResponseLogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_RESPONSE_LOG);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading response log:', error);
    return [];
  }
}

/**
 * Obtiene el log de un contacto específico
 */
export function getContactResponseLog(contactId: string): ResponseLogEntry[] {
  const log = loadResponseLog();
  return log.filter(entry => entry.contactId === contactId);
}
