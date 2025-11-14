// AutomationScheduler - Motor completo de ejecución de automatizaciones
// Verifica TODOS los tipos de triggers y ejecuta flows automáticamente

import { useEffect, useRef } from 'react';
import {
  getNoResponseContacts,
  markFollowUpSent,
  logResponseEvent,
} from '../../utils/messageTracker';
import {
  loadAutomations,
  Automation,
  TriggerType
} from '../../utils/automationStorage';
import { executeAutomationForContact } from '../../utils/flowEngine';
import { loadCRMData, Contact } from '../../utils/storage';

interface AutomationSchedulerProps {
  checkIntervalMinutes?: number;
  enabled?: boolean;
}

const AutomationScheduler: React.FC<AutomationSchedulerProps> = ({
  checkIntervalMinutes = 5,
  enabled = true,
}) => {
  const intervalRef = useRef<number | null>(null);
  const lastCheckRef = useRef<number>(0);

  // ============================================================================
  // TRIGGER: new_contact (se debe llamar manualmente cuando se crea un contacto)
  // ============================================================================

  /**
   * Ejecuta automatizaciones para nuevos contactos
   * NOTA: Esta función debe ser llamada desde donde se crean contactos
   */
  const triggerNewContact = async (contactId: string) => {
    try {
      console.log('[SCHEDULER] Trigger: new_contact para contacto', contactId);

      const automations = loadAutomations().filter(
        auto => auto.active && auto.nodes.some(
          node => node.type === 'trigger' && node.data.triggerType === 'new_contact'
        )
      );

      for (const automation of automations) {
        console.log(`[SCHEDULER] Ejecutando "${automation.name}" para nuevo contacto`);

        const result = await executeAutomationForContact(automation.id, contactId);

        if (result.success) {
          console.log(`[SCHEDULER] ✅ Automatización ejecutada exitosamente`);
        } else {
          console.error(`[SCHEDULER] ❌ Error:`, result.message);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('[SCHEDULER] Error en trigger new_contact:', error);
    }
  };

  // ============================================================================
  // TRIGGER: contact_birthday
  // ============================================================================

  const checkBirthdayTriggers = async () => {
    try {
      console.log('[SCHEDULER] Verificando triggers de cumpleaños...');

      const automations = loadAutomations().filter(
        auto => auto.active && auto.nodes.some(
          node => node.type === 'trigger' && node.data.triggerType === 'contact_birthday'
        )
      );

      if (automations.length === 0) return;

      const contacts = loadCRMData();
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      for (const contact of contacts) {
        if (!contact.birthday) continue;

        const birthday = new Date(contact.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        const birthdayDay = birthday.getDate();

        // Verificar si es hoy el cumpleaños
        if (birthdayMonth === todayMonth && birthdayDay === todayDay) {
          console.log(`[SCHEDULER] 🎂 Cumpleaños de ${contact.name}`);

          for (const automation of automations) {
            const result = await executeAutomationForContact(automation.id, contact.id);

            if (result.success) {
              console.log(`[SCHEDULER] ✅ Mensaje de cumpleaños enviado a ${contact.name}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error('[SCHEDULER] Error en triggers de cumpleaños:', error);
    }
  };

  // ============================================================================
  // TRIGGER: contact_inactive
  // ============================================================================

  const checkInactiveTriggers = async () => {
    try {
      console.log('[SCHEDULER] Verificando triggers de inactividad...');

      const automations = loadAutomations().filter(
        auto => auto.active && auto.nodes.some(
          node => node.type === 'trigger' && node.data.triggerType === 'contact_inactive'
        )
      );

      if (automations.length === 0) return;

      const contacts = loadCRMData();
      const now = Date.now();

      for (const contact of contacts) {
        // Verificar última interacción
        const lastInteraction = contact.lastMessageDate
          ? new Date(contact.lastMessageDate).getTime()
          : new Date(contact.createdAt || Date.now()).getTime();

        const daysSinceInteraction = (now - lastInteraction) / (1000 * 60 * 60 * 24);

        for (const automation of automations) {
          const triggerNode = automation.nodes.find(
            node => node.type === 'trigger' && node.data.triggerType === 'contact_inactive'
          );

          if (!triggerNode) continue;

          const daysInactive = triggerNode.data.config.daysInactive || 7;

          if (daysSinceInteraction >= daysInactive) {
            // Verificar que no se haya ejecutado recientemente
            const lastExecutionKey = `last_inactive_exec_${contact.id}_${automation.id}`;
            const lastExecution = localStorage.getItem(lastExecutionKey);

            if (lastExecution) {
              const hoursSinceLastExec = (now - parseInt(lastExecution)) / (1000 * 60 * 60);
              if (hoursSinceLastExec < 24) continue; // No ejecutar más de una vez por día
            }

            console.log(
              `[SCHEDULER] Contacto inactivo: ${contact.name} (${Math.round(daysSinceInteraction)} días)`
            );

            const result = await executeAutomationForContact(automation.id, contact.id);

            if (result.success) {
              localStorage.setItem(lastExecutionKey, now.toString());
              console.log(`[SCHEDULER] ✅ Mensaje de reactivación enviado`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error('[SCHEDULER] Error en triggers de inactividad:', error);
    }
  };

  // ============================================================================
  // TRIGGER: message_no_response
  // ============================================================================

  const checkNoResponseTriggers = async () => {
    try {
      console.log('[SCHEDULER] Verificando triggers de no-respuesta...');

      const automations = loadAutomations().filter(
        auto => auto.active && auto.nodes.some(
          node => node.type === 'trigger' && node.data.triggerType === 'message_no_response'
        )
      );

      if (automations.length === 0) return;

      const noResponseContacts = getNoResponseContacts();

      if (noResponseContacts.length === 0) return;

      console.log(`[SCHEDULER] ${noResponseContacts.length} contactos sin respuesta`);

      for (const { tracker, contact, hoursSinceLastMessage } of noResponseContacts) {
        for (const automation of automations) {
          const triggerNode = automation.nodes.find(
            node => node.type === 'trigger' && node.data.triggerType === 'message_no_response'
          );

          if (!triggerNode) continue;

          const configuredHours = triggerNode.data.config.hoursWithoutResponse || 24;

          if (hoursSinceLastMessage >= configuredHours) {
            console.log(
              `[SCHEDULER] Ejecutando follow-up para ${contact.name} ` +
              `(${Math.round(hoursSinceLastMessage)}h sin respuesta)`
            );

            const result = await executeAutomationForContact(automation.id, contact.id);

            if (result.success) {
              markFollowUpSent(contact.id);
              logResponseEvent(contact.id, 'followup_triggered', {
                automationId: automation.id,
                details: `Follow-up después de ${Math.round(hoursSinceLastMessage)}h`,
              });
              console.log(`[SCHEDULER] ✅ Follow-up enviado`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error('[SCHEDULER] Error en triggers de no-respuesta:', error);
    }
  };

  // ============================================================================
  // TRIGGER: contact_status_change
  // ============================================================================

  const checkStatusChangeTriggers = async () => {
    // Este trigger se debe llamar manualmente cuando cambia el status de un contacto
    // Ver función triggerStatusChange() abajo
  };

  // ============================================================================
  // TRIGGER: specific_date
  // ============================================================================

  const checkSpecificDateTriggers = async () => {
    try {
      console.log('[SCHEDULER] Verificando triggers de fecha específica...');

      const automations = loadAutomations().filter(
        auto => auto.active && auto.nodes.some(
          node => node.type === 'trigger' && node.data.triggerType === 'specific_date'
        )
      );

      if (automations.length === 0) return;

      const contacts = loadCRMData();
      const now = new Date();
      const nowDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; // HH:MM

      for (const automation of automations) {
        const triggerNode = automation.nodes.find(
          node => node.type === 'trigger' && node.data.triggerType === 'specific_date'
        );

        if (!triggerNode) continue;

        const targetDate = triggerNode.data.config.date;
        const targetTime = triggerNode.data.config.time || '09:00';

        if (targetDate === nowDate && targetTime === nowTime) {
          console.log(`[SCHEDULER] 📅 Ejecutando automatización programada: ${automation.name}`);

          // Ejecutar para todos los contactos activos
          const activeContacts = contacts.filter(c => c.status !== 'inactive');

          for (const contact of activeContacts) {
            const result = await executeAutomationForContact(automation.id, contact.id);

            if (result.success) {
              console.log(`[SCHEDULER] ✅ Mensaje programado enviado a ${contact.name}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error('[SCHEDULER] Error en triggers de fecha específica:', error);
    }
  };

  // ============================================================================
  // TRIGGER: tag_added
  // ============================================================================

  const triggerTagAdded = async (contactId: string, tagId: string) => {
    try {
      console.log('[SCHEDULER] Trigger: tag_added', { contactId, tagId });

      const automations = loadAutomations().filter(
        auto => auto.active && auto.nodes.some(
          node => node.type === 'trigger' &&
          node.data.triggerType === 'tag_added' &&
          (!node.data.config.tagId || node.data.config.tagId === tagId)
        )
      );

      for (const automation of automations) {
        console.log(`[SCHEDULER] Ejecutando "${automation.name}" por tag agregado`);

        const result = await executeAutomationForContact(automation.id, contactId);

        if (result.success) {
          console.log(`[SCHEDULER] ✅ Automatización ejecutada por tag`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('[SCHEDULER] Error en trigger tag_added:', error);
    }
  };

  // ============================================================================
  // FUNCIÓN PRINCIPAL DE VERIFICACIÓN
  // ============================================================================

  const runSchedulerCheck = async () => {
    const now = Date.now();
    const timeSinceLastCheck = (now - lastCheckRef.current) / (1000 * 60);

    if (timeSinceLastCheck < 1) return;

    lastCheckRef.current = now;

    console.log(`[SCHEDULER] 🔍 Verificación de automatizaciones (${new Date().toLocaleTimeString()})`);

    // Ejecutar todos los checks periódicos
    await checkBirthdayTriggers();
    await checkInactiveTriggers();
    await checkNoResponseTriggers();
    await checkSpecificDateTriggers();

    console.log('[SCHEDULER] ✅ Verificación completada');
  };

  // ============================================================================
  // SETUP DEL INTERVALO
  // ============================================================================

  useEffect(() => {
    if (!enabled) {
      console.log('[SCHEDULER] ⏸️ Scheduler desactivado');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`[SCHEDULER] ▶️ Scheduler activado (cada ${checkIntervalMinutes} min)`);

    // Ejecutar después de 5 segundos
    setTimeout(() => {
      runSchedulerCheck();
    }, 5000);

    // Configurar intervalo
    const intervalMs = checkIntervalMinutes * 60 * 1000;
    intervalRef.current = window.setInterval(() => {
      runSchedulerCheck();
    }, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log('[SCHEDULER] ⏹️ Scheduler detenido');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkIntervalMinutes, enabled]);

  // Este componente no renderiza nada
  return null;
};

export default AutomationScheduler;

// ============================================================================
// FUNCIONES AUXILIARES PARA EXPORTAR
// ============================================================================

/**
 * Llamar esta función cuando se crea un nuevo contacto
 */
export const triggerNewContactAutomations = async (contactId: string) => {
  console.log('[TRIGGER] new_contact', contactId);

  const automations = loadAutomations().filter(
    auto => auto.active && auto.nodes.some(
      node => node.type === 'trigger' && node.data.triggerType === 'new_contact'
    )
  );

  for (const automation of automations) {
    await executeAutomationForContact(automation.id, contactId);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

/**
 * Llamar esta función cuando cambia el status de un contacto
 */
export const triggerStatusChangeAutomations = async (
  contactId: string,
  fromStatus: string,
  toStatus: string
) => {
  console.log('[TRIGGER] contact_status_change', { contactId, fromStatus, toStatus });

  const automations = loadAutomations().filter(
    auto => auto.active && auto.nodes.some(
      node => node.type === 'trigger' &&
      node.data.triggerType === 'contact_status_change' &&
      (!node.data.config.fromStatus || node.data.config.fromStatus === fromStatus) &&
      (!node.data.config.toStatus || node.data.config.toStatus === toStatus)
    )
  );

  for (const automation of automations) {
    await executeAutomationForContact(automation.id, contactId);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

/**
 * Llamar esta función cuando se agrega un tag
 */
export const triggerTagAddedAutomations = async (contactId: string, tagId: string) => {
  console.log('[TRIGGER] tag_added', { contactId, tagId });

  const automations = loadAutomations().filter(
    auto => auto.active && auto.nodes.some(
      node => node.type === 'trigger' &&
      node.data.triggerType === 'tag_added' &&
      (!node.data.config.tagId || node.data.config.tagId === tagId)
    )
  );

  for (const automation of automations) {
    await executeAutomationForContact(automation.id, contactId);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
