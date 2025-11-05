import { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import type { WhatsAppTemplate, ContactList } from '@/shared/types';

interface BulkMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkMessaging({ isOpen, onClose }: BulkMessagingProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedContactList, setSelectedContactList] = useState<string>('');
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [inputMethod, setInputMethod] = useState<'list' | 'manual'>('list');
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchContactLists();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch('/api/whatsapp/templates');
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data);
      } else {
        throw new Error(data.error || 'Error al cargar plantillas');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Error al cargar las plantillas de WhatsApp. Verifica tu configuración de API.');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchContactLists = async () => {
    try {
      const response = await fetch('/api/contact-lists');
      const data = await response.json();
      setContactLists(data);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    }
  };

  const getSelectedTemplateDetails = () => {
    const template = templates.find(t => t.name === selectedTemplate);
    if (!template) return null;

    const components = JSON.parse(template.components);
    const bodyComponent = components.find((c: any) => c.type === 'BODY');
    const headerComponent = components.find((c: any) => c.type === 'HEADER');
    
    return {
      ...template,
      parsedComponents: components,
      bodyText: bodyComponent?.text || '',
      hasImageHeader: headerComponent?.format === 'IMAGE'
    };
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

    try {
      setLoading(true);
      
      const payload: any = {
        template_name: selectedTemplate,
        delay_seconds: delaySeconds,
      };

      if (imageUrl.trim()) {
        payload.image_url = imageUrl;
      }

      if (inputMethod === 'list') {
        payload.contact_list_id = parseInt(selectedContactList);
      } else {
        const numbers = phoneNumbers
          .split('\n')
          .map(n => n.trim())
          .filter(n => n.length > 0);
        payload.phone_numbers = numbers;
      }

      const response = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setCampaign(result);
        alert(`✅ Campaña completada!\n\n📊 Estadísticas:\n• Total: ${result.total_contacts}\n• Enviados: ${result.sent_count}\n• Errores: ${result.failed_count}`);
      } else {
        throw new Error(result.error || 'Error al enviar mensajes');
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      alert('Error al enviar los mensajes: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const templateDetails = getSelectedTemplateDetails();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                📱 Envío Masivo WhatsApp
              </Dialog.Title>
              <p className="text-gray-600 mt-1">
                Envía plantillas aprobadas a múltiples contactos
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Template Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">1️⃣ Selecciona tu Plantilla</h3>
              
              {templatesLoading ? (
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-blue-700">Cargando plantillas desde WhatsApp...</span>
                </div>
              ) : (
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
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}