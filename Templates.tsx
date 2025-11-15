import { useState, useEffect } from 'react';
import { loadConfig } from './storage';

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
  const [error, setError] = useState<string | null>(null);
  const config = loadConfig();

  useEffect(() => {
    loadTemplates();
    // Load last sync time from localStorage
    const savedSync = localStorage.getItem('chatflow_last_template_sync');
    if (savedSync) {
      setLastSync(savedSync);
    }
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/templates');
      
      if (response.ok) {
        const data = await response.json();
        const formattedTemplates = data.map((template: any) => ({
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar plantillas');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Error de conexión. Verifica tu configuración de API.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithMeta = async () => {
    await loadTemplates();
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
            <div>
              <h3 className="text-red-800 font-medium">Error al cargar plantillas</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

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
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all">
                    <i className="fas fa-paper-plane mr-2"></i>
                    Usar Plantilla
                  </button>
                )}
                <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
                  <i className="fas fa-eye mr-2"></i>
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading && !error ? (
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
              Sincronizar con Meta
            </button>
          ) : (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-configuration'))}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Ir a Configuración
            </button>
          )}
        </div>
      ) : isLoading ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Cargando plantillas...</h3>
          <p className="text-gray-600">Sincronizando con Meta API</p>
        </div>
      ) : null}

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
