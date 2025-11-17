import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, Zap, Settings, Send, Users, TrendingUp } from 'lucide-react';
import { useToast } from '../components/Toast';

interface FollowUpConfig {
  enabled: boolean;
  waitTimeMinutes: number;
  maxFollowUps: number;
  messageType: 'template' | 'ai_generated';
  templateMessage: string;
  aiPrompt?: string;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDaysOnly: boolean;
}

interface Variable {
  name: string;
  label: string;
  example: string;
}

const AVAILABLE_VARIABLES: Variable[] = [
  { name: '{nombre}', label: 'Nombre del contacto', example: 'Juan' },
  { name: '{negocio}', label: 'Nombre del negocio', example: 'Mi Empresa' },
  { name: '{producto}', label: 'Producto mencionado', example: 'Pizza Margarita' },
  { name: '{hora}', label: 'Hora actual', example: '14:30' },
  { name: '{fecha}', label: 'Fecha actual', example: '17/11/2025' },
];

const FollowUps: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<FollowUpConfig>({
    enabled: false,
    waitTimeMinutes: 60,
    maxFollowUps: 3,
    messageType: 'template',
    templateMessage: '',
    businessHoursOnly: false,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    businessDaysOnly: false,
  });

  const [activeTab, setActiveTab] = useState<'config' | 'message' | 'preview'>('config');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Load configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('chatflow_token');

      const response = await fetch('http://localhost:3001/follow-ups/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar configuración');

      const data = await response.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
      // showInfo('Usando configuración por defecto');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('chatflow_token');

      const response = await fetch('http://localhost:3001/follow-ups/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Error al guardar configuración');

      showSuccess('✅ Configuración guardada correctamente');
      await loadConfig();
    } catch (error: any) {
      showError(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async () => {
    try {
      const token = localStorage.getItem('chatflow_token');

      const response = await fetch('http://localhost:3001/follow-ups/config/toggle', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cambiar estado');

      showSuccess(config.enabled ? '⏸️ Follow-ups desactivados' : '▶️ Follow-ups activados');
      await loadConfig();
    } catch (error: any) {
      showError(`Error: ${error.message}`);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = config.templateMessage;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setConfig({ ...config, templateMessage: newText });

    // Set cursor position after variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const getPreviewMessage = () => {
    let message = config.templateMessage;
    AVAILABLE_VARIABLES.forEach(v => {
      message = message.replace(new RegExp(v.name.replace(/[{}]/g, '\\$&'), 'g'), v.example);
    });
    return message;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <MessageSquare className="text-blue-600 dark:text-blue-400" size={36} />
              Seguimiento Automático
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Envía mensajes automáticos cuando tus clientes no responden
            </p>
          </div>

          {/* Toggle principal */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {config.enabled ? 'Activo' : 'Inactivo'}
            </span>
            <button
              onClick={toggleEnabled}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                config.enabled
                  ? 'bg-green-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                <p className={`text-lg font-bold ${config.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {config.enabled ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <Zap className={config.enabled ? 'text-green-600' : 'text-gray-400'} size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo de espera</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {config.waitTimeMinutes} min
                </p>
              </div>
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Max. seguimientos</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {config.maxFollowUps}
                </p>
              </div>
              <Send className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de mensaje</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {config.messageType === 'template' ? 'Fijo' : 'IA'}
                </p>
              </div>
              <MessageSquare className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'config'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Settings className="inline-block mr-2" size={18} />
              Configuración
            </button>
            <button
              onClick={() => setActiveTab('message')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'message'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <MessageSquare className="inline-block mr-2" size={18} />
              Mensaje
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <TrendingUp className="inline-block mr-2" size={18} />
              Vista Previa
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* CONFIGURACIÓN */}
          {activeTab === 'config' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ⚙️ Configuración General
                </h3>

                {/* Tiempo de espera */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ⏰ Tiempo de espera antes del seguimiento
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={config.waitTimeMinutes}
                      onChange={(e) => setConfig({ ...config, waitTimeMinutes: parseInt(e.target.value) || 60 })}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-600 dark:text-gray-400">minutos</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Si el cliente no responde en este tiempo, se enviará el mensaje de seguimiento
                  </p>
                </div>

                {/* Máximo de seguimientos */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🔄 Máximo de seguimientos por conversación
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxFollowUps}
                    onChange={(e) => setConfig({ ...config, maxFollowUps: parseInt(e.target.value) || 3 })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Número máximo de veces que se intentará contactar al cliente
                  </p>
                </div>

                {/* Tipo de mensaje */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    💬 Tipo de mensaje
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setConfig({ ...config, messageType: 'template' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        config.messageType === 'template'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-center">
                        <MessageSquare className="mx-auto mb-2 text-blue-600 dark:text-blue-400" size={24} />
                        <p className="font-medium text-gray-900 dark:text-white">Mensaje Fijo</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Siempre el mismo mensaje
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, messageType: 'ai_generated' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        config.messageType === 'ai_generated'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                      }`}
                    >
                      <div className="text-center">
                        <Zap className="mx-auto mb-2 text-purple-600 dark:text-purple-400" size={24} />
                        <p className="font-medium text-gray-900 dark:text-white">Generado con IA</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Se adapta al contexto
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Horarios */}
                <div className="mb-6 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">📅 Restricciones de horario</h4>

                  {/* Solo horario de negocio */}
                  <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={config.businessHoursOnly}
                      onChange={(e) => setConfig({ ...config, businessHoursOnly: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Solo en horario de negocio</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No enviar fuera del horario de atención
                      </p>
                    </div>
                  </label>

                  {config.businessHoursOnly && (
                    <div className="grid grid-cols-2 gap-4 ml-9">
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Desde</label>
                        <input
                          type="time"
                          value={config.businessHoursStart}
                          onChange={(e) => setConfig({ ...config, businessHoursStart: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
                        <input
                          type="time"
                          value={config.businessHoursEnd}
                          onChange={(e) => setConfig({ ...config, businessHoursEnd: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Solo días laborables */}
                  <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={config.businessDaysOnly}
                      onChange={(e) => setConfig({ ...config, businessDaysOnly: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Solo días laborables</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No enviar fines de semana (Lunes a Viernes)
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* MENSAJE */}
          {activeTab === 'message' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ✍️ Editor de Mensaje
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Escribe el mensaje que se enviará automáticamente. Puedes usar variables dinámicas.
                </p>

                {/* Variables disponibles */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Variables disponibles (haz clic para insertar):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VARIABLES.map((variable) => (
                      <button
                        key={variable.name}
                        onClick={() => insertVariable(variable.name)}
                        className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-mono flex items-center gap-2"
                        title={`${variable.label} - Ejemplo: ${variable.example}`}
                      >
                        <code>{variable.name}</code>
                        <span className="text-xs opacity-75">({variable.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={config.templateMessage}
                  onChange={(e) => setConfig({ ...config, templateMessage: e.target.value })}
                  placeholder="Ej: Hola {nombre}, vi que consultaste sobre {producto}. ¿Puedo ayudarte con algo más?"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                />

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {config.templateMessage.length} caracteres
                  </p>
                  {config.templateMessage && (
                    <button
                      onClick={() => setConfig({ ...config, templateMessage: '' })}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Limpiar mensaje
                    </button>
                  )}
                </div>

                {/* AI Prompt (si es AI generated) */}
                {config.messageType === 'ai_generated' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🤖 Instrucciones para la IA (opcional)
                    </label>
                    <textarea
                      value={config.aiPrompt || ''}
                      onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                      placeholder="Ej: Genera un mensaje amigable y breve para recordarle al cliente que estamos disponibles para ayudarlo..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Si está vacío, se usará el prompt por defecto del sistema
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA PREVIA */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  👁️ Vista Previa
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Así se verá el mensaje que recibirá el cliente
                </p>

                {/* WhatsApp-like preview */}
                <div className="max-w-md mx-auto">
                  <div className="bg-[#075E54] rounded-t-2xl p-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-medium">Tu Negocio</p>
                        <p className="text-xs opacity-75">en línea</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#E5DDD5] dark:bg-gray-700 p-4 min-h-[300px]"
                       style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23e5ddd5\'/%3E%3Cpath d=\'M0 0L50 50M50 0L100 50M0 50L50 100M50 50L100 100\' stroke=\'%23d1ccc1\' stroke-width=\'0.5\' opacity=\'.1\'/%3E%3C/svg%3E")' }}>
                    {config.templateMessage ? (
                      <div className="flex justify-end mb-4">
                        <div className="bg-white dark:bg-gray-600 rounded-lg p-3 max-w-[80%] shadow">
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {getPreviewMessage()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">
                          Escribe un mensaje en la pestaña "Mensaje" para ver la vista previa
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800 rounded-b-2xl p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock size={16} />
                      <span>Mensaje automático - Se enviará si el cliente no responde</span>
                    </div>
                  </div>
                </div>

                {/* Settings summary */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                    📋 Resumen de configuración:
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Se enviará después de <strong>{config.waitTimeMinutes} minutos</strong> sin respuesta</li>
                    <li>• Máximo <strong>{config.maxFollowUps} seguimientos</strong> por conversación</li>
                    <li>• Tipo: <strong>{config.messageType === 'template' ? 'Mensaje fijo' : 'Generado con IA'}</strong></li>
                    {config.businessHoursOnly && (
                      <li>• Solo entre <strong>{config.businessHoursStart} - {config.businessHoursEnd}</strong></li>
                    )}
                    {config.businessDaysOnly && (
                      <li>• Solo <strong>días laborables</strong> (Lun-Vie)</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Guardar */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Los cambios se guardarán y aplicarán inmediatamente
            </div>
            <button
              onClick={saveConfig}
              disabled={saving || !config.templateMessage}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} />
          ¿Cómo funciona el seguimiento automático?
        </h3>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p><strong>1.</strong> Un cliente te escribe por WhatsApp a través de ChatWoot</p>
          <p><strong>2.</strong> Tu bot responde automáticamente</p>
          <p><strong>3.</strong> Si el cliente NO responde en el tiempo configurado...</p>
          <p><strong>4.</strong> Se envía automáticamente este mensaje de seguimiento</p>
          <p><strong>5.</strong> Si sigue sin responder, se envía otro hasta llegar al máximo configurado</p>
          <p className="pt-2 border-t border-blue-200 dark:border-blue-700 mt-3">
            <strong>✨ Nota:</strong> El sistema respeta los horarios de negocio y días laborables que configures.
            Si el cliente responde en cualquier momento, el seguimiento se cancela automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FollowUps;
