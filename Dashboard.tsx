import { MessageSquare, CheckCircle, Users, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Mensajes',
      value: '12,458',
      Icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Mensajes Enviados',
      value: '8,925',
      Icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      change: '+8%'
    },
    {
      title: 'Contactos',
      value: '3,542',
      Icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15%'
    },
    {
      title: 'Tasa de Éxito',
      value: '94.2%',
      Icon: PieChartIcon,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      change: '+2.1%'
    }
  ];

  const lineChartData = [
    { day: 'Lun', messages: 65 },
    { day: 'Mar', messages: 59 },
    { day: 'Mié', messages: 80 },
    { day: 'Jue', messages: 81 },
    { day: 'Vie', messages: 56 },
    { day: 'Sáb', messages: 55 },
    { day: 'Dom', messages: 40 }
  ];

  const pieChartData = [
    { name: 'Enviado', value: 45, color: '#25D366' },
    { name: 'Entregado', value: 35, color: '#128C7E' },
    { name: 'Leído', value: 15, color: '#8B5CF6' },
    { name: 'Error', value: 5, color: '#EF4444' }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'Campaña Enviada',
      details: 'Promoción Black Friday',
      contacts: 1250,
      time: 'Hace 2 horas',
      status: 'Completada',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 2,
      type: 'Lista Creada',
      details: 'Clientes Premium',
      contacts: 85,
      time: 'Hace 4 horas',
      status: 'Activa',
      statusColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 3,
      type: 'Plantilla Aprobada',
      details: 'Bienvenida Nuevos Clientes',
      contacts: 0,
      time: 'Hace 6 horas',
      status: 'Disponible',
      statusColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: 4,
      type: 'Mensaje Programado',
      details: 'Recordatorio Cita',
      contacts: 45,
      time: 'Hace 1 día',
      status: 'Pendiente',
      statusColor: 'bg-yellow-100 text-yellow-800'
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
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-green-500 text-sm font-semibold">{stat.change}</span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mensajes por Día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                stroke="#9CA3AF"
                style={{ fontSize: '14px' }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '14px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#25D366"
                strokeWidth={3}
                dot={{ fill: '#25D366', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Estado de Mensajes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${activity.statusColor}`}>
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
