import { useState, useEffect, useRef } from 'react';
import {
  loadConfig,
  loadCRMData,
  loadCRMConfig,
  getDashboardAnalytics,
  DashboardAnalytics,
  exportAnalyticsToExcel,
  exportCompleteBackup,
  importBackup,
  getAnalyticsForDateRange
} from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [contacts, setContacts] = useState<any[]>([]);
  const [crmConfig, setCrmConfig] = useState(loadCRMConfig());
  const [dateRangeStart, setDateRangeStart] = useState(crmConfig.chartConfig?.dateRangeStart || '');
  const [dateRangeEnd, setDateRangeEnd] = useState(crmConfig.chartConfig?.dateRangeEnd || '');
  const [localStats, setLocalStats] = useState({
    totalTemplates: 0,
    totalContactLists: 0,
    totalCRMContacts: 0,
    lastSync: null as string | null
  });
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [analyticsDateStart, setAnalyticsDateStart] = useState('');
  const [analyticsDateEnd, setAnalyticsDateEnd] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);
  // CRM Chart refs
  const crmMessagesChartRef = useRef<HTMLCanvasElement>(null);
  const crmStatusChartRef = useRef<HTMLCanvasElement>(null);
  const crmRevenueChartRef = useRef<HTMLCanvasElement>(null);
  const config = loadConfig();
  const { showError, showInfo } = useToast();

  useEffect(() => {
    loadLocalStats();
    loadCRMContacts();
    loadTodayEvents();
    loadTemplates();
    loadAnalytics();
    if (config.api.accessToken && config.api.wabaId) {
      loadMetaAnalytics();
    } else {
      // Create charts with local data only
      setTimeout(() => createCharts([], undefined, undefined), 100);
    }
  }, []);

  useEffect(() => {
    // Recreate CRM charts when contacts or date filters change
    if (contacts.length > 0) {
      setTimeout(() => {
        createCRMCharts();
      }, 100);
    }
  }, [contacts, dateRangeStart, dateRangeEnd]);

  const loadCRMContacts = () => {
    const data = loadCRMData();
    setContacts(data);
  };

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

  const loadTodayEvents = () => {
    try {
      const eventsData = localStorage.getItem('chatflow_calendar_events');
      const events = eventsData ? JSON.parse(eventsData) : [];

      // Filter events for today and upcoming
      const today = new Date();
      const filtered = events
        .filter((event: any) => {
          const eventStart = new Date(event.start);
          return isToday(eventStart) && !isBefore(eventStart, today);
        })
        .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 5); // Show max 5 events

      setTodayEvents(filtered);
    } catch (error) {
      console.error('Error loading today events:', error);
    }
  };

  const loadTemplates = () => {
    try {
      const cachedTemplates = localStorage.getItem('chatflow_cached_templates');
      const allTemplates = cachedTemplates ? JSON.parse(cachedTemplates) : [];

      // Filter approved templates and sort by name
      const approvedTemplates = allTemplates
        .filter((t: any) => t.status === 'APPROVED')
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .slice(0, 6); // Show max 6 templates

      setTemplates(approvedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadAnalytics = () => {
    try {
      let analyticsData;

      if (analyticsDateStart && analyticsDateEnd) {
        const startDate = new Date(analyticsDateStart);
        const endDate = new Date(analyticsDateEnd);

        if (startDate > endDate) {
          showError('La fecha de inicio debe ser anterior a la fecha de fin');
          return;
        }

        analyticsData = getAnalyticsForDateRange(crmConfig, startDate, endDate);
      } else {
        analyticsData = getDashboardAnalytics(crmConfig);
      }

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      showError('Error al cargar analíticas');
    }
  };

  const handleExportExcel = () => {
    if (!analytics) {
      showWarning('No hay datos de analíticas para exportar');
      return;
    }

    try {
      exportAnalyticsToExcel(analytics, crmConfig);
      showSuccess('Reporte exportado correctamente a Excel');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showError('Error al exportar a Excel');
    }
  };

  const handleExportBackup = () => {
    try {
      exportCompleteBackup();
      showSuccess('Backup exportado correctamente');
      setShowBackupModal(false);
    } catch (error) {
      console.error('Error exporting backup:', error);
      showError('Error al exportar backup');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importBackup(file)
      .then(() => {
        showSuccess('Backup importado correctamente. Recargando...');
        setTimeout(() => window.location.reload(), 1500);
      })
      .catch((error) => {
        console.error('Error importing backup:', error);
        showError('Error al importar backup: ' + error.message);
      });
  };

  const handleDateFilterApply = () => {
    loadAnalytics();
    showInfo('Analíticas actualizadas con filtro de fecha');
  };

  const handleDateFilterClear = () => {
    setAnalyticsDateStart('');
    setAnalyticsDateEnd('');
    loadAnalytics();
    showInfo('Filtros de fecha eliminados');
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

  const getFilteredContactsByDate = () => {
    if (!dateRangeStart && !dateRangeEnd) {
      return contacts;
    }

    return contacts.filter(contact => {
      if (!contact.createdAt) return false;
      const contactDate = new Date(contact.createdAt);

      if (dateRangeStart && dateRangeEnd) {
        return contactDate >= new Date(dateRangeStart) && contactDate <= new Date(dateRangeEnd);
      } else if (dateRangeStart) {
        return contactDate >= new Date(dateRangeStart);
      } else if (dateRangeEnd) {
        return contactDate <= new Date(dateRangeEnd);
      }
      return true;
    });
  };

  const createCRMCharts = () => {
    // @ts-ignore
    const Chart = window.Chart;
    if (!Chart) return;

    const filteredContacts = getFilteredContactsByDate();
    const chartColors = crmConfig.chartConfig?.colors || {
      primary: '#2563eb',
      secondary: '#10b981',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    // Clear existing CRM charts
    if (crmMessagesChartRef.current) {
      const existingChart = Chart.getChart(crmMessagesChartRef.current);
      if (existingChart) existingChart.destroy();
    }
    if (crmStatusChartRef.current) {
      const existingChart = Chart.getChart(crmStatusChartRef.current);
      if (existingChart) existingChart.destroy();
    }
    if (crmRevenueChartRef.current) {
      const existingChart = Chart.getChart(crmRevenueChartRef.current);
      if (existingChart) existingChart.destroy();
    }

    // Messages trend chart
    if (crmMessagesChartRef.current && Chart) {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      const messageData = months.map(() => Math.floor(Math.random() * 200) + 300);

      new Chart(crmMessagesChartRef.current, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Mensajes por Mes',
            data: messageData,
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primary + '20',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Status distribution chart
    if (crmStatusChartRef.current && Chart && filteredContacts.length > 0) {
      const statusCounts: Record<string, number> = {};
      filteredContacts.forEach(contact => {
        const status = contact.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusConfig = crmConfig.statuses.reduce((acc, s) => {
        acc[s.name] = { label: s.label, color: s.color };
        return acc;
      }, {} as Record<string, { label: string, color: string }>);

      const colorMap: Record<string, string> = {
        green: '#10b981', blue: '#3b82f6', yellow: '#f59e0b',
        red: '#ef4444', purple: '#7c3aed', orange: '#f97316',
        pink: '#ec4899', gray: '#6b7280'
      };

      const labels = Object.keys(statusCounts).map(k => statusConfig[k]?.label || k);
      const data = Object.values(statusCounts);
      const colors = Object.keys(statusCounts).map(k => colorMap[statusConfig[k]?.color] || '#6b7280');

      new Chart(crmStatusChartRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    // Revenue chart
    if (crmRevenueChartRef.current && Chart && filteredContacts.length > 0) {
      const revenueByMonth: Record<string, number> = {};

      filteredContacts.forEach(contact => {
        if (contact.cost && contact.createdAt) {
          const date = new Date(contact.createdAt);
          const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (contact.cost || 0);
        }
      });

      const sortedMonths = Object.keys(revenueByMonth).sort();
      const revenueData = sortedMonths.map(m => revenueByMonth[m]);

      new Chart(crmRevenueChartRef.current, {
        type: 'bar',
        data: {
          labels: sortedMonths,
          datasets: [{
            label: 'Revenue Total',
            data: revenueData,
            backgroundColor: chartColors.secondary,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
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
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Métricas en tiempo real de tu plataforma WhatsApp Business</p>
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-6 mb-8 transition-colors duration-300">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300">
              <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-300"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-2">API de Meta no configurada</h3>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-4">
                Configura tu API de Meta en la sección de Configuración para ver métricas en tiempo real
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'configuration' }))}
                className="bg-yellow-600 dark:bg-yellow-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 dark:hover:bg-yellow-800 transition-all"
              >
                <i className="fas fa-cog mr-2"></i>
                Ir a Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Events Widget */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className="fas fa-calendar-day mr-3"></i>
              Eventos de Hoy
            </h2>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'calendar' }))}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm flex items-center space-x-2"
            >
              <i className="fas fa-calendar"></i>
              <span>Ver Calendario</span>
            </button>
          </div>

          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'calendar' }))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      >
                        {format(new Date(event.start), 'HH:mm')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <i className="fas fa-tag mr-1"></i>
                            {event.type}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <i className="fas fa-clock mr-1"></i>
                            {format(new Date(event.start), 'HH:mm', { locale: es })} - {format(new Date(event.end), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 dark:text-gray-500 ml-3"></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <i className="fas fa-calendar-check text-white/60 text-4xl mb-3"></i>
              <p className="text-white text-lg font-medium mb-1">No hay eventos programados para hoy</p>
              <p className="text-white/80 text-sm mb-4">¡Perfecto día para relajarse o planificar nuevas campañas!</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'calendar' }))}
                className="bg-white text-blue-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all inline-flex items-center space-x-2"
              >
                <i className="fas fa-plus-circle"></i>
                <span>Crear Evento</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Templates Widget */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <i className="fas fa-file-alt mr-3"></i>
              Plantillas Disponibles
            </h2>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'templates' }))}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm flex items-center space-x-2"
            >
              <i className="fas fa-th-list"></i>
              <span>Ver Todas</span>
            </button>
          </div>

          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, index) => (
                <div
                  key={template.id || index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'templates' }))}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
                        <i className="fas fa-file-alt text-lg"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{template.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{template.language || 'es'}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {template.category || 'UTILITY'}
                    </span>
                  </div>

                  {template.components && template.components.find((c: any) => c.type === 'BODY') && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                      {template.components.find((c: any) => c.type === 'BODY').text}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {template.components?.some((c: any) => c.type === 'HEADER' && c.format === 'IMAGE') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <i className="fas fa-image mr-1"></i>
                          Imagen
                        </span>
                      )}
                      {template.components?.some((c: any) => c.type === 'BUTTONS') && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <i className="fas fa-hand-pointer mr-1"></i>
                          Botones
                        </span>
                      )}
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 dark:text-gray-500"></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <i className="fas fa-file-alt text-white/60 text-4xl mb-3"></i>
              <p className="text-white text-lg font-medium mb-1">No hay plantillas disponibles</p>
              <p className="text-white/80 text-sm mb-4">Sincroniza tus plantillas de Meta para verlas aquí</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'templates' }))}
                className="bg-white text-emerald-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-all inline-flex items-center space-x-2"
              >
                <i className="fas fa-sync-alt"></i>
                <span>Ir a Plantillas</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Analytics Section */}
      {analytics && (
        <div className="mb-8">
          {/* Analytics Header with Export Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <i className="fas fa-chart-line text-indigo-600 dark:text-indigo-400 mr-3"></i>
                  Analíticas Avanzadas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Análisis completo de rendimiento y métricas
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <i className="fas fa-file-excel"></i>
                  <span>Exportar Excel</span>
                </button>

                <button
                  onClick={() => setShowBackupModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <i className="fas fa-database"></i>
                  <span>Backup</span>
                </button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={analyticsDateStart}
                    onChange={(e) => setAnalyticsDateStart(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-600 transition-colors"
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={analyticsDateEnd}
                    onChange={(e) => setAnalyticsDateEnd(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-600 transition-colors"
                  />
                </div>

                <button
                  onClick={handleDateFilterApply}
                  disabled={!analyticsDateStart || !analyticsDateEnd}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                >
                  <i className="fas fa-filter"></i>
                  <span>Aplicar</span>
                </button>

                {(analyticsDateStart || analyticsDateEnd) && (
                  <button
                    onClick={handleDateFilterClear}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Contacts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <i className="fas fa-users"></i>
                </div>
                {analytics.kpis.contactsGrowth !== 0 && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${analytics.kpis.contactsGrowth > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {analytics.kpis.contactsGrowth > 0 ? '+' : ''}{analytics.kpis.contactsGrowth.toFixed(1)}%
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Contactos</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analytics.kpis.totalContacts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs. últimos 30 días</p>
            </div>

            {/* Messages Sent Today */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                  <i className="fas fa-paper-plane"></i>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Mensajes Hoy</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analytics.kpis.messagesSentToday}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Semana: {analytics.kpis.messagesSentWeek} | Mes: {analytics.kpis.messagesSentMonth}</p>
            </div>

            {/* Active Contacts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                  <i className="fas fa-user-check"></i>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Contactos Activos</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analytics.kpis.activeContacts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Inactivos: {analytics.kpis.inactiveContacts}</p>
            </div>

            {/* Response Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                  <i className="fas fa-chart-pie"></i>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Tasa de Respuesta</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analytics.kpis.averageResponseRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mensajes leídos</p>
            </div>
          </div>

          {/* Charts Grid - Row 1: Contact Growth & Messages by Day */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contact Growth Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <i className="fas fa-chart-line text-blue-500 mr-2"></i>
                Crecimiento de Contactos (30 días)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.contactGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-ES');
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    name="Contactos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Messages by Day Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <i className="fas fa-envelope text-green-500 mr-2"></i>
                Mensajes por Día (14 días)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.messagesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-ES');
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                  <Bar dataKey="sent" fill="#10B981" name="Enviados" />
                  <Bar dataKey="delivered" fill="#3B82F6" name="Entregados" />
                  <Bar dataKey="failed" fill="#EF4444" name="Fallidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid - Row 2: Status Distribution & Best Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status Distribution Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <i className="fas fa-chart-pie text-purple-500 mr-2"></i>
                Distribución por Estado
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Best Hours Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <i className="fas fa-clock text-indigo-500 mr-2"></i>
                Mejores Horarios de Envío
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.bestHours} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="hour"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => `${value}:00`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    labelFormatter={(value) => `${value}:00 hrs`}
                  />
                  <Bar dataKey="count" fill="#6366F1" name="Mensajes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid - Row 3: Best Days */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <i className="fas fa-calendar-alt text-teal-500 mr-2"></i>
                Mejores Días de la Semana
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.bestDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="count" fill="#14B8A6" name="Mensajes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tables Grid - Row 4: Template Performance & Top Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Performance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <i className="fas fa-file-alt text-emerald-500 mr-2"></i>
                Rendimiento de Plantillas (Top 10)
              </h3>
              <div className="overflow-x-auto">
                {analytics.templatePerformance.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Plantilla</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300">Enviados</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300">Entregados</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300">Leídos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {analytics.templatePerformance.slice(0, 5).map((template, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-medium truncate max-w-[150px]">{template.name}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{template.sent}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{template.delivered}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{template.read}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-inbox text-3xl mb-2"></i>
                    <p className="text-sm">No hay datos de plantillas aún</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Contacts Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <i className="fas fa-user-friends text-pink-500 mr-2"></i>
                Top Contactos (Top 10)
              </h3>
              <div className="overflow-x-auto">
                {analytics.topContacts.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Nombre</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300">Mensajes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {analytics.topContacts.slice(0, 10).map((contact, index) => (
                        <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]">{contact.name}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {contact.messageCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-inbox text-3xl mb-2"></i>
                    <p className="text-sm">No hay datos de contactos aún</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meta WhatsApp Insights Stats */}
      {hasMetaConnection && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-comment-dots text-blue-600 dark:text-blue-400 mr-3"></i>
            Meta WhatsApp Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                    <i className={stat.icon}></i>
                  </div>
                </div>
                <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRM Stats */}
      {contacts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-users text-purple-600 dark:text-purple-400 mr-3"></i>
            Estadísticas CRM
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
                  <i className="fas fa-users"></i>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Contactos</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{contacts.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                  <i className="fas fa-dollar-sign"></i>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Revenue Total</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${contacts.reduce((sum, c) => sum + (c.cost || 0), 0).toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white">
                  <i className="fas fa-chart-line"></i>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Revenue Promedio</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${(contacts.length > 0 ? contacts.reduce((sum, c) => sum + (c.cost || 0), 0) / contacts.length : 0).toFixed(0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white">
                  <i className="fas fa-envelope"></i>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Mensajes Totales</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{contacts.reduce((sum, c) => sum + (c.messagesSent || 0), 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meta Charts */}
      {hasMetaConnection && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-chart-bar text-blue-600 dark:text-blue-400 mr-3"></i>
            Gráficos Meta Insights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Análisis de Mensajes</h3>
              <div className="h-64">
                <canvas ref={chartRef} className="w-full h-full"></canvas>
              </div>
            </div>

            {/* Donut Chart - Phone Quality */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Estado de la Cuenta</h3>
              {metaData?.phone_numbers && metaData.phone_numbers.length > 0 ? (
                <div className="h-64">
                  <canvas ref={donutChartRef} className="w-full h-full"></canvas>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-pie text-4xl mb-2"></i>
                    <p>No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CRM Chart Configuration Bar */}
      {contacts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6 transition-colors duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Filtros de Gráficos CRM</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Personaliza la visualización de datos</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Filters */}
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Desde</label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                  />
                </div>
                {(dateRangeStart || dateRangeEnd) && (
                  <button
                    onClick={() => {
                      setDateRangeStart('');
                      setDateRangeEnd('');
                    }}
                    className="mt-5 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
                    title="Limpiar filtros"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRM Charts */}
      {contacts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-chart-line text-purple-600 dark:text-purple-400 mr-3"></i>
            Gráficos CRM
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Mensajes por Mes</h3>
              <div className="h-64">
                <canvas ref={crmMessagesChartRef}></canvas>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Distribución por Estado</h3>
              <div className="h-64">
                <canvas ref={crmStatusChartRef}></canvas>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Revenue por Mes</h3>
              <div className="h-64">
                <canvas ref={crmRevenueChartRef}></canvas>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Business Account Info */}
      {metaData?.phone_numbers && metaData.phone_numbers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-colors duration-300">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Números de Teléfono Conectados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Calidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Límite de Mensajería
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {metaData.phone_numbers.map((phone) => (
                  <tr key={phone.phone_number} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {phone.display_phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        phone.quality_rating === 'GREEN' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        phone.quality_rating === 'YELLOW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        phone.quality_rating === 'RED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {phone.quality_rating || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
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
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Última sincronización con Meta: {new Date(localStats.lastSync).toLocaleString('es-ES')}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-6 transition-colors duration-300">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300">
            <i className="fas fa-info-circle text-blue-600 dark:text-blue-300"></i>
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Acerca de las Métricas</h3>
            <div className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
              <p>• Las métricas se obtienen directamente de la API de Meta WhatsApp Business</p>
              <p>• Los datos locales (plantillas, listas, contactos) se actualizan automáticamente</p>
              <p>• La calidad del número afecta la capacidad de envío y reputación</p>
              <p>• Sincroniza regularmente para mantener los datos actualizados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Excel Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <i className="fas fa-file-excel text-green-500 mr-3"></i>
                Exportar Analíticas a Excel
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Se generará un archivo Excel (.xlsx) con las siguientes hojas:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>KPIs principales y métricas clave</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Crecimiento de contactos (30 días)</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Mensajes por día con estados</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Distribución por estado</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Rendimiento de plantillas</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Mejores horarios y días</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Top contactos más activos</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportExcel}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <i className="fas fa-download"></i>
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup/Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <i className="fas fa-database text-blue-500 mr-3"></i>
                Backup y Restauración
              </h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Gestiona tus datos del sistema:
              </p>

              <div className="space-y-4">
                {/* Export Backup */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <i className="fas fa-cloud-download-alt text-blue-500 mr-2"></i>
                    Exportar Backup
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Descarga un archivo JSON con todos tus datos: contactos, mensajes, configuración, plantillas y eventos.
                  </p>
                  <button
                    onClick={handleExportBackup}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                  >
                    <i className="fas fa-download"></i>
                    <span>Descargar Backup</span>
                  </button>
                </div>

                {/* Import Backup */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <i className="fas fa-cloud-upload-alt text-green-500 mr-2"></i>
                    Restaurar Backup
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Importa un archivo de backup previo. ⚠️ Esto sobrescribirá todos los datos actuales.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-all flex items-center justify-center space-x-2"
                  >
                    <i className="fas fa-upload"></i>
                    <span>Seleccionar Archivo</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBackupModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
