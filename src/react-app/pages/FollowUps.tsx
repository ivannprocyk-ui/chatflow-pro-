import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Play, Pause, TrendingUp, Users, MessageSquare, Clock, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { followUpsAPI } from '../services/api';

// =====================================================
// TIPOS
// =====================================================

type TriggerType = 'keyword' | 'variable' | 'conversation_state' | 'bot_stage' | 'time_based' | 'action';
type Strategy = 'passive' | 'moderate' | 'aggressive';
type DelayUnit = 'minutes' | 'hours' | 'days';

interface FollowUpMessage {
  id?: string;
  step_order: number;
  delay_amount: number;
  delay_unit: DelayUnit;
  message_template: string;
  available_variables: string[];
}

interface FollowUpSequence {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger_type: TriggerType;
  trigger_config: any;
  strategy: Strategy;
  messages: FollowUpMessage[];
  total_executions?: number;
  successful_conversions?: number;
  conversion_rate?: number;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const FollowUps: React.FC = () => {
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSequence, setEditingSequence] = useState<FollowUpSequence | null>(null);
  const [expandedSequence, setExpandedSequence] = useState<string | null>(null);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    try {
      const data = await followUpsAPI.getAllSequences();
      setSequences(data);
    } catch (error) {
      console.error('Error loading sequences:', error);
    }
  };

  const handleCreateNew = () => {
    const newSequence: FollowUpSequence = {
      name: '',
      description: '',
      enabled: true,
      trigger_type: 'keyword',
      trigger_config: { keywords: [] },
      strategy: 'moderate',
      messages: [
        {
          step_order: 1,
          delay_amount: 30,
          delay_unit: 'minutes',
          message_template: '',
          available_variables: ['nombre', 'producto'],
        },
      ],
    };
    setEditingSequence(newSequence);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingSequence) return;

    try {
      if (editingSequence.id) {
        // Actualizar
        await followUpsAPI.updateSequence(editingSequence.id, editingSequence);
      } else {
        // Crear
        await followUpsAPI.createSequence(editingSequence);
      }

      await loadSequences();
      setEditingSequence(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving sequence:', error);
      alert('Error guardando la secuencia');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta secuencia?')) return;

    try {
      await followUpsAPI.deleteSequence(id);
      await loadSequences();
    } catch (error) {
      console.error('Error deleting sequence:', error);
    }
  };

  const handleToggleEnabled = async (sequence: FollowUpSequence) => {
    try {
      await followUpsAPI.updateSequence(sequence.id!, {
        ...sequence,
        enabled: !sequence.enabled,
      });
      await loadSequences();
    } catch (error) {
      console.error('Error toggling sequence:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Seguimientos Inteligentes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Crea secuencias personalizadas de mensajes para recuperar conversaciones
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Secuencia
          </button>
        </div>
      </div>

      {/* Modal de Edición */}
      {editingSequence && (
        <SequenceEditor
          sequence={editingSequence}
          onChange={setEditingSequence}
          onSave={handleSave}
          onCancel={() => {
            setEditingSequence(null);
            setIsCreating(false);
          }}
        />
      )}

      {/* Lista de Secuencias */}
      <div className="max-w-7xl mx-auto space-y-4">
        {sequences.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
            <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay secuencias creadas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crea tu primera secuencia de seguimiento inteligente
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Crear Primera Secuencia
            </button>
          </div>
        ) : (
          sequences.map((sequence) => (
            <SequenceCard
              key={sequence.id}
              sequence={sequence}
              isExpanded={expandedSequence === sequence.id}
              onToggleExpand={() => setExpandedSequence(expandedSequence === sequence.id ? null : sequence.id!)}
              onEdit={() => setEditingSequence(sequence)}
              onDelete={() => handleDelete(sequence.id!)}
              onToggleEnabled={() => handleToggleEnabled(sequence)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// =====================================================
// COMPONENTE: TARJETA DE SECUENCIA
// =====================================================

interface SequenceCardProps {
  sequence: FollowUpSequence;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
}

const SequenceCard: React.FC<SequenceCardProps> = ({
  sequence,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleEnabled,
}) => {
  const getTriggerLabel = (type: TriggerType): string => {
    const labels = {
      keyword: 'Palabra clave',
      variable: 'Variable capturada',
      conversation_state: 'Estado de conversación',
      bot_stage: 'Etapa del bot',
      time_based: 'Tiempo sin respuesta',
      action: 'Acción realizada',
    };
    return labels[type];
  };

  const getStrategyLabel = (strategy: Strategy): string => {
    const labels = {
      passive: 'Pasivo',
      moderate: 'Moderado',
      aggressive: 'Agresivo',
    };
    return labels[strategy];
  };

  const getStrategyColor = (strategy: Strategy): string => {
    const colors = {
      passive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      aggressive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[strategy];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {sequence.name}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStrategyColor(sequence.strategy)}`}>
                {getStrategyLabel(sequence.strategy)}
              </span>
              <button
                onClick={onToggleEnabled}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sequence.enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {sequence.enabled ? 'Activa' : 'Pausada'}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{sequence.description}</p>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sequence.total_executions || 0} ejecuciones
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sequence.successful_conversions || 0} conversiones
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sequence.messages?.length || 0} mensajes
                </span>
              </div>
            </div>

            {/* Trigger Info */}
            <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
              <Clock size={14} className="text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Trigger: {getTriggerLabel(sequence.trigger_type)}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onToggleExpand}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes (expandido) */}
      {isExpanded && sequence.messages && sequence.messages.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Secuencia de Mensajes:
          </h4>
          <div className="space-y-3">
            {sequence.messages.map((msg, index) => (
              <div key={index} className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {msg.step_order}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Enviar después de {msg.delay_amount} {msg.delay_unit === 'minutes' ? 'minutos' : msg.delay_unit === 'hours' ? 'horas' : 'días'}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{msg.message_template}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// COMPONENTE: EDITOR DE SECUENCIA (MODAL)
// =====================================================

interface SequenceEditorProps {
  sequence: FollowUpSequence;
  onChange: (sequence: FollowUpSequence) => void;
  onSave: () => void;
  onCancel: () => void;
}

const SequenceEditor: React.FC<SequenceEditorProps> = ({ sequence, onChange, onSave, onCancel }) => {
  const addMessage = () => {
    const newMessage: FollowUpMessage = {
      step_order: sequence.messages.length + 1,
      delay_amount: 60,
      delay_unit: 'minutes',
      message_template: '',
      available_variables: ['nombre', 'producto'],
    };

    onChange({
      ...sequence,
      messages: [...sequence.messages, newMessage],
    });
  };

  const removeMessage = (index: number) => {
    const updatedMessages = sequence.messages.filter((_, i) => i !== index);
    // Reordenar step_order
    updatedMessages.forEach((msg, i) => {
      msg.step_order = i + 1;
    });

    onChange({
      ...sequence,
      messages: updatedMessages,
    });
  };

  const updateMessage = (index: number, field: keyof FollowUpMessage, value: any) => {
    const updatedMessages = [...sequence.messages];
    updatedMessages[index] = {
      ...updatedMessages[index],
      [field]: value,
    };

    onChange({
      ...sequence,
      messages: updatedMessages,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {sequence.id ? 'Editar Secuencia' : 'Nueva Secuencia'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información Básica</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Secuencia *
              </label>
              <input
                type="text"
                value={sequence.name}
                onChange={(e) => onChange({ ...sequence, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Cotización no contestada"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={sequence.description}
                onChange={(e) => onChange({ ...sequence, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Describe cuándo se activa esta secuencia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Trigger *
                </label>
                <select
                  value={sequence.trigger_type}
                  onChange={(e) => onChange({ ...sequence, trigger_type: e.target.value as TriggerType })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="keyword">Palabra clave</option>
                  <option value="variable">Variable capturada</option>
                  <option value="conversation_state">Estado de conversación</option>
                  <option value="bot_stage">Etapa del bot</option>
                  <option value="time_based">Tiempo sin respuesta</option>
                  <option value="action">Acción realizada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estrategia *
                </label>
                <select
                  value={sequence.strategy}
                  onChange={(e) => onChange({ ...sequence, strategy: e.target.value as Strategy })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="passive">Pasivo (3 mensajes, intervalos largos)</option>
                  <option value="moderate">Moderado (4 mensajes, intervalos medios)</option>
                  <option value="aggressive">Agresivo (5 mensajes, intervalos cortos)</option>
                </select>
              </div>
            </div>

            {/* Configuración del Trigger (simplificado) */}
            {sequence.trigger_type === 'keyword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Palabras Clave (separadas por comas)
                </label>
                <input
                  type="text"
                  value={sequence.trigger_config?.keywords?.join(', ') || ''}
                  onChange={(e) =>
                    onChange({
                      ...sequence,
                      trigger_config: {
                        ...sequence.trigger_config,
                        keywords: e.target.value.split(',').map((k) => k.trim()),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="precio, cotización, información"
                />
              </div>
            )}

            {sequence.trigger_type === 'time_based' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minutos sin respuesta
                </label>
                <input
                  type="number"
                  value={sequence.trigger_config?.no_response_minutes || 30}
                  onChange={(e) =>
                    onChange({
                      ...sequence,
                      trigger_config: {
                        ...sequence.trigger_config,
                        no_response_minutes: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Mensajes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mensajes de la Secuencia</h3>
              <button
                onClick={addMessage}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Agregar Mensaje
              </button>
            </div>

            <div className="space-y-4">
              {sequence.messages.map((message, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {message.step_order}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            value={message.delay_amount}
                            onChange={(e) => updateMessage(index, 'delay_amount', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unidad
                          </label>
                          <select
                            value={message.delay_unit}
                            onChange={(e) => updateMessage(index, 'delay_unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="minutes">Minutos</option>
                            <option value="hours">Horas</option>
                            <option value="days">Días</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => removeMessage(index)}
                            className="w-full px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 size={16} className="mx-auto" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Mensaje (usa {'{nombre}'}, {'{producto}'}, etc.)
                        </label>
                        <textarea
                          value={message.message_template}
                          onChange={(e) => updateMessage(index, 'message_template', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          rows={3}
                          placeholder="Hola {nombre}, ¿estás por ahí? ¿Te quedó alguna duda sobre {producto}?"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Save size={18} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowUps;
