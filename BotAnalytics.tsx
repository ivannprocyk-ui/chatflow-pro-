import { useState, useEffect } from 'react';
import { botTrackingAPI } from './src/services/api';

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
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'purple' }: any) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`text-4xl text-${color}-500`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                📊 Analytics del Bot IA
              </h1>
              <p className="text-gray-600 mt-2">
                Métricas y estadísticas de rendimiento en tiempo real
              </p>
              <p className="text-sm text-gray-500 mt-1">
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
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
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
                className="ml-2 p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
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
              <p className="text-gray-600">Cargando métricas...</p>
            </div>
          </div>
        ) : metrics ? (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Mensajes"
                value={metrics.totalMessages}
                subtitle={`${metrics.inboundMessages} recibidos / ${metrics.outboundMessages} enviados`}
                icon="💬"
                color="purple"
              />
              <StatCard
                title="Tasa de Éxito"
                value={`${metrics.successRate.toFixed(1)}%`}
                subtitle={`${metrics.botRespondedCount} respuestas exitosas`}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Tasa de Respuesta"
                value={`${metrics.responseRate.toFixed(1)}%`}
                subtitle={`${metrics.botProcessedCount} procesados por bot`}
                icon="🤖"
                color="blue"
              />
              <StatCard
                title="Conversaciones"
                value={metrics.totalConversations}
                subtitle={`${metrics.activeConversations} activas (24h)`}
                icon="👥"
                color="indigo"
              />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Rendimiento</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tiempo Promedio de Procesamiento</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatTime(metrics.avgProcessingTimeMs)}
                      </p>
                    </div>
                    <div className="text-3xl">⚙️</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tiempo Promedio de Respuesta</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatTime(metrics.avgResponseTimeMs)}
                      </p>
                    </div>
                    <div className="text-3xl">⏱️</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tiempo Máximo</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatTime(metrics.maxResponseTimeMs)}
                      </p>
                    </div>
                    <div className="text-3xl">📈</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Estado de Mensajes</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-medium text-gray-700">Exitosos</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {metrics.botRespondedCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="font-medium text-gray-700">Omitidos</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">
                      {metrics.botSkippedCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="font-medium text-gray-700">Fallidos</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {metrics.botFailedCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Type Performance */}
            {metricsByAgentType && Object.keys(metricsByAgentType).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🎭 Rendimiento por Tipo de Agente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(metricsByAgentType).map(([agentType, data]: [string, any]) => (
                    <div key={agentType} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {agentType === 'vendedor' && '🛍️ Vendedor'}
                          {agentType === 'asistente' && '👥 Asistente'}
                          {agentType === 'secretaria' && '📅 Secretaria'}
                          {agentType === 'custom' && '✏️ Personalizado'}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mensajes:</span>
                          <span className="font-medium">{data.totalMessages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Éxito:</span>
                          <span className="font-medium text-green-600">{data.successRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Procesamiento:</span>
                          <span className="font-medium text-blue-600">{formatTime(data.avgProcessingTimeMs)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Errors */}
            {metrics.errorCount > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Errores Principales</h2>
                <div className="space-y-2">
                  {metrics.topErrors.map((error, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-red-500">#{idx + 1}</span>
                        <span className="font-medium text-gray-700">{error.code}</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">{error.count} ocurrencias</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-600">
              Las métricas aparecerán aquí cuando el bot comience a procesar mensajes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
