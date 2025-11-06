import { useState, useEffect } from 'react';
import { loadConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: any[];
  hasImage: boolean;
}

export default function Templates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const config = loadConfig();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    // Check if API is configured
    if (config.api.accessToken && config.api.wabaId) {
      loadTemplatesFromAPI();
    }
    // Load last sync time
    const savedSync = localStorage.getItem('chatflow_last_template_sync');
    if (savedSync) {
      setLastSync(savedSync);
    }
  }, []);

  const loadTemplatesFromAPI = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`https://graph.facebook.com/${config.api.apiVersion}/${config.api.wabaId}/message_templates`, {
        headers: {
          'Authorization': `Bearer ${config.api.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedTemplates = data.data.map((template: any) => ({
          id: template.id || template.name,
          name: template.name,
          language: template.language,
          category: template.category,
          status: template.status,
          components: template.components || [],
          hasImage: template.components?.some((c: any) =>
            c.type === 'HEADER' && c.format === 'IMAGE'
          ) || false
        }));

        setTemplates(formattedTemplates);

        // Save sync time
        const syncTime = new Date().toISOString();
        setLastSync(syncTime);
        localStorage.setItem('chatflow_last_template_sync', syncTime);
        localStorage.setItem('chatflow_cached_templates', JSON.stringify(formattedTemplates));

        showSuccess(`${formattedTemplates.length} plantillas cargadas desde Meta`);
      } else {
        const errorData = await response.json();
        showError(errorData.error?.message || 'Error al cargar plantillas de Meta');

        // Try to load cached templates
        loadCachedTemplates();
      }
    } catch (error: any) {
      console.error('Error loading templates from API:', error);
      showError(`Error de conexión: ${error.message}`);

      // Try to load cached templates
      loadCachedTemplates();
    } finally {
      setIsLoading(false);
    }
  };

  const loadCachedTemplates = () => {
    try {
      const cached = localStorage.getItem('chatflow_cached_templates');
      if (cached) {
        setTemplates(JSON.parse(cached));
        showSuccess('Plantillas cargadas desde caché local');
      }
    } catch (error) {
      console.error('Error loading cached templates:', error);
    }
  };

  const syncWithMeta = async () => {
    if (!config.api.accessToken || !config.api.wabaId) {
      showError('Configura primero tu API de Meta en Configuración');
      return;
    }
    await loadTemplatesFromAPI();
  };

  const handleUseTemplate = (template: WhatsAppTemplate) => {
    // Navigate to Bulk Messaging and pre-select this template
    localStorage.setItem('selected_template', template.name);
    showSuccess(`Plantilla "${template.name}" seleccionada. Ve a Envío Masivo para usarla.`);
    // Trigger navigation event
    window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'bulk-messaging' }));
  };

  const handleViewDetails = (template: WhatsAppTemplate) => {
    const bodyComponent = template.components.find((c: any) => c.type === 'BODY');
    const headerComponent = template.components.find((c: any) => c.type === 'HEADER');
    const footerComponent = template.components.find((c: any) => c.type === 'FOOTER');

    const infoLines = [
      `📋 ${template.name}`,
      `🌐 ${template.language} | 📁 ${template.category} | ✅ ${template.status}`
    ];

    if (headerComponent) {
      infoLines.push(`📌 Header: ${headerComponent.format || 'TEXT'}`);
    }

    if (bodyComponent?.text) {
      infoLines.push(`💬 ${bodyComponent.text.substring(0, 100)}${bodyComponent.text.length > 100 ? '...' : ''}`);
    }

    showInfo(infoLines.join(' • '));
  };

  const getStatusBadge = (status: WhatsAppTemplate['status']) => {
    const statusConfig = {
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Aprobado', icon: 'fas fa-check-circle' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: 'fas fa-clock' },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rechazado', icon: 'fas fa-times-circle' }
    };

    const statusInfo = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <i className={`${statusInfo.icon} mr-1`}></i>
        {statusInfo.label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'MARKETING': 'bg-blue-100 text-blue-800',
      'UTILITY': 'bg-purple-100 text-purple-800',
      'AUTHENTICATION': 'bg-orange-100 text-orange-800'
    };

    const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {category}
      </span>
    );
  };

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
  const pendingTemplates = templates.filter(t => t.status === 'PENDING');
  const rejectedTemplates = templates.filter(t => t.status === 'REJECTED');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plantillas de WhatsApp</h1>
          <p className="text-gray-600">Gestiona y sincroniza tus plantillas aprobadas de Meta</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastSync && (
            <div className="text-sm text-gray-500">
              Última sincronización: {new Date(lastSync).toLocaleString('es-ES')}
            </div>
          )}
          <button
            onClick={syncWithMeta}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className={`fas fa-sync ${isLoading ? 'fa-spin' : ''}`}></i>
            <span>{isLoading ? 'Sincronizando...' : 'Sincronizar con Meta'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
              <i className="fas fa-check-circle"></i>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Plantillas Aprobadas</h3>
          <p className="text-2xl font-bold text-gray-900">{approvedTemplates.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Plantillas Pendientes</h3>
          <p className="text-2xl font-bold text-gray-900">{pendingTemplates.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
              <i className="fas fa-times-circle"></i>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Plantillas Rechazadas</h3>
          <p className="text-2xl font-bold text-gray-900">{rejectedTemplates.length}</p>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    {getStatusBadge(template.status)}
                    {getCategoryBadge(template.category)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center space-x-1">
                      <i className="fas fa-language"></i>
                      <span>{template.language.toUpperCase()}</span>
                    </span>
                    {template.hasImage && (
                      <span className="flex items-center space-x-1 text-blue-600">
                        <i className="fas fa-image"></i>
                        <span>Con imagen</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Template Components Preview */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Componentes:</h4>
                <div className="space-y-1">
                  {template.components.map((component, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center space-x-2">
                      <i className={`fas ${
                        component.type === 'HEADER' ? 'fa-heading' :
                        component.type === 'BODY' ? 'fa-align-left' :
                        component.type === 'FOOTER' ? 'fa-align-center' :
                        'fa-square'
                      }`}></i>
                      <span>{component.type}</span>
                      {component.format && (
                        <span className="text-blue-600">({component.format})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {template.status === 'APPROVED' && (
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Usar Plantilla
                  </button>
                )}
                <button
                  onClick={() => handleViewDetails(template)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <i className="fas fa-eye mr-2"></i>
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
            <i className="fas fa-file-alt text-8xl"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No hay plantillas disponibles</h3>
          <p className="text-gray-600 mb-6">
            {config.api.accessToken && config.api.wabaId
              ? 'Sincroniza con Meta para cargar tus plantillas aprobadas'
              : 'Configura primero tu API de Meta en la sección de Configuración'
            }
          </p>
          {config.api.accessToken && config.api.wabaId ? (
            <button
              onClick={syncWithMeta}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <i className="fas fa-sync mr-2"></i>
              Sincronizar con Meta
            </button>
          ) : (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-configuration'))}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <i className="fas fa-cog mr-2"></i>
              Ir a Configuración
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Cargando plantillas...</h3>
          <p className="text-gray-600">Sincronizando con Meta API</p>
        </div>
      )}

      {/* Help Section */}
      {templates.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-blue-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Información sobre Plantillas</h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• Solo las plantillas <strong>APROBADAS</strong> pueden ser utilizadas para envío masivo</p>
                <p>• Las plantillas con imágenes requieren proporcionar una URL de imagen al enviar</p>
                <p>• Sincroniza regularmente para obtener nuevas plantillas y actualizaciones de estado</p>
                <p>• Las plantillas rechazadas no pueden ser utilizadas hasta que sean modificadas y aprobadas nuevamente</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
