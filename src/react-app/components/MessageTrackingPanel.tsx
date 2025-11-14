// MessageTrackingPanel - Panel de seguimiento de conversaciones y respuestas
// Muestra qué contactos han respondido y cuáles necesitan follow-up

import React, { useState, useEffect } from 'react';
import {
  loadConversationTrackers,
  getMessageResponseStats,
  getNoResponseContacts,
  getContactResponseLog,
  trackMessageResponse,
  resetContactTracker,
  ConversationTracker,
} from '../utils/messageTracker';
import { loadCRMData, Contact } from '../utils/storage';

interface MessageTrackingPanelProps {
  onClose?: () => void;
}

const MessageTrackingPanel: React.FC<MessageTrackingPanelProps> = ({ onClose }) => {
  const [trackers, setTrackers] = useState<ConversationTracker[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'awaiting' | 'responded'>('all');
  const [selectedContact, setSelectedContact] = useState<ConversationTracker | null>(null);
  const [contactLog, setContactLog] = useState<any[]>([]);

  const loadData = () => {
    setTrackers(loadConversationTrackers());
    setContacts(loadCRMData());
    setStats(getMessageResponseStats());
  };

  useEffect(() => {
    loadData();
    // Recargar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedContact) {
      setContactLog(getContactResponseLog(selectedContact.contactId));
    }
  }, [selectedContact]);

  const getContact = (contactId: string): Contact | undefined => {
    return contacts.find(c => c.id === contactId);
  };

  const handleMarkAsResponded = (contactId: string) => {
    if (confirm('¿Marcar este contacto como respondido?')) {
      trackMessageResponse(contactId);
      loadData();
    }
  };

  const handleResetTracker = (contactId: string) => {
    if (confirm('¿Resetear el tracker de este contacto?')) {
      resetContactTracker(contactId);
      loadData();
      setSelectedContact(null);
    }
  };

  const getTimeSinceMessage = (tracker: ConversationTracker): string => {
    const sentTime = new Date(tracker.lastMessageSentAt).getTime();
    const now = Date.now();
    const hours = Math.floor((now - sentTime) / (1000 * 60 * 60));
    const minutes = Math.floor((now - sentTime) / (1000 * 60)) % 60;

    if (hours > 48) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const filteredTrackers = trackers.filter(tracker => {
    if (filter === 'awaiting') return tracker.awaitingResponse;
    if (filter === 'responded') return !tracker.awaitingResponse;
    return true;
  });

  const noResponseList = getNoResponseContacts();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <i className="fas fa-chart-line text-blue-600 dark:text-blue-400"></i>
              Panel de Seguimiento de Conversaciones
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-600 dark:text-gray-400"></i>
              </button>
            )}
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Enviados</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSent}</div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Respondieron</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalResponded}</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stats.responseRate.toFixed(1)}% tasa de respuesta
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Sin Respuesta</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalNoResponse}</div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Tiempo Promedio</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.averageResponseTimeHours.toFixed(1)}h
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Todos ({trackers.length})
            </button>
            <button
              onClick={() => setFilter('awaiting')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'awaiting'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Esperando Respuesta ({trackers.filter(t => t.awaitingResponse).length})
            </button>
            <button
              onClick={() => setFilter('responded')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'responded'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Respondieron ({trackers.filter(t => !t.awaitingResponse).length})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Alerta de contactos sin respuesta */}
          {noResponseList.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
                <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                  {noResponseList.length} contacto(s) pasaron el tiempo de espera sin responder
                </span>
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-400">
                Las automatizaciones de follow-up se ejecutarán automáticamente
              </div>
            </div>
          )}

          {/* Tracker List */}
          {filteredTrackers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <i className="fas fa-inbox text-4xl mb-2"></i>
              <p>No hay conversaciones para mostrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrackers.map(tracker => {
                const contact = getContact(tracker.contactId);
                if (!contact) return null;

                const timeSince = getTimeSinceMessage(tracker);
                const isOverdue = tracker.awaitingResponse &&
                  ((Date.now() - new Date(tracker.lastMessageSentAt).getTime()) / (1000 * 60 * 60)) >= tracker.noResponseThresholdHours;

                return (
                  <div
                    key={tracker.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedContact?.id === tracker.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : isOverdue
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                        : tracker.awaitingResponse
                        ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10'
                        : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                    }`}
                    onClick={() => setSelectedContact(tracker)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tracker.awaitingResponse
                              ? isOverdue
                                ? 'bg-red-600 text-white'
                                : 'bg-orange-600 text-white'
                              : 'bg-green-600 text-white'
                          }`}>
                            <i className={`fas fa-${tracker.awaitingResponse ? 'clock' : 'check'}`}></i>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {contact.name || 'Sin nombre'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {contact.phone}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ml-13">
                          <div className="flex items-center gap-1">
                            <i className="fas fa-paper-plane text-xs"></i>
                            <span>Último mensaje: {timeSince} atrás</span>
                          </div>
                          {tracker.lastResponseAt && (
                            <div className="flex items-center gap-1">
                              <i className="fas fa-reply text-xs text-green-600 dark:text-green-400"></i>
                              <span>
                                Respondió:{' '}
                                {new Date(tracker.lastResponseAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {tracker.followUpSent && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-xs font-medium">
                              Follow-up enviado
                            </span>
                          )}
                          {isOverdue && !tracker.followUpSent && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                              ⚠ Necesita seguimiento
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {tracker.awaitingResponse && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsResponded(tracker.contactId);
                            }}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors text-sm"
                          >
                            <i className="fas fa-check mr-1"></i>
                            Marcar Respondido
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetTracker(tracker.contactId);
                          }}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          <i className="fas fa-redo mr-1"></i>
                          Resetear
                        </button>
                      </div>
                    </div>

                    {/* Contact Log (cuando está seleccionado) */}
                    {selectedContact?.id === tracker.id && contactLog.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Historial de Eventos
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {contactLog.map(log => (
                            <div
                              key={log.id}
                              className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                            >
                              <i className={`fas fa-${
                                log.type === 'message_sent' ? 'paper-plane' :
                                log.type === 'response_received' ? 'reply' :
                                'bolt'
                              } text-gray-400`}></i>
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                              <span>-</span>
                              <span>{log.details || log.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={loadData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-sync-alt"></i>
            Recargar Datos
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageTrackingPanel;
