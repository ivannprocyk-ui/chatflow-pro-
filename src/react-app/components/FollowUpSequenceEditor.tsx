import React from 'react';

type TriggerType = 'keyword' | 'variable' | 'conversation_state' | 'bot_stage' | 'time_based' | 'action' | 'no_response' | 'specific_intent' | 'customer_left' | 'price_requested' | 'info_sent' | 'cart_abandoned';
type Strategy = 'passive' | 'moderate' | 'aggressive';
type DelayUnit = 'minutes' | 'hours' | 'days';
type MessageType = 'fixed' | 'ai_generated';

interface FollowUpMessage {
  id?: string;
  step_order: number;
  delay_amount: number;
  delay_unit: DelayUnit;
  message_template: string;
  message_type: MessageType;
  ai_context_instructions?: string;
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
  conditions?: {
    business_hours_only?: boolean;
    days_of_week?: number[];
    hours_start?: string;
    hours_end?: string;
    max_follow_ups_per_contact?: number;
  };
  messages: FollowUpMessage[];
  total_executions?: number;
  successful_conversions?: number;
}

interface Props {
  sequence: FollowUpSequence;
  onSave: (sequence: FollowUpSequence) => void;
  onCancel: () => void;
  businessName: string;
  darkMode?: boolean;
}

export default function FollowUpSequenceEditor({ sequence, onSave, onCancel, businessName, darkMode = false }: Props) {
  const [editedSequence, setEditedSequence] = React.useState<FollowUpSequence>(sequence);
  const [selectedMessageIndex, setSelectedMessageIndex] = React.useState(0);
  const [showPreview, setShowPreview] = React.useState(true);

  const updateSequence = (updates: Partial<FollowUpSequence>) => {
    setEditedSequence({ ...editedSequence, ...updates });
  };

  const updateMessage = (index: number, updates: Partial<FollowUpMessage>) => {
    const newMessages = [...editedSequence.messages];
    newMessages[index] = { ...newMessages[index], ...updates };
    setEditedSequence({ ...editedSequence, messages: newMessages });
  };

  const addMessage = () => {
    const newMessage: FollowUpMessage = {
      step_order: editedSequence.messages.length + 1,
      delay_amount: 60,
      delay_unit: 'minutes',
      message_template: '',
      message_type: 'fixed',
      available_variables: ['nombre', 'producto', 'precio', 'empresa'],
    };
    setEditedSequence({
      ...editedSequence,
      messages: [...editedSequence.messages, newMessage],
    });
    setSelectedMessageIndex(editedSequence.messages.length);
  };

  const removeMessage = (index: number) => {
    const newMessages = editedSequence.messages.filter((_, i) => i !== index);
    newMessages.forEach((msg, i) => { msg.step_order = i + 1; });
    setEditedSequence({ ...editedSequence, messages: newMessages });
    if (selectedMessageIndex >= newMessages.length) {
      setSelectedMessageIndex(Math.max(0, newMessages.length - 1));
    }
  };

  const renderMessagePreview = (message: FollowUpMessage) => {
    if (message.message_type === 'ai_generated') {
      return `[Este mensaje será generado por IA según el contexto de la conversación]\n\nInstrucciones para la IA: ${message.ai_context_instructions || 'Generar un mensaje de seguimiento apropiado'}`;
    }

    let preview = message.message_template;
    const exampleVars: Record<string, string> = {
      nombre: 'Juan',
      producto: 'Plan Premium',
      precio: '$99',
      empresa: businessName || 'Mi Empresa',
      fecha: new Date().toLocaleDateString('es-ES'),
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    Object.entries(exampleVars).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return preview || '(Mensaje vacío)';
  };

  const renderWeekdaySelector = () => {
    const days = [
      { label: 'Dom', value: 0 },
      { label: 'Lun', value: 1 },
      { label: 'Mar', value: 2 },
      { label: 'Mié', value: 3 },
      { label: 'Jue', value: 4 },
      { label: 'Vie', value: 5 },
      { label: 'Sáb', value: 6 },
    ];

    const selectedDays = editedSequence.conditions?.days_of_week || [];

    const toggleDay = (day: number) => {
      const newDays = selectedDays.includes(day)
        ? selectedDays.filter(d => d !== day)
        : [...selectedDays, day].sort();

      setEditedSequence({
        ...editedSequence,
        conditions: {
          ...editedSequence.conditions,
          days_of_week: newDays,
        },
      });
    };

    return (
      <div className="flex gap-2">
        {days.map(day => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedDays.includes(day.value)
                ? 'bg-purple-600 text-white shadow-md dark:bg-purple-500'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>
    );
  };

  const getTriggerOptions = (): { value: TriggerType; label: string; desc: string }[] => [
    { value: 'no_response', label: 'Cliente no respondió', desc: 'Cuando el cliente no responde al bot' },
    { value: 'price_requested', label: 'Pidió precio', desc: 'Cliente preguntó por precio o cotización' },
    { value: 'info_sent', label: 'Información enviada', desc: 'Bot envió info y cliente no respondió' },
    { value: 'keyword', label: 'Palabra clave', desc: 'Detecta palabras específicas' },
    { value: 'variable', label: 'Variable capturada', desc: 'Cuando se captura una variable (nombre, email, etc.)' },
    { value: 'conversation_state', label: 'Estado de conversación', desc: 'Basado en el estado actual' },
    { value: 'bot_stage', label: 'Etapa del bot', desc: 'En una etapa específica del flujo' },
    { value: 'time_based', label: 'Basado en tiempo', desc: 'Después de X tiempo sin respuesta' },
    { value: 'action', label: 'Acción realizada', desc: 'Cuando se realiza una acción (envío de doc, etc.)' },
    { value: 'specific_intent', label: 'Intención detectada', desc: 'IA detecta una intención específica' },
    { value: 'customer_left', label: 'Cliente se fue', desc: 'Cliente abandonó la conversación' },
    { value: 'cart_abandoned', label: 'Carrito abandonado', desc: 'Para ecommerce, carrito sin completar' },
  ];

  const selectedMessage = editedSequence.messages[selectedMessageIndex];

  // Calcular timeline acumulativo
  const calculateTimeline = () => {
    let accumulatedMinutes = 0;
    return editedSequence.messages.map((msg, idx) => {
      const multipliers = { minutes: 1, hours: 60, days: 1440 };
      accumulatedMinutes += msg.delay_amount * multipliers[msg.delay_unit];

      const hours = Math.floor(accumulatedMinutes / 60);
      const mins = accumulatedMinutes % 60;
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      let timeLabel = '';
      if (days > 0) timeLabel += `${days}d `;
      if (remainingHours > 0) timeLabel += `${remainingHours}h `;
      if (mins > 0 || timeLabel === '') timeLabel += `${mins}m`;

      return {
        ...msg,
        accumulatedTime: timeLabel.trim(),
        accumulatedMinutes,
      };
    });
  };

  const timeline = calculateTimeline();

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full my-8 max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-500 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editedSequence.id ? 'Editar Secuencia' : 'Nueva Secuencia de Seguimiento'}
            </h2>
            <p className="text-purple-100 mt-1">
              Configura mensajes automáticos para recuperar conversaciones
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <div className="col-span-1 space-y-6">
              {/* Información Básica */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-info-circle text-purple-600"></i>
                  Información Básica
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre de la Secuencia *
                    </label>
                    <input
                      type="text"
                      value={editedSequence.name}
                      onChange={(e) => updateSequence({ name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                      placeholder="Ej: Cotización no contestada"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={editedSequence.description}
                      onChange={(e) => updateSequence({ description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                      rows={2}
                      placeholder="Describe cuándo se activa esta secuencia..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Trigger *
                    </label>
                    <select
                      value={editedSequence.trigger_type}
                      onChange={(e) => updateSequence({ trigger_type: e.target.value as TriggerType })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    >
                      {getTriggerOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getTriggerOptions().find(o => o.value === editedSequence.trigger_type)?.desc}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estrategia *
                    </label>
                    <select
                      value={editedSequence.strategy}
                      onChange={(e) => updateSequence({ strategy: e.target.value as Strategy })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    >
                      <option value="passive">Pasivo - 3 mensajes, intervalos largos</option>
                      <option value="moderate">Moderado - 4 mensajes, intervalos medios</option>
                      <option value="aggressive">Agresivo - 5 mensajes, intervalos cortos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Horarios de Envío */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-calendar-alt text-purple-600"></i>
                  Horarios de Envío
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="business_hours"
                      checked={editedSequence.conditions?.business_hours_only || false}
                      onChange={(e) => updateSequence({
                        conditions: {
                          ...editedSequence.conditions,
                          business_hours_only: e.target.checked,
                        },
                      })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="business_hours" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Solo enviar en horario laboral
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Días de la semana
                    </label>
                    {renderWeekdaySelector()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hora inicio
                      </label>
                      <input
                        type="time"
                        value={editedSequence.conditions?.hours_start || '09:00'}
                        onChange={(e) => updateSequence({
                          conditions: {
                            ...editedSequence.conditions,
                            hours_start: e.target.value,
                          },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hora fin
                      </label>
                      <input
                        type="time"
                        value={editedSequence.conditions?.hours_end || '18:00'}
                        onChange={(e) => updateSequence({
                          conditions: {
                            ...editedSequence.conditions,
                            hours_end: e.target.value,
                          },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máximo de seguimientos por contacto
                    </label>
                    <input
                      type="number"
                      value={editedSequence.conditions?.max_follow_ups_per_contact || 3}
                      onChange={(e) => updateSequence({
                        conditions: {
                          ...editedSequence.conditions,
                          max_follow_ups_per_contact: parseInt(e.target.value),
                        },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-clock text-blue-600 dark:text-blue-400"></i>
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">Inactivo</span>
                  </div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {editedSequence.trigger_config?.no_response_minutes || 30} min
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-paper-plane text-green-600 dark:text-green-400"></i>
                    <span className="text-xs font-semibold text-green-900 dark:text-green-200">Primer seguimiento</span>
                  </div>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {editedSequence.messages[0]?.delay_amount || 0} {editedSequence.messages[0]?.delay_unit === 'minutes' ? 'min' : editedSequence.messages[0]?.delay_unit === 'hours' ? 'hrs' : 'días'}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-sync text-purple-600 dark:text-purple-400"></i>
                    <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">Intervalo</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {editedSequence.messages[1]?.delay_amount || 0} {editedSequence.messages[1]?.delay_unit === 'minutes' ? 'min' : editedSequence.messages[1]?.delay_unit === 'hours' ? 'hrs' : 'días'}
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-list-ol text-orange-600 dark:text-orange-400"></i>
                    <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">Max. seguimientos</span>
                  </div>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {editedSequence.conditions?.max_follow_ups_per_contact || 3}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Column - Timeline & Messages */}
            <div className="col-span-1 space-y-6">
              {/* Timeline Visual */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="fas fa-stream text-purple-600"></i>
                    Timeline de Mensajes
                  </h3>
                  <button
                    onClick={addMessage}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    <i className="fas fa-plus"></i>
                    Agregar
                  </button>
                </div>

                {/* Timeline vertical */}
                <div className="relative">
                  {timeline.map((msg, index) => (
                    <div key={index} className="relative pb-8 last:pb-0">
                      {/* Línea conectora */}
                      {index < timeline.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                      )}

                      {/* Nodo del timeline */}
                      <div
                        className={`flex items-start gap-3 cursor-pointer ${
                          selectedMessageIndex === index ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                        } transition-opacity`}
                        onClick={() => setSelectedMessageIndex(index)}
                      >
                        {/* Círculo numerado */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm z-10 ${
                          selectedMessageIndex === index
                            ? 'bg-purple-600 text-white ring-4 ring-purple-200 dark:ring-purple-900'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {msg.step_order}
                        </div>

                        {/* Contenido */}
                        <div className={`flex-1 p-3 rounded-lg border-2 ${
                          selectedMessageIndex === index
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        } transition-colors`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-clock text-xs text-gray-500 dark:text-gray-400"></i>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Después de {msg.delay_amount} {
                                  msg.delay_unit === 'minutes' ? 'min' :
                                  msg.delay_unit === 'hours' ? 'hrs' : 'días'
                                }
                              </span>
                              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                                ({msg.accumulatedTime} acumulado)
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMessage(index);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>

                          {/* Tipo de mensaje */}
                          <div className="flex items-center gap-2 mb-2">
                            <i className={`fas ${msg.message_type === 'fixed' ? 'fa-file-alt' : 'fa-robot'} text-xs`}></i>
                            <span className={`text-xs px-2 py-1 rounded ${
                              msg.message_type === 'fixed'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            }`}>
                              {msg.message_type === 'fixed' ? 'Fijo' : 'Generado por IA'}
                            </span>
                          </div>

                          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                            {msg.message_type === 'fixed'
                              ? (msg.message_template || '(Sin mensaje)')
                              : `[IA] ${msg.ai_context_instructions || 'Sin instrucciones'}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {timeline.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-info-circle text-2xl mb-2"></i>
                      <p className="text-sm">No hay mensajes. Agrega el primero.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Message Editor & Preview - CONTINUARÁ EN SIGUIENTE PARTE */}
            <div className="col-span-1 space-y-6">
              {selectedMessage && (
                <>
                  {/* Message Editor */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <i className="fas fa-edit text-purple-600"></i>
                      Editar Mensaje #{selectedMessage.step_order}
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Esperar
                          </label>
                          <input
                            type="number"
                            value={selectedMessage.delay_amount}
                            onChange={(e) => updateMessage(selectedMessageIndex, {
                              delay_amount: parseInt(e.target.value),
                            })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Unidad
                          </label>
                          <select
                            value={selectedMessage.delay_unit}
                            onChange={(e) => updateMessage(selectedMessageIndex, {
                              delay_unit: e.target.value as DelayUnit,
                            })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                          >
                            <option value="minutes">Minutos</option>
                            <option value="hours">Horas</option>
                            <option value="days">Días</option>
                          </select>
                        </div>
                      </div>

                      {/* Tipo de mensaje */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de mensaje
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => updateMessage(selectedMessageIndex, { message_type: 'fixed' })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedMessage.message_type === 'fixed'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <i className="fas fa-file-alt text-lg mb-1"></i>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Fijo</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMessage(selectedMessageIndex, { message_type: 'ai_generated' })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedMessage.message_type === 'ai_generated'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <i className="fas fa-robot text-lg mb-1"></i>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">IA</p>
                          </button>
                        </div>
                      </div>

                      {/* Editor según tipo */}
                      {selectedMessage.message_type === 'fixed' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mensaje
                          </label>
                          <textarea
                            value={selectedMessage.message_template}
                            onChange={(e) => updateMessage(selectedMessageIndex, {
                              message_template: e.target.value,
                            })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                            rows={5}
                            placeholder="Escribe el mensaje aquí. Usa {nombre}, {producto}, {precio}, {empresa}, etc."
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Variables: {'{nombre}'}, {'{producto}'}, {'{precio}'}, {'{empresa}'}, {'{fecha}'}, {'{hora}'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Instrucciones para la IA
                          </label>
                          <textarea
                            value={selectedMessage.ai_context_instructions || ''}
                            onChange={(e) => updateMessage(selectedMessageIndex, {
                              ai_context_instructions: e.target.value,
                            })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                            rows={5}
                            placeholder="Ej: Genera un mensaje amigable recordando al cliente sobre su cotización, menciona el producto y ofrece ayuda."
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <i className="fas fa-magic text-purple-500"></i> La IA usará el contexto de la conversación para generar un mensaje personalizado
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <i className="fas fa-eye text-green-600"></i>
                        Vista Previa
                      </h3>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-sm text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200"
                      >
                        {showPreview ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>

                    {showPreview && (
                      <div className="space-y-3">
                        {/* WhatsApp-style preview */}
                        <div className="bg-[#e5ddd5] dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex justify-end mb-2">
                            <div className="max-w-[80%] bg-[#dcf8c6] dark:bg-green-700 rounded-lg p-3 shadow-sm">
                              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                {renderMessagePreview(selectedMessage)}
                              </p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                  {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <i className="fas fa-check-double text-blue-600 dark:text-blue-400 text-xs"></i>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Example context */}
                        {selectedMessage.message_type === 'fixed' && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700 transition-colors">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Contexto de ejemplo:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">Nombre:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">Juan</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">Producto:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">Plan Premium</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">Precio:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">$99</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">Empresa:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{businessName || 'Mi Empresa'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tip */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <i className="fas fa-lightbulb"></i>
                      Consejo
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {selectedMessage.message_type === 'fixed'
                        ? 'Los mensajes se enviarán automáticamente según el timing configurado. Si el cliente responde, la secuencia se detendrá.'
                        : 'La IA generará un mensaje único para cada contacto basándose en el contexto de su conversación y tus instrucciones.'
                      }
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-end gap-3 transition-colors">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(editedSequence)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors shadow-lg"
          >
            <i className="fas fa-save"></i>
            Guardar Secuencia
          </button>
        </div>
      </div>
    </div>
  );
}
