import { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Flame,
  PieChart as PieChartIcon,
  HelpCircle,
  UserCog,
  Zap,
  Reply,
  ListChecks,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { botTrackingAPI } from '@/react-app/services/api';
import LineChart from '@/react-app/components/charts/LineChart';
import BarChart from '@/react-app/components/charts/BarChart';
import PieChart from '@/react-app/components/charts/PieChart';
import Heatmap from '@/react-app/components/charts/Heatmap';
import AnalyticsCard from '@/react-app/components/AnalyticsCard';

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

export default function BotAnalytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [metricsByAgentType, setMetricsByAgentType] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Demo data for time series (evolución temporal)
  const [timeSeriesData] = useState([
    { date: 'Lun', messages: 187, responses: 178, avgTime: 1.2 },
    { date: 'Mar', messages: 234, responses: 221, avgTime: 1.4 },
    { date: 'Mié', messages: 198, responses: 189, avgTime: 1.1 },
    { date: 'Jue', messages: 276, responses: 264, avgTime: 1.5 },
    { date: 'Vie', messages: 245, responses: 235, avgTime: 1.3 },
    { date: 'Sáb', messages: 89, responses: 84, avgTime: 0.9 },
    { date: 'Dom', messages: 67, responses: 63, avgTime: 0.8 },
  ]);

  // Demo data for hourly heatmap (mejor horario de actividad)
  const [heatmapData] = useState([
    { day: 'Dom', hours: [2,1,1,0,0,0,1,3,8,12,15,18,16,14,12,9,7,5,4,3,3,2,2,1] },
    { day: 'Lun', hours: [1,0,0,0,0,1,4,12,24,35,42,45,38,41,39,34,28,22,16,12,8,5,3,2] },
    { day: 'Mar', hours: [1,1,0,0,0,2,5,15,28,38,48,52,44,47,43,37,31,25,18,13,9,6,4,2] },
    { day: 'Mié', hours: [1,0,0,0,0,1,4,14,26,36,44,49,42,45,41,35,29,23,17,12,8,5,3,2] },
    { day: 'Jue', hours: [2,1,0,0,0,2,6,16,30,41,51,56,48,51,47,40,33,27,20,14,10,7,4,3] },
    { day: 'Vie', hours: [1,1,0,0,0,2,5,13,25,37,46,50,43,46,42,36,30,24,18,13,9,6,4,2] },
    { day: 'Sáb', hours: [2,1,1,0,0,0,2,6,14,19,22,24,21,19,16,13,10,8,6,4,3,2,2,1] },
  ]);

  // Demo data for conversation status distribution
  const [conversationStatusData] = useState([
    { name: 'Resueltas', value: 89, fill: '#10b981' },
    { name: 'En Curso', value: 42, fill: '#3b82f6' },
    { name: 'Pendientes', value: 18, fill: '#f59e0b' },
    { name: 'Abandonadas', value: 7, fill: '#ef4444' },
  ]);

  // Demo data for query types
  const [queryTypesData] = useState([
    { type: 'Información', count: 245, fill: '#8b5cf6' },
    { type: 'Soporte', count: 189, fill: '#3b82f6' },
    { type: 'Ventas', count: 167, fill: '#10b981' },
    { type: 'Reclamos', count: 78, fill: '#ef4444' },
    { type: 'Otros', count: 45, fill: '#6b7280' },
  ]);

  useEffect(() => {
    loadMetrics();
    // Auto-refresh every 30 seconds
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
      // Si no hay backend, usar datos demo
      setMetrics({
        organizationId: 'demo-org',
        period,
        totalMessages: 1247,
        inboundMessages: 823,
        outboundMessages: 424,
        botProcessedCount: 687,
        botRespondedCount: 652,
        botSkippedCount: 28,
        botFailedCount: 7,
        successRate: 94.9,
        responseRate: 83.5,
        avgProcessingTimeMs: 234,
        avgResponseTimeMs: 1450,
        maxProcessingTimeMs: 3200,
        maxResponseTimeMs: 5800,
        totalConversations: 156,
        activeConversations: 42,
        errorCount: 7,
        topErrors: [
          { code: 'TIMEOUT_ERROR', count: 3 },
          { code: 'API_RATE_LIMIT', count: 2 },
          { code: 'INVALID_FORMAT', count: 2 },
        ],
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        generatedAt: new Date(),
      });
      setMetricsByAgentType({
        vendedor: {
          totalMessages: 456,
          successRate: 96.3,
          avgProcessingTimeMs: 198,
        },
        asistente: {
          totalMessages: 523,
          successRate: 93.8,
          avgProcessingTimeMs: 267,
        },
        secretaria: {
          totalMessages: 268,
          successRate: 94.4,
          avgProcessingTimeMs: 223,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent flex items-center">
              <Brain className="text-purple-600 dark:text-purple-400 mr-3" size={28} />
              Analytics Bot IA
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Métricas y rendimiento del bot inteligente en tiempo real
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {['day', 'week', 'month', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {p === 'day' && '24h'}
                {p === 'week' && '7d'}
                {p === 'month' && '30d'}
                {p === 'all' && 'Todo'}
              </button>
            ))}
            <button
              onClick={loadMetrics}
              disabled={isLoading}
              className="ml-2 p-2 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="Refrescar"
            >
              <span className={`${isLoading ? 'animate-spin' : ''}`}>🔄</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && !metrics ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600 dark:text-gray-300">Cargando métricas...</p>
          </div>
        </div>
      ) : metrics ? (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Total Mensajes"
              value={metrics.totalMessages}
              icon="fa-comments"
              color="purple"
              subtitle={`${metrics.inboundMessages} recibidos / ${metrics.outboundMessages} enviados`}
            />
            <AnalyticsCard
              title="Tasa de Éxito"
              value={`${metrics.successRate.toFixed(1)}%`}
              icon="fa-check-circle"
              color="green"
              subtitle={`${metrics.botRespondedCount} respuestas exitosas`}
            />
            <AnalyticsCard
              title="Tiempo Respuesta"
              value={formatTime(metrics.avgResponseTimeMs)}
              icon="fa-clock"
              color="blue"
              subtitle={`Procesamiento: ${formatTime(metrics.avgProcessingTimeMs)}`}
            />
            <AnalyticsCard
              title="Conversaciones"
              value={metrics.totalConversations}
              icon="fa-users"
              color="indigo"
              subtitle={`${metrics.activeConversations} activas ahora`}
            />
          </div>

          {/* Time Series - Evolución Temporal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <TrendingUp className="text-purple-600 dark:text-purple-400 mr-2" size={20} />
                Evolución de Mensajes del Bot
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Actividad del bot en los últimos 7 días
              </p>
            </div>
            <LineChart
              data={timeSeriesData}
              lines={[
                { dataKey: 'messages', stroke: '#8b5cf6', name: 'Mensajes' },
                { dataKey: 'responses', stroke: '#10b981', name: 'Respuestas' },
              ]}
            />
          </div>

          {/* Heatmap - Mejores Horarios */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Flame className="text-red-600 dark:text-red-400 mr-2" size={20} />
                Actividad del Bot por Horario
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Mapa de calor: volumen de conversaciones por día y hora
              </p>
            </div>
            <Heatmap data={heatmapData} />
          </div>

          {/* Charts Row - Status & Query Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <PieChartIcon className="text-blue-600 dark:text-blue-400 mr-2" size={20} />
                  Estado de Conversaciones
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Distribución por estado de resolución
                </p>
              </div>
              <PieChart data={conversationStatusData} />
            </div>

            {/* Query Types */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <HelpCircle className="text-purple-600 dark:text-purple-400 mr-2" size={20} />
                  Tipos de Consultas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Categorización automática de consultas
                </p>
              </div>
              <PieChart data={queryTypesData} />
            </div>
          </div>

          {/* Agent Type Performance Comparison */}
          {metricsByAgentType && Object.keys(metricsByAgentType).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <UserCog className="text-indigo-600 dark:text-indigo-400 mr-2" size={20} />
                  Comparación por Tipo de Agente
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Rendimiento según configuración del bot
                </p>
              </div>
              <BarChart
                data={Object.entries(metricsByAgentType).map(([type, data]: [string, any]) => ({
                  name: type === 'vendedor' ? 'Vendedor' : type === 'asistente' ? 'Asistente' : type === 'secretaria' ? 'Secretaria' : 'Personalizado',
                  mensajes: data.totalMessages,
                  exito: Math.round(data.totalMessages * data.successRate / 100),
                  tiempo: data.avgProcessingTimeMs,
                }))}
                bars={[
                  { dataKey: 'mensajes', fill: '#8b5cf6', name: 'Total Mensajes' },
                  { dataKey: 'exito', fill: '#10b981', name: 'Exitosos' },
                ]}
              />
            </div>
          )}

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                  <Zap size={20} />
                </div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Procesamiento IA</h3>
              </div>
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{formatTime(metrics.avgProcessingTimeMs)}</p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                Tiempo promedio de análisis por mensaje
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <Reply size={20} />
                </div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Tasa Respuesta</h3>
              </div>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{metrics.responseRate.toFixed(1)}%</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                {metrics.botProcessedCount} de {metrics.inboundMessages} mensajes procesados
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">Eficiencia</h3>
              </div>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">{metrics.successRate.toFixed(1)}%</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                {metrics.botRespondedCount} respuestas exitosas
              </p>
            </div>
          </div>

          {/* Message Status Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <ListChecks className="text-blue-600 dark:text-blue-400 mr-2" size={20} />
              Desglose de Estados
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Exitosos</span>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {metrics.botRespondedCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Omitidos</span>
                </div>
                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {metrics.botSkippedCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Fallidos</span>
                </div>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {metrics.botFailedCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Procesados</span>
                </div>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {metrics.botProcessedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Top Errors */}
          {metrics.errorCount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <AlertTriangle className="text-red-600 dark:text-red-400 mr-2" size={20} />
                Errores Principales
              </h2>
              <div className="space-y-2">
                {metrics.topErrors.map((error, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-500">#{idx + 1}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{error.code}</span>
                    </div>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{error.count} ocurrencias</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Las métricas aparecerán aquí cuando el bot comience a procesar mensajes
          </p>
        </div>
      )}
    </div>
  );
}
