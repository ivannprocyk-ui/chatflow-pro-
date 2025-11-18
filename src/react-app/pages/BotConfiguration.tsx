import { useState, useEffect } from 'react';
import { botConfigAPI, followUpsAPI } from '@/react-app/services/api';
import FollowUpSequenceEditor from '@/react-app/components/FollowUpSequenceEditor';

interface BotConfig {
  id?: string;
  connectionType: 'evolution_api' | 'meta_api';
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  evolutionApiUrl?: string;
  evolutionInstanceName?: string;
  evolutionApiKey?: string;
  chatwootInboxId?: string;
  chatwootAccountId?: string;
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom';
  businessName: string;
  businessDescription: string;
  products: string;
  businessHours: string;
  language: 'es' | 'en' | 'pt';
  tone: 'formal' | 'casual' | 'professional';
  customPrompt?: string;
  flowiseUrl?: string;
  flowiseApiKey?: string;
  botEnabled: boolean;
}

type TriggerType = 'keyword' | 'variable' | 'conversation_state' | 'bot_stage' | 'time_based' | 'action' | 'no_response' | 'specific_intent' | 'customer_left' | 'price_requested' | 'info_sent' | 'cart_abandoned';
type Strategy = 'passive' | 'moderate' | 'aggressive';
type DelayUnit = 'minutes' | 'hours' | 'days';

interface FollowUpMessage {
  id?: string;
  step_order: number;
  delay_amount: number;
  delay_unit: DelayUnit;
  message_template: string;
  message_type?: 'fixed' | 'ai_generated';
  ai_context_instructions?: string;
  image_url?: string;
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

interface BotConfigurationProps {
  darkMode?: boolean;
}

export default function BotConfiguration({ darkMode = false }: BotConfigurationProps = {}) {
  const [activeTab, setActiveTab] = useState<'config' | 'connection' | 'prompt' | 'followups'>('config');
  const [config, setConfig] = useState<BotConfig>({
    connectionType: 'evolution_api',
    connectionStatus: 'disconnected',
    agentType: 'asistente',
    businessName: '',
    businessDescription: '',
    products: '',
    businessHours: 'Lunes a Viernes 9:00 - 18:00',
    language: 'es',
    tone: 'casual',
    botEnabled: false,
  });

  // Follow-ups state
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [editingSequence, setEditingSequence] = useState<FollowUpSequence | null>(null);

  const [qrCode, setQRCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // Load config and sequences on mount
  useEffect(() => {
    loadBotConfig();
    loadSequences();
    const interval = setInterval(checkConnectionStatus, 5000); // Check status every 5s
    return () => clearInterval(interval);
  }, []);

  const loadBotConfig = async () => {
    try {
      setIsLoading(true);
      const response = await botConfigAPI.get();
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        showMessage('error', 'Error al cargar la configuración');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (config.connectionType === 'evolution_api' && config.evolutionApiUrl) {
      try {
        const response = await botConfigAPI.getStatus();
        if (response.data.state === 'open') {
          setConfig(prev => ({ ...prev, connectionStatus: 'connected' }));
        }
      } catch (error) {
        // Ignore errors in background status check
      }
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleInputChange = (field: keyof BotConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      await botConfigAPI.upsert(config);
      showMessage('success', '✅ Configuración guardada correctamente');
      await loadBotConfig();
    } catch (error: any) {
      showMessage('error', `❌ Error: ${error.response?.data?.message || 'No se pudo guardar'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const connectWhatsApp = async () => {
    if (!config.evolutionApiUrl || !config.evolutionApiKey) {
      showMessage('error', 'Por favor configura Evolution API URL y API Key primero');
      return;
    }

    try {
      setIsLoading(true);
      setConfig(prev => ({ ...prev, connectionStatus: 'connecting' }));
      showMessage('info', '🔄 Conectando a WhatsApp...');

      // Create instance
      await botConfigAPI.connectInstance({
        apiUrl: config.evolutionApiUrl,
        instanceName: config.evolutionInstanceName || `bot-${Date.now()}`,
        apiKey: config.evolutionApiKey,
      });

      // Get QR code
      const qrResponse = await botConfigAPI.getQRCode();
      if (qrResponse.data.qrcode) {
        setQRCode(qrResponse.data.qrcode);
        showMessage('success', '📱 Escanea el código QR con WhatsApp');
      }
    } catch (error: any) {
      showMessage('error', `❌ Error: ${error.response?.data?.message || 'No se pudo conectar'}`);
      setConfig(prev => ({ ...prev, connectionStatus: 'disconnected' }));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      setIsLoading(true);
      await botConfigAPI.disconnect();
      setConfig(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      setQRCode('');
      showMessage('success', '✅ WhatsApp desconectado');
    } catch (error: any) {
      showMessage('error', `❌ Error: ${error.response?.data?.message || 'No se pudo desconectar'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBot = async () => {
    try {
      await botConfigAPI.toggleBot();
      setConfig(prev => ({ ...prev, botEnabled: !prev.botEnabled }));
      showMessage('success', `🤖 Bot ${!config.botEnabled ? 'activado' : 'desactivado'}`);
    } catch (error: any) {
      showMessage('error', `❌ Error: ${error.response?.data?.message || 'No se pudo cambiar estado'}`);
    }
  };

  // =====================================================
  // FOLLOW-UPS FUNCTIONS
  // =====================================================

  const loadSequences = async () => {
    try {
      const data = await followUpsAPI.getAllSequences();
      setSequences(data || []);
    } catch (error) {
      console.error('Error loading sequences:', error);
    }
  };

  const createNewSequence = () => {
    const newSequence: FollowUpSequence = {
      name: '',
      description: '',
      enabled: true,
      trigger_type: 'no_response',
      trigger_config: { no_response_minutes: 30 },
      strategy: 'moderate',
      conditions: {
        business_hours_only: false,
        days_of_week: [1, 2, 3, 4, 5], // Lunes a Viernes
        hours_start: '09:00',
        hours_end: '18:00',
        max_follow_ups_per_contact: 3,
      },
      messages: [
        {
          step_order: 1,
          delay_amount: 30,
          delay_unit: 'minutes',
          message_template: '',
          message_type: 'fixed',
          available_variables: ['nombre', 'producto', 'precio', 'empresa'],
        },
      ],
    };
    setEditingSequence(newSequence);
  };

  const saveSequence = async (sequence: FollowUpSequence) => {
    try {
      if (sequence.id) {
        await followUpsAPI.updateSequence(sequence.id, sequence);
        showMessage('success', '✅ Secuencia actualizada');
      } else {
        await followUpsAPI.createSequence(sequence);
        showMessage('success', '✅ Secuencia creada');
      }
      await loadSequences();
      setEditingSequence(null);
    } catch (error: any) {
      showMessage('error', `❌ Error: ${error.message || 'No se pudo guardar'}`);
    }
  };

  const deleteSequence = async (id: string) => {
    if (!window.confirm('¿Eliminar esta secuencia?')) return;

    try {
      await followUpsAPI.deleteSequence(id);
      await loadSequences();
      showMessage('success', '✅ Secuencia eliminada');
    } catch (error: any) {
      showMessage('error', `❌ Error: ${error.message || 'No se pudo eliminar'}`);
    }
  };

  const toggleSequenceEnabled = async (sequence: FollowUpSequence) => {
    try {
      await followUpsAPI.updateSequence(sequence.id!, {
        ...sequence,
        enabled: !sequence.enabled,
      });
      await loadSequences();
      showMessage('success', `✅ Secuencia ${!sequence.enabled ? 'activada' : 'pausada'}`);
    } catch (error: any) {
      showMessage('error', `❌ Error: ${error.message || 'No se pudo cambiar estado'}`);
    }
  };

  const getStrategyInfo = (strategy: Strategy) => {
    const info = {
      passive: {
        label: 'Pasivo',
        color: 'bg-green-100 text-green-800',
      },
      moderate: {
        label: 'Moderado',
        color: 'bg-yellow-100 text-yellow-800',
      },
      aggressive: {
        label: 'Agresivo',
        color: 'bg-red-100 text-red-800',
      },
    };
    return info[strategy];
  };

  return (
    <div className={`min-h-screen p-6 transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-purple-50 to-blue-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                <i className="fas fa-robot text-purple-600"></i>
                Configuración del Bot IA
              </h1>
              <p className={`mt-2 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Configura tu asistente virtual inteligente con IA y seguimientos automáticos
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  config.connectionStatus === 'connected' ? 'bg-green-500' :
                  config.connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-400'
                }`} />
                <span className={`text-sm transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {config.connectionStatus === 'connected' ? 'Conectado' :
                   config.connectionStatus === 'connecting' ? 'Conectando...' :
                   'Desconectado'}
                </span>
              </div>
              <button
                onClick={toggleBot}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  config.botEnabled
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
{config.botEnabled ? (
                  <>
                    <i className="fas fa-check-circle mr-2"></i>
                    Bot Activo
                  </>
                ) : (
                  <>
                    <i className="fas fa-pause-circle mr-2"></i>
                    Bot Inactivo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            statusMessage.type === 'success' ? 'bg-green-100 text-green-800' :
            statusMessage.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div className={`rounded-xl shadow-lg mb-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`border-b transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'config'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fas fa-cog"></i> Configuración
              </button>
              <button
                onClick={() => setActiveTab('connection')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'connection'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fas fa-mobile-alt"></i> Conexión WhatsApp
              </button>
              <button
                onClick={() => setActiveTab('prompt')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'prompt'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fas fa-comment-dots"></i> Prompt Personalizado
              </button>
              <button
                onClick={() => {
                  setActiveTab('followups');
                  if (sequences.length === 0) loadSequences();
                }}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'followups'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fas fa-sync-alt"></i> Seguimientos Automáticos
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Configuration Tab */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                {/* Agent Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Agente
                  </label>
                  <select
                    value={config.agentType}
                    onChange={(e) => handleInputChange('agentType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="vendedor">💼 Vendedor - Para ventas y promociones</option>
                    <option value="asistente">🎧 Asistente - Atención al cliente general</option>
                    <option value="secretaria">📋 Secretaria - Agendar citas y organizar</option>
                    <option value="custom">✍️ Personalizado - Usa tu propio prompt</option>
                  </select>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    value={config.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Mi Empresa SA"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Business Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Negocio *
                  </label>
                  <textarea
                    value={config.businessDescription}
                    onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                    placeholder="Somos una empresa dedicada a..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Productos/Servicios
                  </label>
                  <textarea
                    value={config.products}
                    onChange={(e) => handleInputChange('products', e.target.value)}
                    placeholder="Producto A ($100), Producto B ($200)..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Business Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horario de Atención
                  </label>
                  <input
                    type="text"
                    value={config.businessHours}
                    onChange={(e) => handleInputChange('businessHours', e.target.value)}
                    placeholder="Lunes a Viernes 9:00 - 18:00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Language & Tone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={config.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="es">🇪🇸 Español</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="pt">🇧🇷 Português</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tono
                    </label>
                    <select
                      value={config.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="formal">👔 Formal</option>
                      <option value="casual">😊 Casual</option>
                      <option value="professional">💼 Profesional</option>
                    </select>
                  </div>
                </div>

                {/* ChatWoot Integration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ChatWoot Account ID
                    </label>
                    <input
                      type="text"
                      value={config.chatwootAccountId || ''}
                      onChange={(e) => handleInputChange('chatwootAccountId', e.target.value)}
                      placeholder="12345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ChatWoot Inbox ID
                    </label>
                    <input
                      type="text"
                      value={config.chatwootInboxId || ''}
                      onChange={(e) => handleInputChange('chatwootInboxId', e.target.value)}
                      placeholder="67890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveConfiguration}
                  disabled={isSaving}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
                </button>
              </div>
            )}

            {/* Connection Tab */}
            {activeTab === 'connection' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">ℹ️ Conexión a WhatsApp</h3>
                  <p className="text-sm text-blue-800">
                    Conecta tu número de WhatsApp usando Evolution API. Escanea el código QR
                    con tu WhatsApp para vincular tu cuenta.
                  </p>
                </div>

                {/* Evolution API Config */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evolution API URL *
                  </label>
                  <input
                    type="text"
                    value={config.evolutionApiUrl || ''}
                    onChange={(e) => handleInputChange('evolutionApiUrl', e.target.value)}
                    placeholder="https://your-evolution-api.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evolution API Key *
                  </label>
                  <input
                    type="password"
                    value={config.evolutionApiKey || ''}
                    onChange={(e) => handleInputChange('evolutionApiKey', e.target.value)}
                    placeholder="your-api-key"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instance Name (Opcional)
                  </label>
                  <input
                    type="text"
                    value={config.evolutionInstanceName || ''}
                    onChange={(e) => handleInputChange('evolutionInstanceName', e.target.value)}
                    placeholder="mi-bot-instance"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Connection Status */}
                {config.connectionStatus === 'disconnected' && (
                  <button
                    onClick={connectWhatsApp}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '⏳ Conectando...' : '📱 Conectar WhatsApp'}
                  </button>
                )}

                {config.connectionStatus === 'connecting' && qrCode && (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Escanea este código QR con WhatsApp</h3>
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 border-4 border-purple-500 rounded-lg" />
                    <p className="text-sm text-gray-600 mt-4">
                      Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo
                    </p>
                  </div>
                )}

                {config.connectionStatus === 'connected' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-medium text-green-900 mb-2">
                      WhatsApp Conectado
                    </h3>
                    <p className="text-green-700 mb-4">
                      Tu bot está listo para recibir y responder mensajes
                    </p>
                    <button
                      onClick={disconnectWhatsApp}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '⏳ Desconectando...' : '🔌 Desconectar'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Prompt Tab */}
            {activeTab === 'prompt' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-yellow-900 mb-2">⚠️ Solo para Agente Personalizado</h3>
                  <p className="text-sm text-yellow-800">
                    Si seleccionaste "Personalizado" como tipo de agente, puedes escribir tu propio prompt aquí.
                    Variables disponibles: {'{{company_name}}'}, {'{{company_info}}'}, {'{{products_list}}'}, {'{{business_hours}}'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Personalizado
                  </label>
                  <textarea
                    value={config.customPrompt || ''}
                    onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                    placeholder={`Eres un asistente virtual de {{company_name}}. Tu trabajo es ayudar a los clientes con información sobre nuestros productos y servicios.\n\nInformación de la empresa: {{company_info}}\n\nProductos: {{products_list}}\n\nHorario: {{business_hours}}`}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    disabled={config.agentType !== 'custom'}
                  />
                  {config.agentType !== 'custom' && (
                    <p className="text-sm text-gray-500 mt-2">
                      Para usar un prompt personalizado, cambia el tipo de agente a "Personalizado"
                    </p>
                  )}
                </div>

                <button
                  onClick={saveConfiguration}
                  disabled={isSaving || config.agentType !== 'custom'}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? '⏳ Guardando...' : '💾 Guardar Prompt'}
                </button>
              </div>
            )}

            {/* Follow-ups Tab */}
            {activeTab === 'followups' && (
              <div className="h-[calc(100vh-300px)]">
                {sequences.length === 0 && !editingSequence ? (
                  <div className={`rounded-lg p-12 text-center border-2 border-dashed transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-600 border-purple-500' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300'}`}>
                    <i className={`fas fa-comments text-6xl mb-4 transition-colors ${darkMode ? 'text-purple-300' : 'text-purple-400'}`}></i>
                    <h3 className={`text-xl font-semibold mb-2 transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      No hay secuencias creadas
                    </h3>
                    <p className={`mb-6 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Crea tu primera secuencia de seguimiento para recuperar clientes automáticamente
                    </p>
                    <button
                      onClick={createNewSequence}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <i className="fas fa-plus"></i>
                      Crear Primera Secuencia
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-4 h-full">
                    {/* Panel Izquierdo - Lista de Secuencias */}
                    <div className={`col-span-3 rounded-lg p-4 overflow-y-auto transition-colors ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-semibold transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          <i className="fas fa-list mr-2 text-purple-600"></i>
                          Secuencias
                        </h3>
                        <button
                          onClick={createNewSequence}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Nueva Secuencia"
                        >
                          <i className="fas fa-plus text-sm"></i>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {sequences.map((seq) => (
                          <button
                            key={seq.id}
                            onClick={() => setEditingSequence(seq)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              editingSequence?.id === seq.id
                                ? darkMode
                                  ? 'bg-purple-900/40 border-2 border-purple-500'
                                  : 'bg-purple-50 border-2 border-purple-500'
                                : darkMode
                                  ? 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-medium text-sm transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {seq.name}
                              </span>
                              {seq.enabled ? (
                                <i className="fas fa-check-circle text-green-500 text-xs"></i>
                              ) : (
                                <i className="fas fa-pause-circle text-gray-400 text-xs"></i>
                              )}
                            </div>
                            <p className={`text-xs line-clamp-2 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {seq.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <span className={`transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                <i className="fas fa-comments mr-1"></i>
                                {seq.messages?.length || 0}
                              </span>
                              <span className={`transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                <i className="fas fa-chart-line mr-1"></i>
                                {seq.total_executions || 0}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Panel Central - Configuración y Timeline */}
                    <div className={`col-span-5 rounded-lg p-4 overflow-y-auto transition-colors ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      {editingSequence ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-semibold text-lg transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <i className="fas fa-cog mr-2 text-purple-600"></i>
                              Configuración
                            </h3>
                            <button
                              onClick={() => saveSequence(editingSequence)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                            >
                              <i className="fas fa-save mr-2"></i>
                              Guardar
                            </button>
                          </div>

                          {/* Configuración básica */}
                          <div className="space-y-3">
                            <div>
                              <label className={`block text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Nombre
                              </label>
                              <input
                                type="text"
                                value={editingSequence.name}
                                onChange={(e) => setEditingSequence({ ...editingSequence, name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                                  darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                } border focus:ring-2 focus:ring-purple-500`}
                                placeholder="Nombre de la secuencia"
                              />
                            </div>

                            <div>
                              <label className={`block text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Descripción
                              </label>
                              <textarea
                                value={editingSequence.description}
                                onChange={(e) => setEditingSequence({ ...editingSequence, description: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                                  darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                } border focus:ring-2 focus:ring-purple-500`}
                                rows={2}
                                placeholder="Descripción breve"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="enabled"
                                checked={editingSequence.enabled}
                                onChange={(e) => setEditingSequence({ ...editingSequence, enabled: e.target.checked })}
                                className="rounded"
                              />
                              <label htmlFor="enabled" className={`text-sm transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Secuencia activa
                              </label>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="mt-6">
                            <h4 className={`font-semibold mb-3 flex items-center gap-2 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <i className="fas fa-stream text-purple-600"></i>
                              Timeline de Mensajes
                            </h4>

                            <div className="space-y-3">
                              {editingSequence.messages?.map((msg, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setEditingSequence({ ...editingSequence, __selectedMessageIndex: idx })}
                                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                                    (editingSequence as any).__selectedMessageIndex === idx
                                      ? darkMode
                                        ? 'bg-purple-900/40 border-2 border-purple-500'
                                        : 'bg-purple-50 border-2 border-purple-500'
                                      : darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        darkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white'
                                      }`}>
                                        {msg.step_order}
                                      </div>
                                      <span className={`text-sm font-medium transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Mensaje #{msg.step_order}
                                      </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded transition-colors ${
                                      msg.message_type === 'ai_generated'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {msg.message_type === 'ai_generated' ? 'IA' : 'Fijo'}
                                    </span>
                                  </div>
                                  <p className={`text-xs mb-2 line-clamp-2 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {msg.message_type === 'ai_generated'
                                      ? `IA: ${msg.ai_context_instructions || 'Sin instrucciones'}`
                                      : msg.message_template || 'Sin mensaje'
                                    }
                                  </p>
                                  <div className={`text-xs transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    <i className="fas fa-clock mr-1"></i>
                                    Esperar {msg.delay_amount} {msg.delay_unit === 'minutes' ? 'min' : msg.delay_unit === 'hours' ? 'hrs' : 'días'}
                                  </div>
                                </div>
                              ))}

                              <button
                                onClick={() => {
                                  const newMsg: FollowUpMessage = {
                                    step_order: (editingSequence.messages?.length || 0) + 1,
                                    delay_amount: 60,
                                    delay_unit: 'minutes',
                                    message_template: '',
                                    message_type: 'fixed',
                                    available_variables: ['nombre', 'producto', 'precio', 'empresa'],
                                  };
                                  setEditingSequence({
                                    ...editingSequence,
                                    messages: [...(editingSequence.messages || []), newMsg],
                                    __selectedMessageIndex: editingSequence.messages?.length || 0,
                                  });
                                }}
                                className={`w-full p-3 rounded-lg border-2 border-dashed transition-colors ${
                                  darkMode
                                    ? 'border-gray-600 hover:border-purple-500 hover:bg-gray-700 text-gray-400'
                                    : 'border-gray-300 hover:border-purple-500 hover:bg-gray-50 text-gray-600'
                                }`}
                              >
                                <i className="fas fa-plus mr-2"></i>
                                Agregar Mensaje
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center h-full transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <div className="text-center">
                            <i className="fas fa-arrow-left text-4xl mb-3"></i>
                            <p>Selecciona una secuencia de la izquierda</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Panel Derecho - Editor de Mensaje y Preview */}
                    <div className={`col-span-4 rounded-lg p-4 overflow-y-auto transition-colors ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      {editingSequence && editingSequence.messages && (editingSequence as any).__selectedMessageIndex !== undefined ? (
                        <div className="space-y-4">
                          <h3 className={`font-semibold text-lg mb-4 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <i className="fas fa-edit mr-2 text-purple-600"></i>
                            Editar Mensaje
                          </h3>

                          {(() => {
                            const selectedIdx = (editingSequence as any).__selectedMessageIndex;
                            const selectedMsg = editingSequence.messages[selectedIdx];

                            if (!selectedMsg) return null;

                            return (
                              <div className="space-y-4">
                                {/* Delay */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Esperar
                                    </label>
                                    <input
                                      type="number"
                                      value={selectedMsg.delay_amount}
                                      onChange={(e) => {
                                        const newMessages = [...editingSequence.messages];
                                        newMessages[selectedIdx] = { ...selectedMsg, delay_amount: parseInt(e.target.value) };
                                        setEditingSequence({ ...editingSequence, messages: newMessages });
                                      }}
                                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                                        darkMode
                                          ? 'bg-gray-700 border-gray-600 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      } border focus:ring-2 focus:ring-purple-500`}
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Unidad
                                    </label>
                                    <select
                                      value={selectedMsg.delay_unit}
                                      onChange={(e) => {
                                        const newMessages = [...editingSequence.messages];
                                        newMessages[selectedIdx] = { ...selectedMsg, delay_unit: e.target.value as DelayUnit };
                                        setEditingSequence({ ...editingSequence, messages: newMessages });
                                      }}
                                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                                        darkMode
                                          ? 'bg-gray-700 border-gray-600 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      } border focus:ring-2 focus:ring-purple-500`}
                                    >
                                      <option value="minutes">Minutos</option>
                                      <option value="hours">Horas</option>
                                      <option value="days">Días</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Tipo de mensaje */}
                                <div>
                                  <label className={`block text-sm font-medium mb-2 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Tipo de mensaje
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() => {
                                        const newMessages = [...editingSequence.messages];
                                        newMessages[selectedIdx] = { ...selectedMsg, message_type: 'fixed' };
                                        setEditingSequence({ ...editingSequence, messages: newMessages });
                                      }}
                                      className={`p-3 rounded-lg border-2 transition-all ${
                                        selectedMsg.message_type === 'fixed'
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                          : darkMode
                                            ? 'border-gray-600 bg-gray-700'
                                            : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      <i className="fas fa-file-alt text-lg mb-1"></i>
                                      <p className={`text-xs font-semibold transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fijo</p>
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newMessages = [...editingSequence.messages];
                                        newMessages[selectedIdx] = { ...selectedMsg, message_type: 'ai_generated' };
                                        setEditingSequence({ ...editingSequence, messages: newMessages });
                                      }}
                                      className={`p-3 rounded-lg border-2 transition-all ${
                                        selectedMsg.message_type === 'ai_generated'
                                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                          : darkMode
                                            ? 'border-gray-600 bg-gray-700'
                                            : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      <i className="fas fa-robot text-lg mb-1"></i>
                                      <p className={`text-xs font-semibold transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>IA</p>
                                    </button>
                                  </div>
                                </div>

                                {/* Editor según tipo */}
                                {selectedMsg.message_type === 'fixed' ? (
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Mensaje
                                    </label>
                                    <textarea
                                      value={selectedMsg.message_template}
                                      onChange={(e) => {
                                        const newMessages = [...editingSequence.messages];
                                        newMessages[selectedIdx] = { ...selectedMsg, message_template: e.target.value };
                                        setEditingSequence({ ...editingSequence, messages: newMessages });
                                      }}
                                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                                        darkMode
                                          ? 'bg-gray-700 border-gray-600 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      } border focus:ring-2 focus:ring-purple-500`}
                                      rows={5}
                                      placeholder="Escribe tu mensaje aquí. Usa {nombre}, {producto}, etc."
                                    />
                                    <p className={`text-xs mt-1 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                      Variables: {'{nombre}'}, {'{producto}'}, {'{precio}'}, {'{empresa}'}
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <label className={`block text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Instrucciones para la IA
                                    </label>
                                    <textarea
                                      value={selectedMsg.ai_context_instructions || ''}
                                      onChange={(e) => {
                                        const newMessages = [...editingSequence.messages];
                                        newMessages[selectedIdx] = { ...selectedMsg, ai_context_instructions: e.target.value };
                                        setEditingSequence({ ...editingSequence, messages: newMessages });
                                      }}
                                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                                        darkMode
                                          ? 'bg-gray-700 border-gray-600 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      } border focus:ring-2 focus:ring-purple-500`}
                                      rows={5}
                                      placeholder="Ej: Genera un mensaje amigable recordando al cliente sobre su cotización"
                                    />
                                    <p className={`text-xs mt-1 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                      <i className="fas fa-magic text-purple-500"></i> La IA generará el mensaje basándose en el contexto
                                    </p>
                                  </div>
                                )}

                                {/* Imagen opcional */}
                                <div>
                                  <label className={`block text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <i className="fas fa-image mr-1 text-purple-600"></i>
                                    Imagen (opcional)
                                  </label>
                                  <input
                                    type="url"
                                    value={selectedMsg.image_url || ''}
                                    onChange={(e) => {
                                      const newMessages = [...editingSequence.messages];
                                      newMessages[selectedIdx] = { ...selectedMsg, image_url: e.target.value };
                                      setEditingSequence({ ...editingSequence, messages: newMessages });
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                                      darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                    } border focus:ring-2 focus:ring-purple-500`}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                  />
                                </div>

                                {/* Botón eliminar */}
                                <button
                                  onClick={() => {
                                    if (editingSequence.messages.length > 1) {
                                      const newMessages = editingSequence.messages.filter((_, i) => i !== selectedIdx);
                                      newMessages.forEach((msg, i) => { msg.step_order = i + 1; });
                                      setEditingSequence({
                                        ...editingSequence,
                                        messages: newMessages,
                                        __selectedMessageIndex: Math.max(0, selectedIdx - 1),
                                      });
                                    }
                                  }}
                                  disabled={editingSequence.messages.length <= 1}
                                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                                    editingSequence.messages.length <= 1
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-red-600 hover:bg-red-700 text-white'
                                  }`}
                                >
                                  <i className="fas fa-trash mr-2"></i>
                                  Eliminar Mensaje
                                </button>

                                {/* Preview */}
                                <div className={`mt-6 p-4 rounded-lg transition-colors ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                                  <h4 className={`font-semibold mb-3 flex items-center gap-2 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <i className="fas fa-eye text-green-600"></i>
                                    Vista Previa
                                  </h4>
                                  <div className={`p-3 rounded-lg transition-colors ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                    <p className={`text-sm whitespace-pre-wrap transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {selectedMsg.message_type === 'ai_generated'
                                        ? `[Mensaje generado por IA]\n\n${selectedMsg.ai_context_instructions || 'Sin instrucciones'}`
                                        : selectedMsg.message_template || '(Mensaje vacío)'
                                      }
                                    </p>
                                    {selectedMsg.image_url && (
                                      <div className="mt-3">
                                        <img
                                          src={selectedMsg.image_url}
                                          alt="Preview"
                                          className="rounded-lg max-h-40 object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center h-full transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <div className="text-center">
                            <i className="fas fa-mouse-pointer text-4xl mb-3"></i>
                            <p>Selecciona un mensaje del timeline</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
