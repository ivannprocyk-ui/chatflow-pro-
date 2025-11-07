import { useState, useEffect } from 'react';
import { loadConfig, saveConfig, AppConfig } from '@/react-app/utils/storage';

interface ConfigurationProps {
  onConfigUpdate: (config: AppConfig) => void;
}

export default function Configuration({ onConfigUpdate }: ConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'branding' | 'advanced'>('api');
  const [config, setConfig] = useState(loadConfig());
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved === 'true';
  });

  const handleConfigChange = (section: keyof AppConfig, field: string, value: string) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    };
    setConfig(newConfig);
  };

  const saveConfiguration = () => {
    setIsSaving(true);
    try {
      saveConfig(config);
      onConfigUpdate(config);
      alert('Configuración guardada correctamente');
    } catch (error) {
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('dark_mode', newDarkMode.toString());

    // Dispatch event to App.tsx
    window.dispatchEvent(new CustomEvent('theme-change', {
      detail: { darkMode: newDarkMode }
    }));
  };

  const testApiConnection = async () => {
    setApiStatus('testing');
    
    if (!config.api.accessToken || !config.api.wabaId) {
      setApiStatus('error');
      alert('Por favor completa los campos de Access Token y WABA ID');
      return;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${config.api.wabaId}/message_templates?access_token=${config.api.accessToken}`
      );
      
      if (response.ok) {
        setApiStatus('success');
        alert('Conexión exitosa con la API de Meta');
      } else {
        setApiStatus('error');
        alert('Error al conectar con la API. Verifica tus credenciales.');
      }
    } catch (error) {
      setApiStatus('error');
      alert('Error de conexión. Verifica tu conexión a internet.');
    }
  };

  const resetToDefaults = () => {
    if (confirm('¿Estás seguro de que quieres restaurar los valores por defecto?')) {
      const defaultConfig = loadConfig();
      setConfig({
        ...defaultConfig,
        api: config.api, // Keep API settings
        branding: {
          appName: 'ChatFlow Pro',
          logoUrl: '',
          primaryColor: '#25D366',
          secondaryColor: '#128C7E',
          accentColor: '#8B5CF6'
        }
      });
    }
  };

  const exportData = () => {
    const dataToExport = {
      config,
      contactLists: JSON.parse(localStorage.getItem('chatflow_contact_lists') || '[]'),
      crmData: JSON.parse(localStorage.getItem('chatflow_crm_data') || '[]'),
      campaigns: JSON.parse(localStorage.getItem('chatflow_campaigns') || '[]'),
      scheduledMessages: JSON.parse(localStorage.getItem('chatflow_scheduled_messages') || '[]')
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('chatflow_contact_lists');
      localStorage.removeItem('chatflow_crm_data');
      localStorage.removeItem('chatflow_campaigns');
      localStorage.removeItem('chatflow_scheduled_messages');
      alert('Todos los datos han sido eliminados');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">Configura tu plataforma WhatsApp Business y personalización</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[
          { id: 'api', label: 'API de Meta', icon: 'fas fa-plug' },
          { id: 'branding', label: 'Personalización', icon: 'fas fa-palette' },
          { id: 'advanced', label: 'Avanzado', icon: 'fas fa-cogs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Configuración API de Meta</h3>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                apiStatus === 'success' ? 'bg-green-100 text-green-800' :
                apiStatus === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'success' ? 'bg-green-500' :
                  apiStatus === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}></div>
                <span>
                  {apiStatus === 'success' ? 'Conectado' :
                   apiStatus === 'error' ? 'Error' :
                   'No Configurado'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={config.api.phoneNumberId}
                  onChange={(e) => handleConfigChange('api', 'phoneNumberId', e.target.value)}
                  placeholder="Ejemplo: 1234567890123456"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WABA ID
                </label>
                <input
                  type="text"
                  value={config.api.wabaId}
                  onChange={(e) => handleConfigChange('api', 'wabaId', e.target.value)}
                  placeholder="Ejemplo: 1234567890123456"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={config.api.accessToken}
                  onChange={(e) => handleConfigChange('api', 'accessToken', e.target.value)}
                  placeholder="Tu token de acceso de Meta"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Versión de API
                </label>
                <select
                  value={config.api.apiVersion}
                  onChange={(e) => handleConfigChange('api', 'apiVersion', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="v21.0">v21.0 (Recomendado)</option>
                  <option value="v20.0">v20.0</option>
                  <option value="v19.0">v19.0</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={saveConfiguration}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
              <button
                onClick={testApiConnection}
                disabled={apiStatus === 'testing'}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all"
              >
                {apiStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Personalización de Marca</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Aplicación
                </label>
                <input
                  type="text"
                  value={config.branding.appName}
                  onChange={(e) => handleConfigChange('branding', 'appName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Logo
                </label>
                <input
                  type="url"
                  value={config.branding.logoUrl}
                  onChange={(e) => handleConfigChange('branding', 'logoUrl', e.target.value)}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Theme Display */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">🎨 Tema de Color Actual</h4>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg"></div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg"></div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"></div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Profesional Moderno</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Azul corporativo, púrpura innovador, acentos cyan y esmeralda</p>
                  </div>
                  <div className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                    <i className="fas fa-check mr-2"></i>
                    Activo
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <i className="fas fa-palette mr-1"></i>
                Tema optimizado para profesionales con paleta de colores cuidadosamente seleccionada
              </p>
            </div>

            {/* Dark Mode Toggle */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center">
                    🌙 Modo Oscuro
                    {darkMode && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full font-medium">
                        ✓ Activo
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reduce el brillo de la pantalla para usar en ambientes con poca luz</p>
                </div>
                <div className="relative inline-block w-14 h-8 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                    className="sr-only peer"
                    id="dark-mode-toggle"
                  />
                  <label
                    htmlFor="dark-mode-toggle"
                    className="block w-14 h-8 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors cursor-pointer"
                  ></label>
                  <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6 pointer-events-none flex items-center justify-center text-xs shadow-lg">
                    {darkMode ? '🌙' : '☀️'}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                <i className="fas fa-lightbulb"></i>
                <span>El modo oscuro se aplica instantáneamente en toda la aplicación</span>
              </div>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Vista Previa</h4>
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                {config.branding.logoUrl ? (
                  <img src={config.branding.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover ring-2 ring-white" />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    <i className="fas fa-comments"></i>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-blue-600">
                    {config.branding.appName}
                  </h3>
                  <p className="text-purple-700 text-sm">WhatsApp Business Platform</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={saveConfiguration}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isSaving ? 'Guardando...' : 'Guardar Personalización'}
              </button>
              <button
                onClick={resetToDefaults}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all"
              >
                Restaurar por Defecto
              </button>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Configuración Avanzada</h3>

            {/* Data Management */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Gestión de Datos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={exportData}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <i className="fas fa-download text-blue-500 text-2xl mb-2"></i>
                  <p className="font-medium">Exportar Datos</p>
                  <p className="text-sm text-gray-600">Descargar backup completo</p>
                </button>

                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <i className="fas fa-upload text-green-500 text-2xl mb-2"></i>
                  <p className="font-medium">Importar Datos</p>
                  <p className="text-sm text-gray-600">Restaurar desde backup</p>
                </button>

                <button
                  onClick={clearAllData}
                  className="p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-center"
                >
                  <i className="fas fa-trash text-red-500 text-2xl mb-2"></i>
                  <p className="font-medium text-red-600">Limpiar Datos</p>
                  <p className="text-sm text-gray-600">Eliminar todos los datos</p>
                </button>
              </div>
            </div>

            {/* Backup Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Configuración de Backup</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia de Backup Automático
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="never">Nunca</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Notificaciones</h4>
              <div className="space-y-3">
                {[
                  { id: 'email_campaigns', label: 'Campañas completadas por email' },
                  { id: 'browser_notifications', label: 'Notificaciones del navegador' },
                  { id: 'api_errors', label: 'Errores de API' },
                  { id: 'quota_alerts', label: 'Alertas de cuota' }
                ].map((notification) => (
                  <label key={notification.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{notification.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
