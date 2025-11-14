import React, { useState, useEffect } from 'react';
import {
  loadAutomations,
  deleteAutomation,
  toggleAutomationStatus,
  duplicateAutomation,
  initializeDemoAutomations,
  Automation,
  getTriggerLabel,
} from '../utils/automationStorage';
import { loadContacts } from '../utils/storage';
import { executeAutomationForContacts } from '../utils/flowEngine';
import AutomationScheduler from '../components/automation/AutomationScheduler';
import MessageTrackingPanel from '../components/MessageTrackingPanel';

interface AutomationsProps {
  onNavigate: (section: string, data?: { automationId?: string | null }) => void;
}

const Automations: React.FC<AutomationsProps> = ({ onNavigate }) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para modal de ejecución
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showTrackingPanel, setShowTrackingPanel] = useState(false);

  useEffect(() => {
    loadData();
    setContacts(loadContacts());
  }, []);

  const loadData = () => {
    initializeDemoAutomations();
    const data = loadAutomations();
    setAutomations(data);
  };

  const handleExecuteNow = (automation: Automation) => {
    setSelectedAutomation(automation);
    setSelectedContacts(new Set());
    setExecutionResult(null);
    setShowExecuteModal(true);
  };

  const handleToggleContact = (contactId: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(contactId)) {
      newSet.delete(contactId);
    } else {
      newSet.add(contactId);
    }
    setSelectedContacts(newSet);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const handleExecute = async () => {
    if (!selectedAutomation || selectedContacts.size === 0) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await executeAutomationForContacts(
        selectedAutomation.id,
        Array.from(selectedContacts)
      );

      setExecutionResult(result);
      loadData(); // Reload automations to update stats
    } catch (error: any) {
      setExecutionResult({
        successCount: 0,
        failCount: selectedContacts.size,
        results: [],
        error: error.message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta automatización?')) {
      deleteAutomation(id);
      loadData();
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleAutomationStatus(id);
    loadData();
  };

  const handleDuplicate = (id: string) => {
    duplicateAutomation(id);
    loadData();
  };

  const handleEdit = (automation: Automation) => {
    onNavigate('flow-builder', { automationId: automation.id });
  };

  const handleCreateNew = () => {
    onNavigate('flow-builder', { automationId: null });
  };

  // Filtrar automations
  const filteredAutomations = automations.filter(automation => {
    // Filtro por estado
    if (filter === 'active' && !automation.active) return false;
    if (filter === 'inactive' && automation.active) return false;

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        automation.name.toLowerCase().includes(query) ||
        automation.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getTriggerFromAutomation = (automation: Automation): string => {
    const triggerNode = automation.nodes.find(n => n.type === 'trigger');
    if (!triggerNode) return 'Sin trigger';
    return getTriggerLabel(triggerNode.data.triggerType);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <i className="fas fa-magic text-purple-600 dark:text-purple-400"></i>
              Automatizaciones
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Crea flujos automáticos para ahorrar tiempo y mejorar la eficiencia
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTrackingPanel(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <i className="fas fa-chart-line"></i>
              Seguimiento de Mensajes
            </button>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Crear Automatización
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{automations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <i className="fas fa-magic text-purple-600 dark:text-purple-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {automations.filter(a => a.active).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inactivas</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {automations.filter(a => !a.active).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <i className="fas fa-pause-circle text-gray-600 dark:text-gray-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ejecuciones</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {automations.reduce((sum, a) => sum + a.stats.totalExecutions, 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <i className="fas fa-play-circle text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar automatizaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'inactive'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Inactivas
            </button>
          </div>
        </div>
      </div>

      {/* Automations List */}
      {filteredAutomations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-magic text-4xl text-purple-600 dark:text-purple-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay automatizaciones
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || filter !== 'all'
              ? 'No se encontraron automatizaciones con los filtros aplicados'
              : 'Crea tu primera automatización para comenzar a ahorrar tiempo'}
          </p>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <i className="fas fa-plus mr-2"></i>
            Crear Primera Automatización
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAutomations.map((automation) => (
            <div
              key={automation.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {automation.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        automation.active
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {automation.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{automation.description}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <i className="fas fa-bolt text-purple-600 dark:text-purple-400"></i>
                      <span>Trigger: {getTriggerFromAutomation(automation)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <i className="fas fa-code-branch text-blue-600 dark:text-blue-400"></i>
                      <span>{automation.nodes.length} nodos</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <i className="fas fa-play-circle text-green-600 dark:text-green-400"></i>
                      <span>{automation.stats.totalExecutions} ejecuciones</span>
                    </div>
                    {automation.stats.totalExecutions > 0 && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                        <span>
                          {Math.round(
                            (automation.stats.successfulExecutions / automation.stats.totalExecutions) * 100
                          )}
                          % éxito
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleExecuteNow(automation)}
                    className="p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors"
                    title="Ejecutar Ahora"
                  >
                    <i className="fas fa-bolt"></i>
                  </button>
                  <button
                    onClick={() => handleToggleStatus(automation.id)}
                    className={`p-3 rounded-lg transition-colors ${
                      automation.active
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={automation.active ? 'Desactivar' : 'Activar'}
                  >
                    <i className={`fas fa-${automation.active ? 'pause' : 'play'}`}></i>
                  </button>
                  <button
                    onClick={() => handleEdit(automation)}
                    className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDuplicate(automation.id)}
                    className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                    title="Duplicar"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(automation.id)}
                    className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Ejecución Manual */}
      {showExecuteModal && selectedAutomation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i className="fas fa-bolt text-orange-600 dark:text-orange-400"></i>
                  Ejecutar Automatización
                </h3>
                <button
                  onClick={() => setShowExecuteModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-gray-600 dark:text-gray-400"></i>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedAutomation.name}
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {!executionResult ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Seleccionar Contactos ({selectedContacts.size} seleccionados)
                    </h4>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      {selectedContacts.size === contacts.length ? 'Deseleccionar' : 'Seleccionar'} Todos
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-user-slash text-4xl mb-2"></i>
                      <p>No hay contactos disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => handleToggleContact(contact.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedContacts.has(contact.id)
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                selectedContacts.has(contact.id)
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {selectedContacts.has(contact.id) ? (
                                  <i className="fas fa-check"></i>
                                ) : (
                                  <i className="fas fa-user"></i>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {contact.name || 'Sin nombre'}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {contact.phone || 'Sin teléfono'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Resultados de Ejecución */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <div className="text-sm text-green-600 dark:text-green-400 mb-1">Exitosos</div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {executionResult.successCount}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                      <div className="text-sm text-red-600 dark:text-red-400 mb-1">Fallidos</div>
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {executionResult.failCount}
                      </div>
                    </div>
                  </div>

                  {executionResult.error && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {executionResult.error}
                      </p>
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {executionResult.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className={`fas fa-${result.success ? 'check-circle text-green-600 dark:text-green-400' : 'times-circle text-red-600 dark:text-red-400'}`}></i>
                            <span className={`text-sm ${
                              result.success
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              Contacto #{index + 1}
                            </span>
                          </div>
                          <span className={`text-xs ${
                            result.success
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {result.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {!executionResult ? (
                <>
                  <button
                    onClick={() => setShowExecuteModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={selectedContacts.size === 0 || isExecuting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExecuting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-bolt"></i>
                        Ejecutar ({selectedContacts.size})
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowExecuteModal(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AutomationScheduler - Corre en background */}
      <AutomationScheduler enabled={true} checkIntervalMinutes={5} />

      {/* Message Tracking Panel */}
      {showTrackingPanel && (
        <MessageTrackingPanel onClose={() => setShowTrackingPanel(false)} />
      )}
    </div>
  );
};

export default Automations;
