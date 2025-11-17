import React from 'react';
import { MessageSquare, Clock, Calendar, Eye, Plus, Trash2, Save, X } from 'lucide-react';

type TriggerType = 'keyword' | 'variable' | 'conversation_state' | 'bot_stage' | 'time_based' | 'action' | 'no_response' | 'specific_intent' | 'customer_left' | 'price_requested' | 'info_sent' | 'cart_abandoned';
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
}

export default function FollowUpSequenceEditor({ sequence, onSave, onCancel, businessName }: Props) {
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
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-6 flex items-center justify-between">
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
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Información Básica</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Secuencia *
                    </label>
                    <input
                      type="text"
                      value={editedSequence.name}
                      onChange={(e) => updateSequence({ name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: Cotización no contestada"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={editedSequence.description}
                      onChange={(e) => updateSequence({ description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={2}
                      placeholder="Describe cuándo se activa esta secuencia..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Trigger *
                    </label>
                    <select
                      value={editedSequence.trigger_type}
                      onChange={(e) => updateSequence({ trigger_type: e.target.value as TriggerType })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {getTriggerOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estrategia *
                    </label>
                    <select
                      value={editedSequence.strategy}
                      onChange={(e) => updateSequence({ strategy: e.target.value as Strategy })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="passive">Pasivo - 3 mensajes, intervalos largos</option>
                      <option value="moderate">Moderado - 4 mensajes, intervalos medios</option>
                      <option value="aggressive">Agresivo - 5 mensajes, intervalos cortos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Schedule Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Horarios de Envío</h3>

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
                    <label htmlFor="business_hours" className="text-sm font-medium text-gray-700">
                      Solo enviar en horario laboral
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de la semana
                    </label>
                    {renderWeekdaySelector()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">📨 Secuencia de Mensajes</h3>
                  <button
                    onClick={addMessage}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Plus size={16} />
                    Agregar
                  </button>
                </div>

                <div className="space-y-3">
                  {editedSequence.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMessageIndex === index
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                      onClick={() => setSelectedMessageIndex(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                              {msg.step_order}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock size={14} />
                              <span>
                                {msg.delay_amount} {
                                  msg.delay_unit === 'minutes' ? 'min' :
                                  msg.delay_unit === 'hours' ? 'hrs' : 'días'
                                }
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {msg.message_template || '(Sin mensaje)'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMessage(index);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Message Editor & Preview */}
            <div className="space-y-6">
              {selectedMessage && (
                <>
                  {/* Message Editor */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      ✏️ Editar Mensaje #{selectedMessage.step_order}
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Esperar
                          </label>
                          <input
                            type="number"
                            value={selectedMessage.delay_amount}
                            onChange={(e) => updateMessage(selectedMessageIndex, {
                              delay_amount: parseInt(e.target.value),
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unidad
                          </label>
                          <select
                            value={selectedMessage.delay_unit}
                            onChange={(e) => updateMessage(selectedMessageIndex, {
                              delay_unit: e.target.value as DelayUnit,
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="minutes">Minutos</option>
                            <option value="hours">Horas</option>
                            <option value="days">Días</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mensaje
                        </label>
                        <textarea
                          value={selectedMessage.message_template}
                          onChange={(e) => updateMessage(selectedMessageIndex, {
                            message_template: e.target.value,
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          rows={5}
                          placeholder="Escribe el mensaje aquí. Usa {nombre}, {producto}, {precio}, {empresa}, etc."
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Variables disponibles: {'{nombre}'}, {'{producto}'}, {'{precio}'}, {'{empresa}'}, {'{fecha}'}, {'{hora}'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Eye size={20} className="text-green-600" />
                        Vista Previa
                      </h3>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-sm text-green-700 hover:text-green-900"
                      >
                        {showPreview ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>

                    {showPreview && (
                      <div className="space-y-3">
                        {/* WhatsApp-style preview */}
                        <div className="bg-[#e5ddd5] p-4 rounded-lg">
                          <div className="flex justify-end mb-2">
                            <div className="max-w-[80%] bg-[#dcf8c6] rounded-lg p-3 shadow-sm">
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {renderMessagePreview(selectedMessage)}
                              </p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs text-gray-600">
                                  {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 16 15" fill="currentColor">
                                  <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Example context */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Contexto de ejemplo:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-600">Nombre:</span>
                              <span className="ml-2 text-gray-900">Juan</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Producto:</span>
                              <span className="ml-2 text-gray-900">Plan Premium</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Precio:</span>
                              <span className="ml-2 text-gray-900">$99</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Empresa:</span>
                              <span className="ml-2 text-gray-900">{businessName || 'Mi Empresa'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tip */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Consejo</h4>
                    <p className="text-sm text-blue-800">
                      Los mensajes se enviarán automáticamente según el timing configurado.
                      Si el cliente responde antes, la secuencia se detendrá automáticamente.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(editedSequence)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors shadow-lg"
          >
            <Save size={18} />
            Guardar Secuencia
          </button>
        </div>
      </div>
    </div>
  );
}
