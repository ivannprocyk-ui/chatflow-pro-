import { useEffect, useRef } from 'react';
import { MessageSquare, CheckCircle, Users, PieChart as PieChartIcon } from 'lucide-react';

export default function Dashboard() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let lineChartInstance: any = null;
    let donutChartInstance: any = null;

    const createCharts = () => {
      // @ts-ignore
      const Chart = window.Chart;

      if (!Chart) {
        console.log('Chart.js not loaded yet, retrying...');
        setTimeout(createCharts, 100);
        return;
      }

      // Destroy existing charts if they exist
      if (lineChartInstance) {
        lineChartInstance.destroy();
      }
      if (donutChartInstance) {
        donutChartInstance.destroy();
      }

      if (chartRef.current) {
        lineChartInstance = new Chart(chartRef.current, {
          type: 'line',
          data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
              label: 'Mensajes Enviados',
              data: [65, 59, 80, 81, 56, 55, 40],
              borderColor: '#25D366',
              backgroundColor: 'rgba(37, 211, 102, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }

      if (donutChartRef.current) {
        donutChartInstance = new Chart(donutChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Enviado', 'Entregado', 'Leído', 'Error'],
            datasets: [{
              data: [45, 35, 15, 5],
              backgroundColor: [
                '#25D366',
                '#128C7E',
                '#8B5CF6',
                '#EF4444'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    };

    // Load Chart.js if not already loaded
    // @ts-ignore
    if (window.Chart) {
      createCharts();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.async = true;
      script.onload = () => {
        console.log('Chart.js loaded successfully');
        createCharts();
      };
      script.onerror = () => {
        console.error('Failed to load Chart.js');
      };
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (lineChartInstance) {
        lineChartInstance.destroy();
      }
      if (donutChartInstance) {
        donutChartInstance.destroy();
      }
    };
  }, []);

  const stats = [
    {
      title: 'Total Mensajes',
      value: '12,458',
      Icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Mensajes Enviados',
      value: '8,925',
      Icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      change: '+8%'
    },
    {
      title: 'Contactos',
      value: '3,542',
      Icon: Users,
      color: 'from-purple-500 to-purple-600',
      change: '+15%'
    },
    {
      title: 'Tasa de Éxito',
      value: '94.2%',
      Icon: PieChartIcon,
      color: 'from-orange-500 to-orange-600',
      change: '+2.1%'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'Campaña Enviada',
      details: 'Promoción Black Friday',
      contacts: 1250,
      time: 'Hace 2 horas',
      status: 'Completada'
    },
    {
      id: 2,
      type: 'Lista Creada',
      details: 'Clientes Premium',
      contacts: 85,
      time: 'Hace 4 horas',
      status: 'Activa'
    },
    {
      id: 3,
      type: 'Plantilla Aprobada',
      details: 'Bienvenida Nuevos Clientes',
      contacts: 0,
      time: 'Hace 6 horas',
      status: 'Disponible'
    },
    {
      id: 4,
      type: 'Mensaje Programado',
      details: 'Recordatorio Cita',
      contacts: 45,
      time: 'Hace 1 día',
      status: 'Pendiente'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen general de tu plataforma WhatsApp Business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.Icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-green-500 text-sm font-medium">{stat.change}</span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mensajes por Día</h3>
          <canvas ref={chartRef} className="w-full h-64"></canvas>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Estado de Mensajes</h3>
          <canvas ref={donutChartRef} className="w-full h-64"></canvas>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contactos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.contacts > 0 ? activity.contacts : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'Completada' ? 'bg-green-100 text-green-800' :
                      activity.status === 'Activa' ? 'bg-blue-100 text-blue-800' :
                      activity.status === 'Disponible' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
