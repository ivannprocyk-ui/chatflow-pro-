import { useState, useEffect } from 'react';
import { loadContactLists, loadConfig, loadTemplates, saveTemplates, saveCampaigns, loadCampaigns, validatePhone, cleanPhone, appendToSendLog } from './storage';
import { useToast } from './Toast';

interface SendResult {
  phone: string;
  status: 'success' | 'error';
  details: string;
  timestamp: string;
}

export default function BulkMessaging() {
  const [activeTab, setActiveTab] = useState<'manual' | 'csv' | 'lists'>('manual');
  const [manualNumbers, setManualNumbers] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ sent: 0, errors: 0, pending: 0 });
  const [isSending, setIsSending] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    const templatesData = loadTemplates();
    setTemplates(templatesData);
    setContactLists(loadContactLists());
  }, []);

  const syncTemplates = async () => {
    const config = loadConfig();

    if (!config.api.accessToken || !config.api.wabaId) {
      showError('Configura primero tu API de Meta en Configuración');
      return;
    }

    showInfo('Sincronizando plantillas con Meta...');

    try {
      const url = `https://graph.facebook.com/${config.api.apiVersion}/${config.api.wabaId}/message_templates`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.api.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const approvedTemplates = data.data.filter((t: any) => t.status === 'APPROVED');
        setTemplates(approvedTemplates);
        saveTemplates(approvedTemplates);
        showSuccess(`${approvedTemplates.length} plantillas sincronizadas correctamente`);
      } else {
        const error = await response.json();
        showError(`Error al sincronizar: ${error.error?.message || 'Error desconocido'}`);
      }
    } catch (error) {
      showError('Error de conexión al sincronizar plantillas');
      console.error(error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showWarning('Por favor selecciona un archivo CSV válido');
      return;
    }

    setCsvFile(file);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const numbers = lines
        .map(line => line.split(',')[0]?.trim())
        .filter(num => num && num.length > 0)
        .slice(0, 10); // Preview first 10

      setCsvPreview(numbers);
      showSuccess(`Archivo cargado: ${lines.length} números detectados`);
    } catch (error) {
      showError('Error al leer el archivo CSV');
    }
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.name === selectedTemplate);
  };

  const templateRequiresImage = () => {
    const template = getSelectedTemplate();
    if (!template) return false;

    return template.components?.some((c: any) =>
      c.type === 'HEADER' && c.format === 'IMAGE'
    );
  };

  const getPhoneNumbers = async (): Promise<string[]> => {
    let phoneNumbers: string[] = [];

    if (activeTab === 'manual') {
      phoneNumbers = manualNumbers
        .split('\n')
        .map(num => num.trim())
        .filter(num => num.length > 0);
    } else if (activeTab === 'csv' && csvFile) {
      const text = await csvFile.text();
      const lines = text.split('\n');
      phoneNumbers = lines
        .map(line => line.split(',')[0]?.trim())
        .filter(num => num && num.length > 0);
    } else if (activeTab === 'lists' && selectedList) {
      const list = contactLists.find(l => l.id === selectedList);
      phoneNumbers = list?.contacts || [];
    }

    return phoneNumbers;
  };

  const sendMessage = async (phone: string, templateName: string, config: any): Promise<SendResult> => {
    const template = templates.find(t => t.name === templateName);
    if (!template) {
      return {
        phone,
        status: 'error',
        details: 'Plantilla no encontrada',
        timestamp: new Date().toISOString()
      };
    }

    const url = `https://graph.facebook.com/${config.api.apiVersion}/${config.api.phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      to: cleanPhone(phone),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: template.language || 'es'
        }
      }
    };

    // Add image if required
    if (templateRequiresImage() && imageUrl) {
      payload.template.components = [
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        return {
          phone,
          status: 'success',
          details: `ID: ${data.messages[0].id}`,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          phone,
          status: 'error',
          details: data.error?.message || 'Error desconocido',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        phone,
        status: 'error',
        details: error.message || 'Error de conexión',
        timestamp: new Date().toISOString()
      };
    }
  };

  const startBulkSend = async () => {
    const config = loadConfig();

    // Validations
    if (!config.api.phoneNumberId || !config.api.accessToken || !config.api.wabaId) {
      showError('Configura primero tu API de Meta en Configuración');
      return;
    }

    if (!selectedTemplate) {
      showWarning('Por favor selecciona una plantilla');
      return;
    }

    if (templateRequiresImage() && !imageUrl) {
      showWarning('Esta plantilla requiere una URL de imagen');
      return;
    }

    if (templateRequiresImage() && imageUrl && !imageUrl.startsWith('https://')) {
      showError('La URL de la imagen debe usar HTTPS');
      return;
    }

    const phoneNumbers = await getPhoneNumbers();

    if (phoneNumbers.length === 0) {
      showWarning('No hay números de teléfono para enviar');
      return;
    }

    // Validate phone numbers
    const invalidPhones = phoneNumbers.filter(p => !validatePhone(p));
    if (invalidPhones.length > 0) {
      const confirm = window.confirm(
        `Se encontraron ${invalidPhones.length} números con formato inválido. ¿Deseas continuar con los números válidos?`
      );
      if (!confirm) return;
    }

    const validPhones = phoneNumbers.filter(p => validatePhone(p));

    if (validPhones.length === 0) {
      showError('No hay números válidos para enviar');
      return;
    }

    const confirmSend = window.confirm(
      `¿Estás seguro de enviar la plantilla "${selectedTemplate}" a ${validPhones.length} contactos?`
    );

    if (!confirmSend) return;

    // Start sending
    setIsSending(true);
    setShowProgress(true);
    setShowResults(true);
    setProgress(0);
    setStats({ sent: 0, errors: 0, pending: validPhones.length });
    setResults([]);

    let sentCount = 0;
    let errorCount = 0;
    const sendResults: SendResult[] = [];

    for (let i = 0; i < validPhones.length; i++) {
      const phone = validPhones[i];

      const result = await sendMessage(phone, selectedTemplate, config);
      sendResults.push(result);

      if (result.status === 'success') {
        sentCount++;
      } else {
        errorCount++;
      }

      const pendingCount = validPhones.length - (i + 1);
      const progressPercent = ((i + 1) / validPhones.length) * 100;

      setStats({ sent: sentCount, errors: errorCount, pending: pendingCount });
      setProgress(progressPercent);
      setResults([...sendResults]);

      // Save to log
      appendToSendLog({
        phone: result.phone,
        status: result.status,
        details: result.details,
        template: selectedTemplate,
        timestamp: result.timestamp
      });

      // Delay between messages (except for last one)
      if (i < validPhones.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    setIsSending(false);

    // Save campaign
    const campaign = {
      id: Date.now().toString(),
      name: `Campaña ${selectedTemplate}`,
      date: new Date().toISOString(),
      totalContacts: validPhones.length,
      sent: sentCount,
      errors: errorCount,
      template: selectedTemplate,
      status: 'completed' as const
    };

    const campaigns = loadCampaigns();
    campaigns.unshift(campaign);
    saveCampaigns(campaigns);

    showSuccess(`✅ Envío completado! Enviados: ${sentCount}, Errores: ${errorCount}`);
  };

  const exportResults = () => {
    if (results.length === 0) {
      showWarning('No hay resultados para exportar');
      return;
    }

    const csvContent = [
      ['Teléfono', 'Estado', 'Detalles', 'Plantilla', 'Fecha y Hora'],
      ...results.map(r => [
        r.phone,
        r.status === 'success' ? 'Enviado' : 'Error',
        r.details,
        selectedTemplate,
        new Date(r.timestamp).toLocaleString('es-AR')
      ])
    ];

    const csvString = csvContent.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whatsapp_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showSuccess('Resultados exportados correctamente');
  };

  const loadListContacts = () => {
    if (!selectedList) return;

    const list = contactLists.find(l => l.id === selectedList);
    if (list) {
      showInfo(`Lista "${list.name}" cargada con ${list.contacts.length} contactos`);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Envío Masivo de Mensajes</h1>
          <p className="text-gray-600">Envía mensajes de WhatsApp a múltiples contactos</p>
        </div>
        <button
          onClick={() => window.location.hash = 'dashboard'}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <i className="fas fa-home"></i>
          <span>Volver al Inicio</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Configurar Campaña</h3>
          <button
            onClick={syncTemplates}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <i className="fas fa-sync-alt"></i>
            <span>Sincronizar Plantillas</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {[
            { id: 'manual', label: 'Manual', icon: 'fas fa-keyboard' },
            { id: 'csv', label: 'Archivo CSV', icon: 'fas fa-file-csv' },
            { id: 'lists', label: 'Listas Guardadas', icon: 'fas fa-list' }
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
        {activeTab === 'manual' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Números de Teléfono (uno por línea)
            </label>
            <textarea
              value={manualNumbers}
              onChange={(e) => setManualNumbers(e.target.value)}
              placeholder="5491112345678&#10;5491187654321&#10;5491156789012"
              className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-2">
              <i className="fas fa-info-circle"></i> Formato: código de país + código de área + número (sin espacios ni guiones)
            </p>
          </div>
        )}

        {activeTab === 'csv' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargar Archivo CSV
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <i className="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4 block"></i>
                <p className="text-gray-700 font-medium mb-2">
                  {csvFile ? csvFile.name : 'Haz clic para cargar un archivo CSV'}
                </p>
                <p className="text-sm text-gray-500">
                  El archivo debe tener una columna con números de teléfono
                </p>
              </label>
            </div>
            {csvPreview.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800 mb-2">
                  <i className="fas fa-check-circle"></i> Archivo cargado correctamente
                </p>
                <p className="text-sm text-green-700">Preview de primeros números:</p>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  {csvPreview.slice(0, 5).map((num, i) => (
                    <li key={i}>• {num}</li>
                  ))}
                  {csvPreview.length > 5 && <li>... y {csvPreview.length - 5} más</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Lista de Contactos
            </label>
            <select
              value={selectedList}
              onChange={(e) => {
                setSelectedList(e.target.value);
                loadListContacts();
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Selecciona una lista --</option>
              {contactLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.contacts.length} contactos)
                </option>
              ))}
            </select>
            {contactLists.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                <i className="fas fa-info-circle"></i> No tienes listas guardadas. Crea una en la sección "Listas de Contactos".
              </p>
            )}
          </div>
        )}

        {/* Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plantilla de WhatsApp
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Selecciona una plantilla --</option>
            {templates.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name} ({template.language})
              </option>
            ))}
          </select>
          {templates.length === 0 && (
            <p className="text-sm text-orange-600 mt-2">
              <i className="fas fa-exclamation-triangle"></i> No hay plantillas. Haz clic en "Sincronizar Plantillas" arriba.
            </p>
          )}
        </div>

        {/* Image URL (conditional) */}
        {templateRequiresImage() && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de Imagen (HTTPS)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-orange-600 mt-2">
              <i className="fas fa-image"></i> Esta plantilla requiere una imagen en el header
            </p>
          </div>
        )}

        {/* Delay */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Retraso entre mensajes (segundos)
          </label>
          <input
            type="number"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 2)}
            min="1"
            max="60"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={startBulkSend}
          disabled={isSending}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
        >
          {isSending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Enviando...
            </>
          ) : (
            <>
              <i className="fas fa-rocket mr-2"></i>
              Iniciar Envío Masivo
            </>
          )}
        </button>
      </div>

      {/* Progress Section */}
      {showProgress && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Progreso del Envío</h3>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && `${Math.round(progress)}%`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
              <p className="text-2xl font-bold text-green-700">{stats.sent}</p>
              <p className="text-sm text-green-600">Enviados</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <i className="fas fa-times-circle text-red-500 text-2xl mb-2"></i>
              <p className="text-2xl font-bold text-red-700">{stats.errors}</p>
              <p className="text-sm text-red-600">Errores</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <i className="fas fa-clock text-yellow-500 text-2xl mb-2"></i>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-sm text-yellow-600">Pendientes</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {showResults && results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Resultados del Envío</h3>
            <button
              onClick={exportResults}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <i className="fas fa-download"></i>
              <span>Exportar CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'success' ? '✓ Enviado' : '✗ Error'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{result.details}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(result.timestamp).toLocaleTimeString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
