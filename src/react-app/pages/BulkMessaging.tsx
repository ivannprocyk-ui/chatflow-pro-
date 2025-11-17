import { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { loadContactLists, loadSendLog, appendToSendLog, loadConfig, loadCRMData, loadCRMConfig, addMessageToHistory } from '@/react-app/utils/storage';
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

  // CRM Selection Modal States
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [selectedCRMContacts, setSelectedCRMContacts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [manualSelectedContacts, setManualSelectedContacts] = useState<any[]>([]);

  const config = loadConfig();
  const crmConfig = loadCRMConfig();
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

  // Filter logic for CRM contacts
  const applyDynamicFilters = (contact: any): boolean => {
    for (const [fieldName, filterValue] of Object.entries(dynamicFilters)) {
      if (!filterValue) continue;

      const field = crmConfig.fields.find(f => f.name === fieldName);
      if (!field) continue;

      const contactValue = contact[fieldName];

      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
          if (!contactValue || !contactValue.toString().toLowerCase().includes(filterValue.toLowerCase())) {
            return false;
          }
          break;
        case 'select':
          if (contactValue !== filterValue) {
            return false;
          }
          break;
        case 'number':
        case 'currency':
          const numValue = parseFloat(contactValue);
          if (filterValue.min !== undefined && numValue < filterValue.min) return false;
          if (filterValue.max !== undefined && numValue > filterValue.max) return false;
          break;
        case 'date':
          const dateValue = new Date(contactValue);
          if (filterValue.from && dateValue < new Date(filterValue.from)) return false;
          if (filterValue.to && dateValue > new Date(filterValue.to)) return false;
          break;
      }
    }
    return true;
  };

  const getFilteredCRMContacts = () => {
    return crmContacts.filter(contact => {
      const matchesSearch = searchTerm === '' || crmConfig.fields.some(field => {
        const value = contact[field.name];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });

      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      const matchesDynamicFilters = applyDynamicFilters(contact);

      return matchesSearch && matchesStatus && matchesDynamicFilters;
    });
  };

  const handleSelectAllCRM = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(getFilteredCRMContacts().map(c => c.id));
      setSelectedCRMContacts(allIds);
    } else {
      setSelectedCRMContacts(new Set());
    }
  };

  const handleSelectCRMContact = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedCRMContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedCRMContacts(newSelected);
  };

  const handleConfirmCRMSelection = () => {
    const selected = crmContacts.filter(c => selectedCRMContacts.has(c.id));

    // Find phone and name fields
    const phoneField = crmConfig.fields.find(f =>
      f.type === 'tel' ||
      f.name.toLowerCase().includes('phone') ||
      f.name.toLowerCase().includes('telefono')
    );

    const nameField = crmConfig.fields.find(f =>
      f.name.toLowerCase().includes('nombre') ||
      f.name.toLowerCase().includes('name')
    );

    // Validate and transform
    const contactsWithoutPhone: string[] = [];
    const transformed = selected.map(contact => {
      const phoneNumber = phoneField ? contact[phoneField.name] : '';

      if (!phoneNumber || phoneNumber.trim() === '') {
        const identifier = nameField ? contact[nameField.name] : contact.id;
        contactsWithoutPhone.push(identifier || 'Sin nombre');
      }

      return {
        ...contact,
        phone_number: phoneNumber || '',
        first_name: nameField ? contact[nameField.name] : ''
      };
    }).filter(c => c.phone_number.trim() !== '');

    if (contactsWithoutPhone.length > 0) {
      showError(`⚠️ ${contactsWithoutPhone.length} contacto(s) sin teléfono excluidos`);
    }

    if (transformed.length === 0) {
      showError('Ningún contacto seleccionado tiene número de teléfono');
      return;
    }

    setManualSelectedContacts(transformed);
    setShowCRMModal(false);
    showSuccess(`✓ ${transformed.length} contacto(s) del CRM listos para envío`);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDynamicFilters({});
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || Object.keys(dynamicFilters).some(k => dynamicFilters[k]);

  const getContactsToSend = () => {
    if (inputMethod === 'list') {
      const list = contactLists.find(l => l.id === selectedContactList);
      return list?.contacts || [];
    } else if (inputMethod === 'crm') {
      return crmContacts;
    } else {
      // Manual: use selected CRM contacts if any, otherwise parse phone numbers
      if (manualSelectedContacts.length > 0) {
        return manualSelectedContacts;
      }
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

            // Save to message history
            const responseData = await response.json();
            addMessageToHistory({
              contactId: contact.id || `phone-${phoneNumber}`, // Use contact ID if available, otherwise use phone
              templateName: selectedTemplate,
              sentAt: new Date().toISOString(),
              status: 'sent',
              phoneNumber: phoneNumber,
              messageId: responseData.messages?.[0]?.id,
              campaignName: 'Envío Masivo',
              metadata: {
                method: inputMethod,
                imageUrl: imageUrl || undefined
              }
            });
          } else {
            failedCount++;
            const errorData = await response.json();
            errors.push(`${phoneNumber}: ${errorData.error?.message || 'Error desconocido'}`);

            // Save failed message to history
            addMessageToHistory({
              contactId: contact.id || `phone-${phoneNumber}`,
              templateName: selectedTemplate,
              sentAt: new Date().toISOString(),
              status: 'failed',
              phoneNumber: phoneNumber,
              errorMessage: errorData.error?.message || 'Error desconocido',
              campaignName: 'Envío Masivo',
              metadata: {
                method: inputMethod,
                imageUrl: imageUrl || undefined
              }
            });
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">📱 Envío Masivo WhatsApp</h1>
          <p className="text-gray-600 dark:text-gray-300">Envía plantillas aprobadas a múltiples contactos</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-8 transition-colors duration-300">
        {/* Template Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1️⃣ Selecciona tu Plantilla</h3>

          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
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
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 transition-colors duration-300">
              <p className="text-yellow-800 dark:text-yellow-200">
                No hay plantillas disponibles. Ve a la sección "Plantillas" para cargar tus plantillas de WhatsApp.
              </p>
            </div>
          )}

          {/* Template Preview */}
          {templateDetails && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 transition-colors duration-300">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Vista previa de la plantilla:</h4>
              <div className="bg-white dark:bg-gray-700 p-3 rounded border-l-4 border-green-500 font-mono text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {templateDetails.bodyText}
              </div>

              {templateDetails.hasImageHeader && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    🖼️ URL de la imagen del header (requerida):
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full p-3 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                    disabled={loading}
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    La imagen debe estar alojada en una URL pública accesible (HTTPS)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2️⃣ Selecciona Contactos</h3>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setInputMethod('list')}
              className={`p-3 border-2 rounded-lg transition-colors duration-300 ${
                inputMethod === 'list'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
              }`}
              disabled={loading}
            >
              📋 Lista de Contactos
            </button>
            <button
              onClick={() => setInputMethod('crm')}
              className={`p-3 border-2 rounded-lg transition-colors duration-300 ${
                inputMethod === 'crm'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
              }`}
              disabled={loading}
            >
              👥 Contactos CRM ({crmContacts.length})
            </button>
            <button
              onClick={() => setInputMethod('manual')}
              className={`p-3 border-2 rounded-lg transition-colors duration-300 ${
                inputMethod === 'manual'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
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
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 transition-colors duration-300">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    No hay listas de contactos. Ve a "Listas de Contactos" para crear una.
                  </p>
                </div>
              )}
            </>
          )}

          {inputMethod === 'crm' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 transition-colors duration-300">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Contactos del CRM seleccionados</h4>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Se enviarán mensajes a {crmContacts.length} contactos del CRM.
              </p>
              {crmContacts.length === 0 && (
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                  ⚠️ No hay contactos en el CRM. Ve a "Panel CRM" para agregar contactos.
                </p>
              )}
            </div>
          )}

          {inputMethod === 'manual' && (
            <div className="space-y-4">
              {/* CRM Selection Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCRMModal(true)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-users"></i>
                  <span>Seleccionar del CRM</span>
                </button>
                {manualSelectedContacts.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('¿Deseas eliminar la selección actual del CRM?')) {
                        setManualSelectedContacts([]);
                        setSelectedCRMContacts(new Set());
                        showInfo('Selección del CRM eliminada');
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center space-x-2"
                  >
                    <i className="fas fa-trash"></i>
                    <span>Limpiar</span>
                  </button>
                )}
              </div>

              {/* CRM Selection Info */}
              {manualSelectedContacts.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 transition-colors duration-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Contactos del CRM seleccionados</h4>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                    ✓ {manualSelectedContacts.length} contacto(s) con teléfono válido
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCRMModal(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                    >
                      Modificar selección
                    </button>
                  </div>
                </div>
              )}

              {/* Divider */}
              {manualSelectedContacts.length === 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-300">O ingresa manualmente</span>
                  </div>
                </div>
              )}

              {/* Manual Input */}
              <div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-3 transition-colors duration-300">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Formato importante:</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Los números deben estar en formato internacional sin el símbolo +<br />
                        Ejemplo para Argentina: <code className="bg-yellow-100 dark:bg-yellow-800/50 px-1 rounded">5491123456789</code><br />
                        Ejemplo para México: <code className="bg-yellow-100 dark:bg-yellow-800/50 px-1 rounded">5215512345678</code>
                      </p>
                    </div>
                  </div>
                </div>
                <textarea
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  placeholder="5491123456789&#10;5491198765432&#10;5491155554444"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 h-32 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  disabled={loading || manualSelectedContacts.length > 0}
                />
                {manualSelectedContacts.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Tienes contactos del CRM seleccionados. Elimina la selección para ingresar números manualmente.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Send Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">3️⃣ Configuración de Envío</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retraso entre mensajes:
            </label>
            <select
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
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
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 transition-colors duration-300">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Campaña Completada</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.total_contacts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{campaign.sent_count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Enviados</div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{campaign.failed_count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Errores</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setSelectedTemplate('');
              setSelectedContactList('');
              setPhoneNumbers('');
              setImageUrl('');
              setCampaign(null);
            }}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
            disabled={loading}
          >
            Limpiar
          </button>
          <button
            onClick={startBulkSend}
            disabled={loading || !selectedTemplate}
            className="px-6 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-300 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Iniciar Envío</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CRM Selection Modal */}
      {showCRMModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col transition-colors duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <i className="fas fa-users text-blue-600 dark:text-blue-400 mr-3"></i>
                    Seleccionar Contactos del CRM
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Filtra y selecciona los contactos que deseas incluir en el envío masivo
                  </p>
                </div>
                <button
                  onClick={() => setShowCRMModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <div className="flex flex-col space-y-4">
                {/* Top Row: Title + Actions */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">Filtros</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-2 text-sm ${
                        showFilters
                          ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <i className="fas fa-filter"></i>
                      <span>Avanzados</span>
                      {hasActiveFilters && !showFilters && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">●</span>
                      )}
                    </button>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center space-x-2 text-sm"
                      >
                        <i className="fas fa-times"></i>
                        <span>Limpiar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Basic Filters Row */}
                <div className="flex space-x-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar en todos los campos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                    />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                  >
                    <option value="all">Todos los estados</option>
                    {crmConfig.statuses.map(status => (
                      <option key={status.name} value={status.name}>{status.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Filters Panel */}
                {showFilters && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center uppercase">
                      <i className="fas fa-sliders-h mr-2"></i>
                      Filtros por Campo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {crmConfig.fields.filter(f => f.visible && ['text', 'email', 'tel', 'select', 'number', 'currency', 'date'].includes(f.type)).map(field => (
                        <div key={field.name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 transition-colors duration-300">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>

                          {(field.type === 'text' || field.type === 'email' || field.type === 'tel') && (
                            <input
                              type="text"
                              placeholder={`Buscar por ${field.label.toLowerCase()}...`}
                              value={dynamicFilters[field.name] || ''}
                              onChange={(e) => setDynamicFilters({ ...dynamicFilters, [field.name]: e.target.value })}
                              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                            />
                          )}

                          {field.type === 'select' && (
                            <select
                              value={dynamicFilters[field.name] || ''}
                              onChange={(e) => setDynamicFilters({ ...dynamicFilters, [field.name]: e.target.value })}
                              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                            >
                              <option value="">Todos</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}

                          {(field.type === 'number' || field.type === 'currency') && (
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                placeholder="Mín"
                                value={dynamicFilters[field.name]?.min || ''}
                                onChange={(e) => setDynamicFilters({
                                  ...dynamicFilters,
                                  [field.name]: { ...dynamicFilters[field.name], min: e.target.value ? parseFloat(e.target.value) : undefined }
                                })}
                                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                              />
                              <input
                                type="number"
                                placeholder="Máx"
                                value={dynamicFilters[field.name]?.max || ''}
                                onChange={(e) => setDynamicFilters({
                                  ...dynamicFilters,
                                  [field.name]: { ...dynamicFilters[field.name], max: e.target.value ? parseFloat(e.target.value) : undefined }
                                })}
                                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                              />
                            </div>
                          )}

                          {field.type === 'date' && (
                            <div className="flex space-x-2">
                              <input
                                type="date"
                                value={dynamicFilters[field.name]?.from || ''}
                                onChange={(e) => setDynamicFilters({
                                  ...dynamicFilters,
                                  [field.name]: { ...dynamicFilters[field.name], from: e.target.value }
                                })}
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                              />
                              <input
                                type="date"
                                value={dynamicFilters[field.name]?.to || ''}
                                onChange={(e) => setDynamicFilters({
                                  ...dynamicFilters,
                                  [field.name]: { ...dynamicFilters[field.name], to: e.target.value }
                                })}
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 transition-colors duration-300">
                    <tr>
                      <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600"
                          checked={getFilteredCRMContacts().length > 0 && selectedCRMContacts.size === getFilteredCRMContacts().length}
                          onChange={(e) => handleSelectAllCRM(e.target.checked)}
                        />
                      </th>
                      {crmConfig.fields.filter(f => f.visible).slice(0, 5).map(field => (
                        <th key={field.name} scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                          {field.label}
                        </th>
                      ))}
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
                    {getFilteredCRMContacts().map((contact) => (
                      <tr
                        key={contact.id}
                        className={selectedCRMContacts.has(contact.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                      >
                        <td className="relative px-7 sm:w-12 sm:px-6">
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600"
                            checked={selectedCRMContacts.has(contact.id)}
                            onChange={(e) => handleSelectCRMContact(contact.id, e.target.checked)}
                          />
                        </td>
                        {crmConfig.fields.filter(f => f.visible).slice(0, 5).map(field => (
                          <td key={field.name} className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {field.type === 'currency' ? (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ${contact[field.name]?.toLocaleString() || 0}
                              </span>
                            ) : field.type === 'date' && contact[field.name] ? (
                              new Date(contact[field.name]).toLocaleDateString()
                            ) : (
                              contact[field.name] || '-'
                            )}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {contact.status && (() => {
                            const status = crmConfig.statuses.find(s => s.name === contact.status);
                            if (!status) return <span className="text-gray-500 dark:text-gray-400">{contact.status}</span>;
                            const colorMap: Record<string, string> = {
                              green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                              blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                              yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                              red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                              purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                              orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                            };
                            return (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorMap[status.color] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {status.label}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {getFilteredCRMContacts().length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <i className="fas fa-users text-8xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay contactos que coincidan</h3>
                  <p className="text-gray-600 dark:text-gray-400">Prueba ajustando los filtros</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-lg">{selectedCRMContacts.size}</span> contacto(s) seleccionado(s)
                  {selectedCRMContacts.size > 0 && (
                    <span className="ml-4 text-gray-500 dark:text-gray-400">
                      • {getFilteredCRMContacts().length} visible(s) de {crmContacts.length} total(es)
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCRMModal(false)}
                    className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmCRMSelection}
                    disabled={selectedCRMContacts.size === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <i className="fas fa-check"></i>
                    <span>Confirmar Selección ({selectedCRMContacts.size})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
