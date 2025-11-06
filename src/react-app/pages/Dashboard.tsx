import { useState, useEffect, useRef } from 'react';
import { loadConfig, loadCRMData } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

interface MetaInsightsData {
  phone_numbers: Array<{
    phone_number: string;
    display_phone_number: string;
    quality_rating: string;
    messaging_limit: string;
  }>;
  analytics?: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  conversations?: {
    cost: number;
    conversation_analytics: Array<{
      conversation_category: string;
      conversation_type: string;
      conversation_direction: string;
      cost: number;
      count: number;
    }>;
  };
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [metaData, setMetaData] = useState<MetaInsightsData | null>(null);
  const [localStats, setLocalStats] = useState({
    totalTemplates: 0,
    totalContactLists: 0,
    totalCRMContacts: 0,
    lastSync: null as string | null
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);
  const config = loadConfig();
  const { showError, showInfo } = useToast();

  useEffect(() => {
    loadLocalStats();
    if (config.api.accessToken && config.api.wabaId) {
      loadMetaAnalytics();
    } else {
      // Create charts with local data only
      setTimeout(() => createCharts([], undefined, undefined), 100);
    }
  }, []);

  const loadLocalStats = () => {
    try {
      // Load cached templates
      const cachedTemplates = localStorage.getItem('chatflow_cached_templates');
      const templates = cachedTemplates ? JSON.parse(cachedTemplates) : [];

      // Load contact lists
      const contactLists = localStorage.getItem('chatflow_contact_lists');
      const lists = contactLists ? JSON.parse(contactLists) : [];

      // Load CRM contacts
      const crmContacts = loadCRMData();

      // Load last sync time
      const lastSync = localStorage.getItem('chatflow_last_template_sync');

      setLocalStats({
        totalTemplates: templates.filter((t: any) => t.status === 'APPROVED').length,
        totalContactLists: lists.length,
        totalCRMContacts: crmContacts.length,
        lastSync
      });
    } catch (error) {
      console.error('Error loading local stats:', error);
    }
  };

  const loadMetaAnalytics = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${config.api.accessToken}` };

      // Fetch WABA phone numbers and their status
      const phoneResponse = await fetch(
        `https://graph.facebook.com/${config.api.apiVersion}/${config.api.wabaId}/phone_numbers`,
        { headers }
      );

      if (!phoneResponse.ok) {
        const errorData = await phoneResponse.json();
        showError(errorData.error?.message || 'Error al cargar datos de Meta');
        setIsLoading(false);
        return;
      }

      const phoneData = await phoneResponse.json();
      const phoneNumbers = phoneData.data || [];

      // Prepare date range (last 7 days)
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (7 * 24 * 60 * 60);

      let analyticsData = { sent: 0, delivered: 0, read: 0, failed: 0 };
      let conversationsData = undefined;

      // Try to fetch analytics if we have a phone number
      if (phoneNumbers.length > 0 && config.api.phoneNumberId) {
        try {
          const analyticsResponse = await fetch(
            `https://graph.facebook.com/${config.api.apiVersion}/${config.api.phoneNumberId}?fields=analytics.start(${startDate}).end(${endDate}).granularity(DAY)`,
            { headers }
          );

          if (analyticsResponse.ok) {
            const analyticsResult = await analyticsResponse.json();
            if (analyticsResult.analytics?.analytics_data) {
              const data = analyticsResult.analytics.analytics_data;
              analyticsData = {
                sent: data.reduce((sum: number, d: any) => sum + (d.sent || 0), 0),
                delivered: data.reduce((sum: number, d: any) => sum + (d.delivered || 0), 0),
                read: 0, // Not available in basic analytics
                failed: 0
              };
            }
          }
        } catch (e) {
          console.log('Analytics endpoint not available or requires permissions');
        }

        // Try to fetch conversation analytics
        try {
          const convResponse = await fetch(
            `https://graph.facebook.com/${config.api.apiVersion}/${config.api.wabaId}/conversation_analytics?start=${startDate}&end=${endDate}&granularity=DAILY`,
            { headers }
          );

          if (convResponse.ok) {
            const convResult = await convResponse.json();
            if (convResult.data) {
              const totalCost = convResult.data.reduce((sum: number, item: any) =>
                sum + (item.cost || 0), 0
              );
              conversationsData = {
                cost: totalCost,
                conversation_analytics: convResult.data || []
              };
            }
          }
        } catch (e) {
          console.log('Conversation analytics not available or requires permissions');
        }
      }

      setMetaData({
        phone_numbers: phoneNumbers,
        analytics: analyticsData,
        conversations: conversationsData
      });

      // Create charts with available data
      createCharts(phoneNumbers, analyticsData, conversationsData);

    } catch (error: any) {
      console.error('Error loading Meta analytics:', error);
      showError(`Error de conexión: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createCharts = (phoneNumbers: any[], analytics?: any, conversations?: any) => {
    const loadChartScript = () => {
      return new Promise((resolve) => {
        // @ts-ignore
        if (window.Chart) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
        script.onload = () => resolve(true);
        document.head.appendChild(script);
      });
    };

    loadChartScript().then(() => {
      // @ts-ignore
      const Chart = window.Chart;

      // Destroy existing charts before creating new ones
      if (chartRef.current) {
        // @ts-ignore
        const existingChart = Chart.getChart(chartRef.current);
        if (existingChart) existingChart.destroy();
      }
      if (donutChartRef.current) {
        // @ts-ignore
        const existingChart = Chart.getChart(donutChartRef.current);
        if (existingChart) existingChart.destroy();
      }

      // Message Analytics Chart (if data available)
      if (chartRef.current && Chart && analytics) {
        new Chart(chartRef.current, {
          type: 'bar',
          data: {
            labels: ['Enviados', 'Entregados'],
            datasets: [{
              label: 'Mensajes (últimos 7 días)',
              data: [
                analytics.sent || 0,
                analytics.delivered || 0
              ],
              backgroundColor: [
                'rgba(37, 211, 102, 0.8)',   // Green
                'rgba(59, 130, 246, 0.8)'    // Blue
              ],
              borderColor: [
                '#25D366',
                '#3B82F6'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: 'Análisis de Mensajes (Meta Insights)',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      } else if (chartRef.current && Chart) {
        // Fallback to local stats if no analytics
        new Chart(chartRef.current, {
          type: 'bar',
          data: {
            labels: ['Plantillas', 'Listas', 'Contactos'],
            datasets: [{
              label: 'Recursos Locales',
              data: [
                localStats.totalTemplates,
                localStats.totalContactLists,
                localStats.totalCRMContacts
              ],
              backgroundColor: [
                'rgba(37, 211, 102, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(59, 130, 246, 0.8)'
              ],
              borderColor: [
                '#25D366',
                '#8B5CF6',
                '#3B82F6'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: 'Recursos del Sistema',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }

      // Quality rating or conversation types
      if (donutChartRef.current && Chart) {
        if (conversations?.conversation_analytics && conversations.conversation_analytics.length > 0) {
          // Group by conversation type
          const typeCounts: { [key: string]: number } = {};
          conversations.conversation_analytics.forEach((item: any) => {
            const type = item.conversation_type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + item.count;
          });

          new Chart(donutChartRef.current, {
            type: 'doughnut',
            data: {
              labels: Object.keys(typeCounts),
              datasets: [{
                data: Object.values(typeCounts),
                backgroundColor: [
                  '#25D366',
                  '#128C7E',
                  '#8B5CF6',
                  '#EF4444',
                  '#F59E0B'
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                },
                title: {
                  display: true,
                  text: 'Conversaciones por Tipo (Meta Insights)',
                  font: {
                    size: 16,
                    weight: 'bold'
                  }
                }
              }
            }
          });
        } else if (phoneNumbers.length > 0) {
          // Fallback to quality ratings
          const qualityRatings = phoneNumbers.map(p => p.quality_rating || 'Unknown');
          const qualityCounts: { [key: string]: number } = {};

          qualityRatings.forEach(rating => {
            qualityCounts[rating] = (qualityCounts[rating] || 0) + 1;
          });

          new Chart(donutChartRef.current, {
            type: 'doughnut',
            data: {
              labels: Object.keys(qualityCounts),
              datasets: [{
                data: Object.values(qualityCounts),
                backgroundColor: [
                  '#25D366',
                  '#F59E0B',
                  '#EF4444',
                  '#9CA3AF'
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                },
                title: {
                  display: true,
                  text: 'Calidad del Número',
                  font: {
                    size: 16,
                    weight: 'bold'
                  }
                }
              }
            }
          });
        }
      }
    });
  };

  const stats = metaData?.analytics ? [
    {
      title: 'Mensajes Enviados',
      value: metaData.analytics.sent,
      icon: 'fas fa-paper-plane',
      color: 'from-green-500 to-green-600',
      description: 'Últimos 7 días'
    },
    {
      title: 'Mensajes Entregados',
      value: metaData.analytics.delivered,
      icon: 'fas fa-check-circle',
      color: 'from-blue-500 to-blue-600',
      description: 'Últimos 7 días'
    },
    {
      title: 'Conversaciones',
      value: metaData.conversations?.conversation_analytics?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
      icon: 'fas fa-comments',
      color: 'from-purple-500 to-purple-600',
      description: 'Últimos 7 días'
    },
    {
      title: 'Costo Total',
      value: `$${(metaData.conversations?.cost || 0).toFixed(2)}`,
      icon: 'fas fa-dollar-sign',
      color: 'from-orange-500 to-orange-600',
      description: 'Últimos 7 días'
    }
  ] : [
    {
      title: 'Plantillas Aprobadas',
      value: localStats.totalTemplates,
      icon: 'fas fa-file-alt',
      color: 'from-green-500 to-green-600',
      description: 'Plantillas de Meta'
    },
    {
      title: 'Listas de Contactos',
      value: localStats.totalContactLists,
      icon: 'fas fa-address-book',
      color: 'from-purple-500 to-purple-600',
      description: 'Listas creadas'
    },
    {
      title: 'Contactos CRM',
      value: localStats.totalCRMContacts,
      icon: 'fas fa-users',
      color: 'from-blue-500 to-blue-600',
      description: 'En tu CRM'
    },
    {
      title: 'Números de Teléfono',
      value: metaData?.phone_numbers.length || 0,
      icon: 'fas fa-phone',
      color: 'from-orange-500 to-orange-600',
      description: 'Conectados a WABA'
    }
  ];

  const hasMetaConnection = config.api.accessToken && config.api.wabaId;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Métricas en tiempo real de tu plataforma WhatsApp Business</p>
        </div>
        {hasMetaConnection && (
          <button
            onClick={loadMetaAnalytics}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className={`fas fa-sync ${isLoading ? 'fa-spin' : ''}`}></i>
            <span>{isLoading ? 'Actualizando...' : 'Actualizar Métricas'}</span>
          </button>
        )}
      </div>

      {/* Connection Status */}
      {!hasMetaConnection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-600"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-yellow-900 mb-2">API de Meta no configurada</h3>
              <p className="text-yellow-800 text-sm mb-4">
                Configura tu API de Meta en la sección de Configuración para ver métricas en tiempo real
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'configuration' }))}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-all"
              >
                <i className="fas fa-cog mr-2"></i>
                Ir a Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                <i className={stat.icon}></i>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {hasMetaConnection ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Local Resources */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recursos del Sistema</h3>
            <div className="h-64">
              <canvas ref={chartRef} className="w-full h-full"></canvas>
            </div>
          </div>

          {/* Donut Chart - Phone Quality */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Estado de la Cuenta</h3>
            {metaData?.phone_numbers && metaData.phone_numbers.length > 0 ? (
              <div className="h-64">
                <canvas ref={donutChartRef} className="w-full h-full"></canvas>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <i className="fas fa-chart-pie text-4xl mb-2"></i>
                  <p>No hay datos disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-lg mb-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
            <i className="fas fa-chart-line text-8xl"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Gráficos no disponibles</h3>
          <p className="text-gray-600">
            Configura tu API de Meta para ver gráficos y métricas en tiempo real
          </p>
        </div>
      )}

      {/* WhatsApp Business Account Info */}
      {metaData?.phone_numbers && metaData.phone_numbers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Números de Teléfono Conectados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Límite de Mensajería
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metaData.phone_numbers.map((phone) => (
                  <tr key={phone.phone_number} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {phone.display_phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        phone.quality_rating === 'GREEN' ? 'bg-green-100 text-green-800' :
                        phone.quality_rating === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                        phone.quality_rating === 'RED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {phone.quality_rating || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {phone.messaging_limit === 'TIER_1K' ? '1,000 conversaciones/día' :
                       phone.messaging_limit === 'TIER_10K' ? '10,000 conversaciones/día' :
                       phone.messaging_limit === 'TIER_100K' ? '100,000 conversaciones/día' :
                       phone.messaging_limit === 'TIER_UNLIMITED' ? 'Ilimitado' :
                       phone.messaging_limit || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Last Sync Info */}
      {localStats.lastSync && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Última sincronización con Meta: {new Date(localStats.lastSync).toLocaleString('es-ES')}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-blue-600"></i>
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Acerca de las Métricas</h3>
            <div className="text-blue-800 text-sm space-y-1">
              <p>• Las métricas se obtienen directamente de la API de Meta WhatsApp Business</p>
              <p>• Los datos locales (plantillas, listas, contactos) se actualizan automáticamente</p>
              <p>• La calidad del número afecta la capacidad de envío y reputación</p>
              <p>• Sincroniza regularmente para mantener los datos actualizados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
