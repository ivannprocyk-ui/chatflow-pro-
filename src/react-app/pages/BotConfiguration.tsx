import { useState, useEffect } from 'react';
import { Bot, Smartphone, FileText, MessageCircle, Settings2 } from 'lucide-react';
import { botConfigAPI } from '@/react-app/services/api';
import FollowUps from './FollowUps';

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

export default function BotConfiguration() {
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

  const [qrCode, setQRCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // Load config on mount
  useEffect(() => {
    loadBotConfig();
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent flex items-center">
                <i className="fas fa-robot text-purple-600 dark:text-purple-400 mr-3"></i>
                Bot IA
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Configura tu asistente virtual inteligente con IA
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  config.connectionStatus === 'connected' ? 'bg-green-500' :
                  config.connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-400 dark:bg-gray-600'
                }`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {config.connectionStatus === 'connected' ? 'Conectado' :
                   config.connectionStatus === 'connecting' ? 'Conectando...' :
                   'Desconectado'}
                </span>
              </div>
              <button
                onClick={toggleBot}
                className={`px-6 py-2 rounded-lg font-medium transition-all shadow-lg ${
                  config.botEnabled
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                }`}
              >
                {config.botEnabled ? '✅ Bot Activo' : '⏸️ Bot Inactivo'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg shadow ${
            statusMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' :
            statusMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800' :
            'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'config'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Settings2 size={18} />
                Configuración
              </button>
              <button
                onClick={() => setActiveTab('connection')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'connection'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Smartphone size={18} />
                Conexión WhatsApp
              </button>
              <button
                onClick={() => setActiveTab('prompt')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'prompt'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FileText size={18} />
                Prompt Personalizado
              </button>
              <button
                onClick={() => setActiveTab('followups')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'followups'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <MessageCircle size={18} />
                Seguimientos
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Configuration Tab */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                {/* Agent Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Agente
                  </label>
                  <select
                    value={config.agentType}
                    onChange={(e) => handleInputChange('agentType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="vendedor">🛍️ Vendedor - Para ventas y promociones</option>
                    <option value="asistente">👥 Asistente - Atención al cliente general</option>
                    <option value="secretaria">📅 Secretaria - Agendar citas y organizar</option>
                    <option value="custom">✏️ Personalizado - Usa tu propio prompt</option>
                  </select>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    value={config.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Mi Empresa SA"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* Business Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción del Negocio *
                  </label>
                  <textarea
                    value={config.businessDescription}
                    onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                    placeholder="Somos una empresa dedicada a..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Productos/Servicios
                  </label>
                  <textarea
                    value={config.products}
                    onChange={(e) => handleInputChange('products', e.target.value)}
                    placeholder="Producto A ($100), Producto B ($200)..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* Business Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horario de Atención
                  </label>
                  <input
                    type="text"
                    value={config.businessHours}
                    onChange={(e) => handleInputChange('businessHours', e.target.value)}
                    placeholder="Lunes a Viernes 9:00 - 18:00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* Language & Tone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Idioma
                    </label>
                    <select
                      value={config.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="es">🇪🇸 Español</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="pt">🇧🇷 Português</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tono
                    </label>
                    <select
                      value={config.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ChatWoot Account ID
                    </label>
                    <input
                      type="text"
                      value={config.chatwootAccountId || ''}
                      onChange={(e) => handleInputChange('chatwootAccountId', e.target.value)}
                      placeholder="12345"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ChatWoot Inbox ID
                    </label>
                    <input
                      type="text"
                      value={config.chatwootInboxId || ''}
                      onChange={(e) => handleInputChange('chatwootInboxId', e.target.value)}
                      placeholder="67890"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveConfiguration}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-medium py-3 rounded-lg transition-all shadow-lg disabled:opacity-50"
                >
                  {isSaving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
                </button>
              </div>
            )}

            {/* Connection Tab */}
            {activeTab === 'connection' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">ℹ️ Conexión a WhatsApp</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    Conecta tu número de WhatsApp usando Evolution API. Escanea el código QR
                    con tu WhatsApp para vincular tu cuenta.
                  </p>
                </div>

                {/* Evolution API Config */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evolution API URL *
                  </label>
                  <input
                    type="text"
                    value={config.evolutionApiUrl || ''}
                    onChange={(e) => handleInputChange('evolutionApiUrl', e.target.value)}
                    placeholder="https://your-evolution-api.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evolution API Key *
                  </label>
                  <input
                    type="password"
                    value={config.evolutionApiKey || ''}
                    onChange={(e) => handleInputChange('evolutionApiKey', e.target.value)}
                    placeholder="your-api-key"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instance Name (Opcional)
                  </label>
                  <input
                    type="text"
                    value={config.evolutionInstanceName || ''}
                    onChange={(e) => handleInputChange('evolutionInstanceName', e.target.value)}
                    placeholder="mi-bot-instance"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* Connection Status */}
                {config.connectionStatus === 'disconnected' && (
                  <button
                    onClick={connectWhatsApp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 rounded-lg transition-all shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? '⏳ Conectando...' : '📱 Conectar WhatsApp'}
                  </button>
                )}

                {config.connectionStatus === 'connecting' && qrCode && (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Escanea este código QR con WhatsApp</h3>
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 border-4 border-purple-500 rounded-lg" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                      Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo
                    </p>
                  </div>
                )}

                {config.connectionStatus === 'connected' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-medium text-green-900 dark:text-green-300 mb-2">
                      WhatsApp Conectado
                    </h3>
                    <p className="text-green-700 dark:text-green-400 mb-4">
                      Tu bot está listo para recibir y responder mensajes
                    </p>
                    <button
                      onClick={disconnectWhatsApp}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-lg disabled:opacity-50"
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">⚠️ Solo para Agente Personalizado</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    Si seleccionaste "Personalizado" como tipo de agente, puedes escribir tu propio prompt aquí.
                    Variables disponibles: {'{{company_name}}'}, {'{{company_info}}'}, {'{{products_list}}'}, {'{{business_hours}}'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt Personalizado
                  </label>
                  <textarea
                    value={config.customPrompt || ''}
                    onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                    placeholder={`Eres un asistente virtual de {{company_name}}. Tu trabajo es ayudar a los clientes con información sobre nuestros productos y servicios.\n\nInformación de la empresa: {{company_info}}\n\nProductos: {{products_list}}\n\nHorario: {{business_hours}}`}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={config.agentType !== 'custom'}
                  />
                  {config.agentType !== 'custom' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Para usar un prompt personalizado, cambia el tipo de agente a "Personalizado"
                    </p>
                  )}
                </div>

                <button
                  onClick={saveConfiguration}
                  disabled={isSaving || config.agentType !== 'custom'}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-medium py-3 rounded-lg transition-all shadow-lg disabled:opacity-50"
                >
                  {isSaving ? '⏳ Guardando...' : '💾 Guardar Prompt'}
                </button>
              </div>
            )}

            {/* Follow-ups Tab */}
            {activeTab === 'followups' && (
              <div className="-m-6">
                <FollowUps />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
