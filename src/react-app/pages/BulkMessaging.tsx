import { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { loadContactLists, loadSendLog, appendToSendLog, loadConfig, loadCRMData } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: any[];
}

interface ContactList {
  id: string;
  name: string;
  description?: string;
  contacts: any[];
}

export default function BulkMessaging() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedContactList, setSelectedContactList] = useState<string>('');
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [inputMethod, setInputMethod] = useState<'list' | 'manual' | 'crm'>('list');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const config = loadConfig();
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load cached templates from Meta API
    const cached = localStorage.getItem('chatflow_cached_templates');
    if (cached) {
      try {
        setTemplates(JSON.parse(cached));
      } catch (error) {
        console.error('Error parsing cached templates:', error);
      }
    }

    // Load contact lists
    const storedLists = loadContactLists();
    setContactLists(storedLists);

    // Load CRM contacts
    const crmData = loadCRMData();
    setCrmContacts(crmData);

    // Check if there's a pre-selected template
    const preSelected = localStorage.getItem('selected_template');
    if (preSelected) {
      setSelectedTemplate(preSelected);
      localStorage.removeItem('selected_template');
      showInfo(`Plantilla "${preSelected}" cargada. Selecciona contactos para enviar.`);
    }

    // Check if there's a pre-selected contact list
    const preSelectedList = localStorage.getItem('selected_contact_list');
    if (preSelectedList) {
      setSelectedContactList(preSelectedList);
      setInputMethod('list');
      localStorage.removeItem('selected_contact_list');
      const list = storedLists.find(l => l.id === preSelectedList);
      if (list) {
        showInfo(`Lista "${list.name}" cargada con ${list.contacts?.length || 0} contactos.`);
      }
    }
  };

  const getSelectedTemplateDetails = () => {
    const template = templates.find(t => t.name === selectedTemplate);
    if (!template) return null;

    const components = template.components;
    const bodyComponent = components.find((c: any) => c.type === 'BODY');
    const headerComponent = components.find((c: any) => c.type === 'HEADER');

    return {
      ...template,
      parsedComponents: components,
      bodyText: bodyComponent?.text || '',
      hasImageHeader: headerComponent?.format === 'IMAGE'
    };
  };

  const getContactsToSend = () => {
    if (inputMethod === 'list') {
      const list = contactLists.find(l => l.id === selectedContactList);
      return list?.contacts || [];
    } else if (inputMethod === 'crm') {
      return crmContacts;
    } else {
      return phoneNumbers.split('\n').filter(n => n.trim()).map(phone => ({ phone_number: phone.trim() }));
    }
  };

  const validateForm = () => {
    if (!config.api.accessToken || !config.api.phoneNumberId) {
      showError('Configura tu API de Meta en Configuración primero');
      return false;
    }

    if (!selectedTemplate) {
      showError('Por favor selecciona una plantilla');
      return false;
    }

    const contacts = getContactsToSend();
    if (contacts.length === 0) {
      showError('No hay contactos para enviar');
      return false;
    }

    const templateDetails = getSelectedTemplateDetails();
    if (templateDetails?.hasImageHeader && !imageUrl.trim()) {
      showError('Esta plantilla requiere una URL de imagen');
      return false;
    }

    if (imageUrl.trim() && !imageUrl.startsWith('https://')) {
      showError('La URL de la imagen debe usar HTTPS');
      return false;
    }

    return true;
  };

  const startBulkSend = async () => {
    if (!validateForm()) return;

    setLoading(true);
    showInfo('Iniciando envío masivo...');

    const contacts = getContactsToSend();
    const templateDetails = getSelectedTemplateDetails();

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const phoneNumber = contact.phone_number || contact.phone;

        if (!phoneNumber) {
          failedCount++;
          continue;
        }

        try {
          // Build message body
          const messageBody: any = {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
              name: selectedTemplate,
              language: {
                code: templateDetails?.language || 'es'
              }
            }
          };

          // Add header component with image if needed
          if (templateDetails?.hasImageHeader && imageUrl) {
            messageBody.template.components = [
              {
                type: 'header',
                parameters: [
                  {
                    type: 'image',
                    image: {
                      link: imageUrl
                    }
                  }
                ]
              }
            ];
          }

          // Send message via Meta API
          const response = await fetch(`https://graph.facebook.com/${config.api.apiVersion}/${config.api.phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.api.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageBody)
          });

          if (response.ok) {
            sentCount++;
          } else {
            failedCount++;
            const errorData = await response.json();
            errors.push(`${phoneNumber}: ${errorData.error?.message || 'Error desconocido'}`);
          }

          // Delay between messages
          if (i < contacts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
          }

        } catch (error: any) {
          failedCount++;
          errors.push(`${phoneNumber}: ${error.message}`);
        }
      }

      const result = {
        total_contacts: contacts.length,
        sent_count: sentCount,
        failed_count: failedCount,
        template_name: selectedTemplate,
        completed_at: new Date().toISOString(),
        errors: errors.slice(0, 5) // Only save first 5 errors
      };

      // Save to log
      appendToSendLog({
        ...result,
        method: inputMethod,
        created_at: new Date().toISOString()
      });

      setCampaign(result);

      if (failedCount === 0) {
        showSuccess(`✅ Campaña completada! ${sentCount} mensajes enviados`);
      } else if (sentCount > 0) {
        showInfo(`⚠️ Campaña completada con errores: ${sentCount} enviados, ${failedCount} fallidos`);
      } else {
        showError(`❌ Error: Todos los envíos fallaron`);
      }

    } catch (error: any) {
      showError(`Error en envío masivo: ${error.message}`);
    } finally {
      setLoading(false);
    }
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

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setInputMethod('list')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                inputMethod === 'list'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              📋 Lista de Contactos
            </button>
            <button
              onClick={() => setInputMethod('crm')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                inputMethod === 'crm'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              👥 Contactos CRM ({crmContacts.length})
            </button>
            <button
              onClick={() => setInputMethod('manual')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                inputMethod === 'manual'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              ✍️ Ingresar Manual
            </button>
          </div>

          {inputMethod === 'list' && (
            <>
              <select
                value={selectedContactList}
                onChange={(e) => setSelectedContactList(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              >
                <option value="">-- Selecciona una lista de contactos --</option>
                {contactLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.contacts?.length || 0} contactos)
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
          )}

          {inputMethod === 'crm' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Contactos del CRM seleccionados</h4>
              </div>
              <p className="text-blue-700 text-sm">
                Se enviarán mensajes a {crmContacts.length} contactos del CRM.
              </p>
              {crmContacts.length === 0 && (
                <p className="text-yellow-700 text-sm mt-2">
                  ⚠️ No hay contactos en el CRM. Ve a "Panel CRM" para agregar contactos.
                </p>
              )}
            </div>
          )}

          {inputMethod === 'manual' && (
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
