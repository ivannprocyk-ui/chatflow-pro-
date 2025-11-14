import React, { useState, useEffect } from 'react';
import AnalyticsCard from '@/react-app/components/AnalyticsCard';
import LineChart from '@/react-app/components/charts/LineChart';
import BarChart from '@/react-app/components/charts/BarChart';
import PieChart from '@/react-app/components/charts/PieChart';
import FunnelChart from '@/react-app/components/charts/FunnelChart';
import Heatmap from '@/react-app/components/charts/Heatmap';
import {
  getOverallStats,
  getTimeSeriesData,
  getStatusDistribution,
  getFunnelData,
  getHeatmapData,
  getCampaignPerformanceComparison,
  getTopCampaigns
} from '@/react-app/utils/analyticsCalculations';

const CHART_ORDER_KEY = 'analytics_chart_order';

type ChartId = 'timeseries' | 'comparison' | 'heatmap' | 'funnel' | 'topCampaigns' | 'additionalStats';

const DEFAULT_CHART_ORDER: ChartId[] = [
  'timeseries',
  'comparison',
  'heatmap',
  'funnel',
  'topCampaigns',
  'additionalStats'
];

export default function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [campaignComparison, setCampaignComparison] = useState<any[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);
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
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    setStats(getOverallStats());
    setTimeSeriesData(getTimeSeriesData());
    setStatusDistribution(getStatusDistribution());
    setFunnelData(getFunnelData());
    setHeatmapData(getHeatmapData());
    setCampaignComparison(getCampaignPerformanceComparison());
    setTopCampaigns(getTopCampaigns(5));
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

    // Remove dragged item and insert at target position
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  const renderChart = (chartId: ChartId) => {
    const isDragging = draggedItem === chartId;
    const isOver = dragOverItem === chartId;

    const chartComponents: Record<ChartId, JSX.Element> = {
      timeseries: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <i className="fas fa-chart-line text-blue-600 mr-2"></i>
                Tendencia de Mensajes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Evolución de envíos, entregas y lecturas en el tiempo
              </p>
            </div>
          </div>
          <LineChart
            data={timeSeriesData}
            lines={[
              { dataKey: 'sent', stroke: '#3b82f6', name: 'Enviados' },
              { dataKey: 'delivered', stroke: '#10b981', name: 'Entregados' },
              { dataKey: 'read', stroke: '#8b5cf6', name: 'Leídos' },
              { dataKey: 'failed', stroke: '#ef4444', name: 'Fallidos' }
            ]}
          />
        </div>
      ),
      comparison: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <i className="fas fa-chart-bar text-green-600 mr-2"></i>
                Comparación de Campañas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Rendimiento por campaña
              </p>
            </div>
            <BarChart
              data={campaignComparison.slice(0, 5)}
              bars={[
                { dataKey: 'enviados', fill: '#3b82f6', name: 'Enviados' },
                { dataKey: 'entregados', fill: '#10b981', name: 'Entregados' },
                { dataKey: 'leídos', fill: '#8b5cf6', name: 'Leídos' }
              ]}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <i className="fas fa-chart-pie text-orange-600 mr-2"></i>
                Distribución de Estados
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Proporción de mensajes por estado
              </p>
            </div>
            <PieChart data={statusDistribution} />
          </div>
        </div>
      ),
      heatmap: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-fire text-red-600 mr-2"></i>
              Mejores Horarios para Enviar
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Mapa de calor de engagement por día y hora
            </p>
          </div>
          <Heatmap data={heatmapData} />
        </div>
      ),
      funnel: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center mb-2">
              <i className="fas fa-filter text-purple-600 mr-3"></i>
              Embudo de Conversión
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualiza cómo los contactos avanzan desde el primer contacto hasta la lectura del mensaje. Cada etapa muestra el total y el porcentaje respecto al inicio.
            </p>
          </div>
          <div className="overflow-x-auto">
            <FunnelChart data={funnelData} />
          </div>
        </div>
      ),
      topCampaigns: (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-trophy text-yellow-600 mr-2"></i>
              Top 5 Campañas con Mejor Rendimiento
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Ordenadas por tasa de conversión (lectura)
            </p>
          </div>

          <div className="space-y-4">
            {topCampaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                    'bg-gradient-to-br from-blue-400 to-blue-500'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{campaign.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(campaign.date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enviados</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{campaign.totalSent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Leídos</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{campaign.read}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Conversión</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{campaign.conversionRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      additionalStats: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 min-h-[180px] flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Tasa de Éxito</h3>
            </div>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.successRate}%</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              {(stats.totalSent - stats.totalFailed).toLocaleString()} mensajes exitosos
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-6 border border-red-200 dark:border-red-800 min-h-[180px] flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <i className="fas fa-times-circle text-xl"></i>
              </div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Mensajes Fallidos</h3>
            </div>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.totalFailed}</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              {stats.totalSent > 0 ? ((stats.totalFailed / stats.totalSent) * 100).toFixed(1) : '0'}% del total
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 min-h-[180px] flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-users text-xl"></i>
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Total Contactos</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.totalContacts.toLocaleString()}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Alcanzados en todas las campañas
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
        } ${isOver ? 'ring-4 ring-blue-400 rounded-2xl' : ''}`}
      >
        {/* Drag Handle Indicator */}
        <div className="absolute top-4 right-4 z-10 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 cursor-move hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <i className="fas fa-grip-vertical text-gray-400 dark:text-gray-500"></i>
        </div>

        {chartComponents[chartId]}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <i className="fas fa-chart-line text-blue-600 mr-3"></i>
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Análisis completo del rendimiento de tus campañas de WhatsApp
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
            onClick={loadAnalyticsData}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className="fas fa-sync-alt"></i>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Personaliza tu vista:</strong> Arrastra los gráficos usando el ícono <i className="fas fa-grip-vertical"></i> para reordenarlos según tu preferencia. El orden se guarda automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Campañas"
          value={stats.totalCampaigns}
          icon="fa-bullhorn"
          color="blue"
          subtitle="Campañas ejecutadas"
        />

        <AnalyticsCard
          title="Mensajes Enviados"
          value={stats.totalSent.toLocaleString()}
          icon="fa-paper-plane"
          color="indigo"
          subtitle={`${stats.avgMessagesPerCampaign} por campaña`}
        />

        <AnalyticsCard
          title="Tasa de Entrega"
          value={`${stats.deliveryRate}%`}
          icon="fa-check-double"
          color="green"
          subtitle={`${stats.totalDelivered.toLocaleString()} entregados`}
        />

        <AnalyticsCard
          title="Tasa de Lectura"
          value={`${stats.readRate}%`}
          icon="fa-eye"
          color="purple"
          subtitle={`${stats.totalRead.toLocaleString()} leídos`}
        />
      </div>

      {/* Dynamic Draggable Charts */}
      {chartOrder.map((chartId) => renderChart(chartId))}
    </div>
  );
}
