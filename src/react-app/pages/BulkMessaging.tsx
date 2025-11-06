import { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { loadTemplates, loadContactLists, loadSendLog, appendToSendLog } from '@/react-app/utils/storage';

interface WhatsAppTemplate {
  id: number;
  name: string;
  language: string;
  status: string;
  category: string;
  components: string;
}

interface ContactList {
  id: number;
  name: string;
  description?: string;
  contact_count: number;
}

export default function BulkMessaging() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedContactList, setSelectedContactList] = useState<string>('');
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [inputMethod, setInputMethod] = useState<'list' | 'manual'>('list');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    // Load templates and contact lists from localStorage
    const storedTemplates = loadTemplates();
    const storedLists = loadContactLists();

    setTemplates(storedTemplates);
    setContactLists(storedLists.map((list: any) => ({
      id: parseInt(list.id),
      name: list.name,
      description: list.description,
      contact_count: list.contacts?.length || 0
    })));
  }, []);

  const getSelectedTemplateDetails = () => {
    const template = templates.find(t => t.name === selectedTemplate);
    if (!template) return null;

    try {
      const components = JSON.parse(template.components);
      const bodyComponent = components.find((c: any) => c.type === 'BODY');
      const headerComponent = components.find((c: any) => c.type === 'HEADER');

      return {
        ...template,
        parsedComponents: components,
        bodyText: bodyComponent?.text || '',
        hasImageHeader: headerComponent?.format === 'IMAGE'
      };
    } catch (error) {
      console.error('Error parsing template components:', error);
      return null;
    }
  };

  const validateForm = () => {
    if (!selectedTemplate) {
      alert('Por favor selecciona una plantilla');
      return false;
    }

    if (inputMethod === 'list' && !selectedContactList) {
      alert('Por favor selecciona una lista de contactos');
      return false;
    }

    if (inputMethod === 'manual' && !phoneNumbers.trim()) {
      alert('Por favor ingresa los números de teléfono');
      return false;
    }

    const templateDetails = getSelectedTemplateDetails();
    if (templateDetails?.hasImageHeader && !imageUrl.trim()) {
      alert('Esta plantilla requiere una URL de imagen');
      return false;
    }

    if (imageUrl.trim() && !imageUrl.startsWith('https://')) {
      alert('La URL de la imagen debe usar HTTPS');
      return false;
    }

    return true;
  };

  const startBulkSend = async () => {
    if (!validateForm()) return;

    setLoading(true);

    // Simulate bulk send with demo data
    setTimeout(() => {
      const numbers = inputMethod === 'manual'
        ? phoneNumbers.split('\n').filter(n => n.trim()).length
        : parseInt(selectedContactList) || 0;

      const result = {
        total_contacts: numbers,
        sent_count: numbers,
        failed_count: 0,
        template_name: selectedTemplate,
        completed_at: new Date().toISOString()
      };

      // Save to log
      appendToSendLog({
        ...result,
        method: inputMethod,
        created_at: new Date().toISOString()
      });

      setCampaign(result);
      setLoading(false);

      alert(`✅ Campaña completada!\n\n📊 Estadísticas:\n• Total: ${result.total_contacts}\n• Enviados: ${result.sent_count}\n• Errores: ${result.failed_count}`);
    }, 2000);
  };

  const templateDetails = getSelectedTemplateDetails();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📱 Envío Masivo WhatsApp</h1>
          <p className="text-gray-600">Envía plantillas aprobadas a múltiples contactos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
        {/* Template Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">1️⃣ Selecciona tu Plantilla</h3>

          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={loading}
          >
            <option value="">-- Selecciona una plantilla --</option>
            {templates.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name} ({template.language})
              </option>
            ))}
          </select>

          {templates.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                No hay plantillas disponibles. Ve a la sección "Plantillas" para cargar tus plantillas de WhatsApp.
              </p>
            </div>
          )}

          {/* Template Preview */}
          {templateDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Vista previa de la plantilla:</h4>
              <div className="bg-white p-3 rounded border-l-4 border-green-500 font-mono text-sm whitespace-pre-wrap">
                {templateDetails.bodyText}
              </div>

              {templateDetails.hasImageHeader && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    🖼️ URL de la imagen del header (requerida):
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    La imagen debe estar alojada en una URL pública accesible (HTTPS)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">2️⃣ Selecciona Contactos</h3>

          <div className="flex space-x-4">
            <button
              onClick={() => setInputMethod('list')}
              className={`flex-1 p-3 border-2 rounded-lg transition-colors ${
                inputMethod === 'list'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              📋 Lista de Contactos
            </button>
            <button
              onClick={() => setInputMethod('manual')}
              className={`flex-1 p-3 border-2 rounded-lg transition-colors ${
                inputMethod === 'manual'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              ✍️ Ingresar Manual
            </button>
          </div>

          {inputMethod === 'list' ? (
            <>
              <select
                value={selectedContactList}
                onChange={(e) => setSelectedContactList(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              >
                <option value="">-- Selecciona una lista de contactos --</option>
                {contactLists.map((list) => (
                  <option key={list.id} value={list.id.toString()}>
                    {list.name} ({list.contact_count} contactos)
                  </option>
                ))}
              </select>

              {contactLists.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    No hay listas de contactos. Ve a "Listas de Contactos" para crear una.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Formato importante:</p>
                    <p className="text-sm text-yellow-700">
                      Los números deben estar en formato internacional sin el símbolo +<br />
                      Ejemplo para Argentina: <code className="bg-yellow-100 px-1 rounded">5491123456789</code><br />
                      Ejemplo para México: <code className="bg-yellow-100 px-1 rounded">5215512345678</code>
                    </p>
                  </div>
                </div>
              </div>
              <textarea
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                placeholder="5491123456789&#10;5491198765432&#10;5491155554444"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-32 font-mono text-sm"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Send Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">3️⃣ Configuración de Envío</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retraso entre mensajes:
            </label>
            <select
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={loading}
            >
              <option value={1}>1 segundo (rápido)</option>
              <option value={2}>2 segundos (recomendado)</option>
              <option value={3}>3 segundos (seguro)</option>
              <option value={5}>5 segundos (muy seguro)</option>
            </select>
          </div>
        </div>

        {/* Campaign Results */}
        {campaign && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Campaña Completada</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{campaign.total_contacts}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{campaign.sent_count}</div>
                <div className="text-sm text-gray-600">Enviados</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">{campaign.failed_count}</div>
                <div className="text-sm text-gray-600">Errores</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              setSelectedTemplate('');
              setSelectedContactList('');
              setPhoneNumbers('');
              setImageUrl('');
              setCampaign(null);
            }}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Limpiar
          </button>
          <button
            onClick={startBulkSend}
            disabled={loading || !selectedTemplate}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>🚀 Iniciar Envío</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
