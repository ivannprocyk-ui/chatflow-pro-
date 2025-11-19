import React, { useState, useEffect } from 'react';
import { organizationsAPI, aiAPI } from '@/react-app/services/api';

export default function AISettings() {
  // Mock organization for now - will be replaced with real auth context
  const organization = { id: 'org-1', name: 'Demo Organization' };
  const [config, setConfig] = useState({
    aiEnabled: true,
    aiRole: 'asistente',
    aiCompanyInfo: '',
    aiProductsInfo: '',
    aiObjective: '',
    aiBusinessHoursOnly: false,
  });
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await organizationsAPI.getMe();
      const org = response.data;
      setConfig({
        aiEnabled: org.aiEnabled,
        aiRole: org.aiRole || 'asistente',
        aiCompanyInfo: org.aiCompanyInfo || '',
        aiProductsInfo: org.aiProductsInfo || '',
        aiObjective: org.aiObjective || '',
        aiBusinessHoursOnly: org.aiBusinessHoursOnly || false,
      });
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await organizationsAPI.update(config);
      setSuccess('✅ Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) {
      setError('Escribe un mensaje de prueba');
      return;
    }

    setIsTesting(true);
    setError('');
    setTestResponse('');

    try {
      const response = await aiAPI.test({ message: testMessage });
      setTestResponse(response.data.response);
    } catch (err: any) {
      setError(err.message || 'Error al probar el asistente');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          ⚙️ Configuración del Asistente IA
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configura cómo responderá tu asistente virtual de WhatsApp
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Main Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.aiEnabled}
            onChange={(e) => setConfig({ ...config, aiEnabled: e.target.checked })}
            className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-white">
            🤖 Activar respuestas automáticas con IA
          </span>
        </label>
      </div>

      {config.aiEnabled && (
        <>
          {/* Role Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
              🎭 Rol del Asistente
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'vendedor', label: 'Vendedor', icon: '💼', desc: 'Proactivo, cierra ventas' },
                { value: 'asistente', label: 'Asistente', icon: '🤝', desc: 'Amable, informativo' },
                { value: 'soporte', label: 'Soporte', icon: '🛟', desc: 'Resuelve problemas' },
                { value: 'agendador', label: 'Agendador', icon: '📅', desc: 'Programa citas' },
              ].map((role) => (
                <label
                  key={role.value}
                  className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                    config.aiRole === role.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={config.aiRole === role.value}
                    onChange={(e) => setConfig({ ...config, aiRole: e.target.value as any })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-3xl mb-2">{role.icon}</div>
                    <div className="font-semibold text-gray-800 dark:text-white">{role.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{role.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
              🏢 Información de tu Empresa
            </h3>
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Describe tu empresa brevemente (2-3 líneas)&#10;Ej: Pizzería familiar desde 1980. Vendemos pizzas artesanales con ingredientes frescos y de calidad."
              value={config.aiCompanyInfo}
              onChange={(e) => setConfig({ ...config, aiCompanyInfo: e.target.value })}
            />
          </div>

          {/* Products/Services */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
              📦 Productos y Servicios
            </h3>
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={6}
              placeholder="Lista tus productos con precios&#10;Ej:&#10;• Pizza Margarita - $150&#10;• Pizza Pepperoni - $180&#10;• Pizza Hawaiana - $170&#10;• Bebidas - $30"
              value={config.aiProductsInfo}
              onChange={(e) => setConfig({ ...config, aiProductsInfo: e.target.value })}
            />
          </div>

          {/* Objective */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
              🎯 Objetivo del Asistente
            </h3>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Tomar pedidos y dar información sobre productos"
              value={config.aiObjective}
              onChange={(e) => setConfig({ ...config, aiObjective: e.target.value })}
            />
          </div>

          {/* Business Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
              ⏰ Horarios de Respuesta
            </h3>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.aiBusinessHoursOnly}
                onChange={(e) => setConfig({ ...config, aiBusinessHoursOnly: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-300">
                Solo responder en horario laboral (Lun-Vie 9am-6pm)
              </span>
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Fuera de horario, el bot indicará que te contactarás pronto
            </p>
          </div>

          {/* Test Bot */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 mb-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
              🧪 Probar Asistente IA
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Envía un mensaje de prueba para ver cómo respondería el bot
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={2}
              placeholder="Ej: Hola, tienen pizzas disponibles?"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isTesting ? 'Probando...' : 'Probar Respuesta'}
            </button>

            {testResponse && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Respuesta del bot:</p>
                <p className="text-gray-800 dark:text-white whitespace-pre-wrap">{testResponse}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition shadow-lg disabled:opacity-50"
      >
        {isSaving ? '💾 Guardando...' : '💾 Guardar Configuración'}
      </button>
    </div>
  );
}
