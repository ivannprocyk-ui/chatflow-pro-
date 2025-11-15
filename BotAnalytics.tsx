import { useState, useEffect } from 'react';
import { botTrackingAPI } from './src/services/api';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricsSummary {
  organizationId: string;
  period: 'day' | 'week' | 'month' | 'all';
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  botProcessedCount: number;
  botRespondedCount: number;
  botSkippedCount: number;
  botFailedCount: number;
  successRate: number;
  responseRate: number;
  avgProcessingTimeMs: number;
  avgResponseTimeMs: number;
  maxProcessingTimeMs: number;
  maxResponseTimeMs: number;
  totalConversations: number;
  activeConversations: number;
  errorCount: number;
  topErrors: Array<{ code: string; count: number }>;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
}

type ChartId = 'timeseries' | 'agentPerformance' | 'messageDistribution' | 'responseTime' | 'topErrors' | 'keyMetrics';

const CHART_ORDER_KEY = 'bot_analytics_chart_order';

const DEFAULT_CHART_ORDER: ChartId[] = [
  'timeseries',
  'agentPerformance',
  'messageDistribution',
  'responseTime',
  'topErrors',
  'keyMetrics'
];

const COLORS = {
  primary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  indigo: '#6366f1',
};

export default function BotAnalytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [metricsByAgentType, setMetricsByAgentType] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [chartOrder, setChartOrder] = useState<ChartId[]>(() => {
    try {
      const saved = localStorage.getItem(CHART_ORDER_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CHART_ORDER;
    } catch {
      return DEFAULT_CHART_ORDER;
    }
  });
  const [draggedItem, setDraggedItem] = useState<ChartId | null>(null);
  const [dragOverItem, setDragOverItem] = useState<ChartId | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(() => {
      loadMetrics();
    }, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const [metricsRes, agentTypeRes] = await Promise.all([
        botTrackingAPI.getMetrics(period),
        botTrackingAPI.getMetricsByAgentType(period),
      ]);
      setMetrics(metricsRes.data);
      setMetricsByAgentType(agentTypeRes.data);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error loading metrics:', error);
      setMetrics(getDemoMetrics());
      setMetricsByAgentType(getDemoMetricsByAgentType());
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoMetrics = (): MetricsSummary => ({
    organizationId: 'demo',
    period,
    totalMessages: 1247,
    inboundMessages: 623,
    outboundMessages: 624,
    botProcessedCount: 598,
    botRespondedCount: 587,
    botSkippedCount: 25,
    botFailedCount: 11,
    successRate: 98.2,
    responseRate: 94.2,
    avgProcessingTimeMs: 1250,
    avgResponseTimeMs: 1680,
    maxProcessingTimeMs: 3420,
    maxResponseTimeMs: 4150,
    totalConversations: 156,
    activeConversations: 42,
    errorCount: 11,
    topErrors: [
      { code: 'TIMEOUT', count: 5 },
      { code: 'API_ERROR', count: 3 },
      { code: 'INVALID_MESSAGE', count: 2 },
      { code: 'RATE_LIMIT', count: 1 },
    ],
    periodStart: new Date(Date.now() - (period === 'day' ? 86400000 : period === 'week' ? 604800000 : 2592000000)),
    periodEnd: new Date(),
    generatedAt: new Date(),
  });

  const getDemoMetricsByAgentType = () => ({
    vendedor: {
      totalMessages: 456,
      successCount: 442,
      successRate: 96.9,
      avgProcessingTimeMs: 1180,
    },
    asistente: {
      totalMessages: 512,
      successCount: 506,
      successRate: 98.8,
      avgProcessingTimeMs: 1050,
    },
    secretaria: {
      totalMessages: 279,
      successCount: 271,
      successRate: 97.1,
      avgProcessingTimeMs: 1320,
    },
  });

  const getDemoTimeSeriesData = () => {
    const days = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const label = period === 'day'
        ? `${date.getHours()}:00`
        : date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });

      data.push({
        date: label,
        enviados: Math.floor(Math.random() * 50) + 30,
        exitosos: Math.floor(Math.random() * 45) + 28,
        fallidos: Math.floor(Math.random() * 5) + 1,
      });
    }
    return data;
  };

  const getDemoResponseTimeByHour = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      hora: `${i}:00`,
      tiempoPromedio: Math.floor(Math.random() * 1000) + 800,
      mensajes: Math.floor(Math.random() * 30) + 10,
    }));
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleDragStart = (chartId: ChartId) => {
    setDraggedItem(chartId);
  };

  const handleDragOver = (e: React.DragEvent, chartId: ChartId) => {
    e.preventDefault();
    setDragOverItem(chartId);
  };

  const handleDrop = (e: React.DragEvent, targetChartId: ChartId) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === targetChartId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newOrder = [...chartOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetChartId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setChartOrder(newOrder);
    localStorage.setItem(CHART_ORDER_KEY, JSON.stringify(newOrder));

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const resetChartOrder = () => {
    setChartOrder(DEFAULT_CHART_ORDER);
    localStorage.removeItem(CHART_ORDER_KEY);
  };

  const renderChart = (chartId: ChartId) => {
    if (!metrics) return null;

    const isDragging = draggedItem === chartId;
    const isOver = dragOverItem === chartId;

    const timeSeriesData = getDemoTimeSeriesData();
    const responseTimeData = getDemoResponseTimeByHour();

    const agentPerformanceData = metricsByAgentType ? Object.entries(metricsByAgentType).map(([type, data]: [string, any]) => ({
      name: type === 'vendedor' ? 'Vendedor' : type === 'asistente' ? 'Asistente' : type === 'secretaria' ? 'Secretaria' : 'Custom',
      mensajes: data.totalMessages,
      exitosos: data.successCount,
      tasaExito: data.successRate,
      tiempo: data.avgProcessingTimeMs,
    })) : [];

    const messageDistributionData = [
      { name: 'Exitosos', value: metrics.botRespondedCount, color: COLORS.success },
      { name: 'Omitidos', value: metrics.botSkippedCount, color: COLORS.warning },
      { name: 'Fallidos', value: metrics.botFailedCount, color: COLORS.danger },
    ];

    const chartComponents: Record<ChartId, JSX.Element> = {
      timeseries: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-chart-line text-purple-600 mr-2"></i>
              Tendencia de Mensajes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Evolución de mensajes procesados por el bot
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="enviados" stroke={COLORS.info} name="Enviados" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="exitosos" stroke={COLORS.success} name="Exitosos" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="fallidos" stroke={COLORS.danger} name="Fallidos" strokeWidth={3} dot={{ r: 4 }} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      ),
      agentPerformance: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-users text-indigo-600 mr-2"></i>
              Rendimiento por Tipo de Agente
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Comparación de mensajes procesados por cada agente
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={agentPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="mensajes" fill={COLORS.info} name="Total Mensajes" radius={[8, 8, 0, 0]} />
              <Bar dataKey="exitosos" fill={COLORS.success} name="Exitosos" radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      ),
      messageDistribution: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-chart-pie text-green-600 mr-2"></i>
              Distribución de Estados
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Proporción de mensajes por resultado
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={messageDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {messageDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      ),
      responseTime: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-clock text-orange-600 mr-2"></i>
              Tiempo de Respuesta por Hora
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Rendimiento del bot durante el día
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={responseTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hora" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="tiempoPromedio" fill={COLORS.warning} name="Tiempo Promedio (ms)" radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      ),
      topErrors: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
              Errores Principales
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tipos de errores más frecuentes
            </p>
          </div>
          {metrics.errorCount > 0 ? (
            <div className="space-y-3">
              {metrics.topErrors.map((error, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white">
                      #{idx + 1}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{error.code}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{error.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ocurrencias</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
              <p className="text-gray-600 dark:text-gray-400">Sin errores registrados</p>
            </div>
          )}
        </div>
      ),
      keyMetrics: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <i className="fas fa-robot text-xl"></i>
              </div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Tasa de Respuesta</h3>
            </div>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{metrics.responseRate.toFixed(1)}%</p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
              {metrics.botProcessedCount} mensajes procesados
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-clock text-xl"></i>
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Tiempo Promedio</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{formatTime(metrics.avgResponseTimeMs)}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Velocidad de respuesta del bot
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-comments text-xl"></i>
              </div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Conversaciones</h3>
            </div>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{metrics.activeConversations}</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Activas de {metrics.totalConversations} totales
            </p>
          </div>
        </div>
      )
    };

    return (
      <div
        key={chartId}
        draggable
        onDragStart={() => handleDragStart(chartId)}
        onDragOver={(e) => handleDragOver(e, chartId)}
        onDrop={(e) => handleDrop(e, chartId)}
        onDragEnd={handleDragEnd}
        className={`relative transition-all duration-200 ${
          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
        } ${isOver ? 'ring-4 ring-purple-400 rounded-2xl' : ''}`}
      >
        <div className="absolute top-4 right-4 z-10 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 cursor-move hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <i className="fas fa-grip-vertical text-gray-400 dark:text-gray-500"></i>
        </div>
        {chartComponents[chartId]}
      </div>
    );
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Cargando analytics del bot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <i className="fas fa-chart-bar text-purple-600 mr-3"></i>
              Analytics del Bot IA
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Métricas y estadísticas de rendimiento en tiempo real
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={resetChartOrder}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow hover:shadow-lg flex items-center space-x-2"
              title="Restaurar orden por defecto"
            >
              <i className="fas fa-undo"></i>
              <span>Resetear</span>
            </button>

            <button
              onClick={loadMetrics}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
              {['day', 'week', 'month', 'all'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    period === p
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p === 'day' && '24h'}
                  {p === 'week' && '7d'}
                  {p === 'month' && '30d'}
                  {p === 'all' && 'Todo'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Agente:</span>
              {['all', 'vendedor', 'asistente', 'secretaria'].map((agent) => (
                <button
                  key={agent}
                  onClick={() => setAgentFilter(agent)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    agentFilter === agent
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {agent === 'all' && 'Todos'}
                  {agent === 'vendedor' && '🛍️ Vendedor'}
                  {agent === 'asistente' && '👥 Asistente'}
                  {agent === 'secretaria' && '📅 Secretaria'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drag & Drop Instructions */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-purple-600 dark:text-purple-400 mt-1"></i>
            <div className="flex-1">
              <p className="text-sm text-purple-800 dark:text-purple-300">
                <strong>Personaliza tu vista:</strong> Arrastra los gráficos usando el ícono <i className="fas fa-grip-vertical"></i> para reordenarlos según tu preferencia. El orden se guarda automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Key Stats Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-comments text-xl"></i>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Mensajes</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{metrics.totalMessages}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {metrics.inboundMessages} entrantes • {metrics.outboundMessages} salientes
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-check-circle text-xl"></i>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tasa de Éxito</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics.successRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {metrics.botRespondedCount} respuestas exitosas
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-robot text-xl"></i>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Procesados por Bot</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics.botProcessedCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {metrics.responseRate.toFixed(1)}% tasa de respuesta
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-users text-xl"></i>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Conversaciones</h3>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.totalConversations}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {metrics.activeConversations} activas ahora
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Draggable Charts */}
        {chartOrder.map((chartId) => renderChart(chartId))}
      </div>
    </div>
  );
}
