import { useState, useEffect } from 'react';
import { loadContactLists } from '@/react-app/utils/storage';

export default function BulkMessaging() {
  const [activeTab, setActiveTab] = useState<'manual' | 'csv' | 'lists'>('manual');
  const [manualNumbers, setManualNumbers] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedList, setSelectedList] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ sent: 0, errors: 0, pending: 0 });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadTemplates();
    setContactLists(loadContactLists());
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Por favor selecciona un archivo CSV válido');
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

  const startBulkSend = async () => {
    if (!selectedTemplate) {
      alert('Por favor selecciona una plantilla');
      return;
    }

    if (templateRequiresImage() && !imageUrl) {
      alert('Esta plantilla requiere una imagen. Por favor proporciona una URL de imagen.');
      return;
    }

    let phoneNumbers: string[] = [];

    // Get phone numbers based on active tab
    if (activeTab === 'manual') {
      phoneNumbers = manualNumbers
        .split('\n')
        .map(num => num.trim())
        .filter(num => num.length > 0);
    } else if (activeTab === 'csv' && csvFile) {
      // Parse CSV file
      const text = await csvFile.text();
      const lines = text.split('\n');
      phoneNumbers = lines
        .map(line => line.split(',')[0]?.trim())
        .filter(num => num && num.length > 0);
    } else if (activeTab === 'lists' && selectedList) {
      const list = contactLists.find(l => l.id === selectedList);
      phoneNumbers = list?.contacts?.map((c: any) => c.phone_number) || [];
    }

    if (phoneNumbers.length === 0) {
      alert('No hay números de teléfono para enviar');
      return;
    }

    setIsSending(true);
    setProgress(0);
    setStats({ sent: 0, errors: 0, pending: phoneNumbers.length });

    try {
      const response = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_name: selectedTemplate,
          phone_numbers: phoneNumbers,
          image_url: templateRequiresImage() ? imageUrl : undefined,
          delay_seconds: delaySeconds
        })
      });

      const result = await response.json();

      if (response.ok) {
        setStats({
          sent: result.sent_count,
          errors: result.failed_count,
          pending: 0
        });
        setProgress(100);
        alert(`Envío completado: ${result.sent_count} enviados, ${result.failed_count} errores`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      alert('Error al enviar mensajes masivos');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Envío Masivo</h1>
        <p className="text-gray-600">Envía mensajes de WhatsApp a múltiples contactos usando plantillas aprobadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
              {[
                { id: 'manual', label: 'Manual', icon: 'fas fa-keyboard' },
                { id: 'csv', label: 'CSV', icon: 'fas fa-file-csv' },
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
            <div className="mb-6">
              {activeTab === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Números de teléfono (uno por línea)
                  </label>
                  <textarea
                    value={manualNumbers}
                    onChange={(e) => setManualNumbers(e.target.value)}
                    placeholder="Ejemplo:&#10;+5491234567890&#10;+5491234567891"
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {activeTab === 'csv' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir archivo CSV
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                      <p className="text-gray-600">
                        {csvFile ? csvFile.name : 'Arrastra tu archivo CSV aquí o haz clic para seleccionar'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        El primer campo debe contener los números de teléfono
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'lists' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar lista de contactos
                  </label>
                  <select
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una lista</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.contacts?.length || 0} contactos)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

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
                <option value="">Selecciona una plantilla</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name} ({template.language})
                  </option>
                ))}
              </select>
              
              {templates.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No hay plantillas disponibles. Ve a Configuración para conectar con Meta API.
                </p>
              )}
            </div>

            {/* Image URL (conditional) */}
            {templateRequiresImage() && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de la imagen <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esta plantilla requiere una imagen en el encabezado
                </p>
              </div>
            )}

            {/* Delay Settings */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retraso entre mensajes (segundos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={startBulkSend}
              disabled={isSending || !selectedTemplate}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isSending ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  <span>Iniciar Envío Masivo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          {/* Progress */}
          {isSending && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-600">{progress}% completado</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check text-white"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enviados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-times text-white"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-white"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <i className="fas fa-sync text-blue-500"></i>
                <span className="text-sm">Sincronizar Plantillas</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <i className="fas fa-download text-green-500"></i>
                <span className="text-sm">Exportar Resultados</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <i className="fas fa-history text-purple-500"></i>
                <span className="text-sm">Ver Historial</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
