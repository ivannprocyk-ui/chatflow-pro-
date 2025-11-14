// AutomationScheduler - Ejecuta automatizaciones automáticamente basadas en triggers
// Verifica condiciones periódicamente y dispara flows cuando corresponde

import { useEffect, useRef } from 'react';
import {
  getNoResponseContacts,
  markFollowUpSent,
  logResponseEvent,
} from '../../utils/messageTracker';
import { loadAutomations } from '../../utils/automationStorage';
import { executeAutomationForContact } from '../../utils/flowEngine';

interface AutomationSchedulerProps {
  // Intervalo de verificación en minutos (por defecto: 5 minutos)
  checkIntervalMinutes?: number;
  // Activar/desactivar el scheduler
  enabled?: boolean;
}

const AutomationScheduler: React.FC<AutomationSchedulerProps> = ({
  checkIntervalMinutes = 5,
  enabled = true,
}) => {
  const intervalRef = useRef<number | null>(null);
  const lastCheckRef = useRef<number>(0);

  /**
   * Verifica triggers de "message_no_response"
   */
  const checkNoResponseTriggers = async () => {
    try {
      console.log('[SCHEDULER] Verificando triggers de no-respuesta...');

      // Obtener todas las automatizaciones activas con trigger de no-respuesta
      const automations = loadAutomations().filter(
        auto => auto.active && auto.nodes.some(
          node => node.type === 'trigger' && node.data.triggerType === 'message_no_response'
        )
      );

      if (automations.length === 0) {
        console.log('[SCHEDULER] No hay automatizaciones de no-respuesta activas');
        return;
      }

      // Obtener contactos sin respuesta
      const noResponseContacts = getNoResponseContacts();

      if (noResponseContacts.length === 0) {
        console.log('[SCHEDULER] No hay contactos sin respuesta pendientes');
        return;
      }

      console.log(`[SCHEDULER] Encontrados ${noResponseContacts.length} contactos sin respuesta`);

      // Ejecutar automatizaciones para cada contacto
      for (const { tracker, contact, hoursSinceLastMessage } of noResponseContacts) {
        // Buscar automatización que corresponda
        for (const automation of automations) {
          const triggerNode = automation.nodes.find(
            node => node.type === 'trigger' && node.data.triggerType === 'message_no_response'
          );

          if (!triggerNode) continue;

          // Verificar si el threshold configurado coincide
          const configuredHours = triggerNode.data.config.hoursWithoutResponse || 24;

          // Si el contacto pasó el threshold configurado, ejecutar
          if (hoursSinceLastMessage >= configuredHours) {
            console.log(
              `[SCHEDULER] Ejecutando automatización "${automation.name}" para ${contact.name} ` +
              `(${Math.round(hoursSinceLastMessage)}h sin respuesta)`
            );

            try {
              const result = await executeAutomationForContact(automation.id, contact.id);

              if (result.success) {
                // Marcar que se envió el follow-up
                markFollowUpSent(contact.id);

                // Log del evento
                logResponseEvent(contact.id, 'followup_triggered', {
                  automationId: automation.id,
                  details: `Follow-up automático después de ${Math.round(hoursSinceLastMessage)}h sin respuesta`,
                });

                console.log(`[SCHEDULER] ✅ Follow-up enviado exitosamente a ${contact.name}`);
              } else {
                console.error(`[SCHEDULER] ❌ Error en follow-up para ${contact.name}:`, result.message);
              }
            } catch (error) {
              console.error(`[SCHEDULER] ❌ Excepción al ejecutar follow-up:`, error);
            }

            // Pequeño delay para no saturar
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error('[SCHEDULER] Error al verificar triggers de no-respuesta:', error);
    }
  };

  /**
   * Función principal que ejecuta todas las verificaciones
   */
  const runSchedulerCheck = async () => {
    const now = Date.now();
    const timeSinceLastCheck = (now - lastCheckRef.current) / (1000 * 60); // minutos

    // Evitar ejecuciones muy frecuentes
    if (timeSinceLastCheck < 1) {
      return;
    }

    lastCheckRef.current = now;

    console.log(`[SCHEDULER] Iniciando verificación de automatizaciones (${new Date().toLocaleTimeString()})`);

    // Verificar triggers de no-respuesta
    await checkNoResponseTriggers();

    // Aquí se pueden agregar más tipos de triggers:
    // - checkBirthdayTriggers()
    // - checkInactiveTriggers()
    // - checkSpecificDateTriggers()
    // etc.

    console.log('[SCHEDULER] Verificación completada');
  };

  // Setup del intervalo de verificación
  useEffect(() => {
    if (!enabled) {
      console.log('[SCHEDULER] Scheduler desactivado');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`[SCHEDULER] Scheduler activado (intervalo: ${checkIntervalMinutes} minutos)`);

    // Ejecutar inmediatamente al montar (después de un pequeño delay)
    setTimeout(() => {
      runSchedulerCheck();
    }, 5000); // 5 segundos después de montar

    // Configurar intervalo
    const intervalMs = checkIntervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(() => {
      runSchedulerCheck();
    }, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log('[SCHEDULER] Scheduler detenido');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkIntervalMinutes, enabled]);

  // Este componente no renderiza nada
  return null;
};

export default AutomationScheduler;
