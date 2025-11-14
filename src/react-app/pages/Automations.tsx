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

interface AutomationsProps {
  onNavigate: (section: string, data?: { automationId?: string | null }) => void;
}

const Automations: React.FC<AutomationsProps> = ({ onNavigate }) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    initializeDemoAutomations();
    const data = loadAutomations();
    setAutomations(data);
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
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Crear Automatización
          </button>
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
    </div>
  );
};

export default Automations;
