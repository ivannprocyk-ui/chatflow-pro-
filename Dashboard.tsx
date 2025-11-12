import {
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
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
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function Dashboard() {
  // Data for line chart
  const messageData = [
    { day: 'Lun', messages: 65 },
    { day: 'Mar', messages: 59 },
    { day: 'Mié', messages: 80 },
    { day: 'Jue', messages: 81 },
    { day: 'Vie', messages: 56 },
    { day: 'Sáb', messages: 55 },
    { day: 'Dom', messages: 40 },
  ];

  // Data for pie chart
  const statusData = [
    { name: 'Enviado', value: 45, color: '#25D366' },
    { name: 'Entregado', value: 35, color: '#128C7E' },
    { name: 'Leído', value: 15, color: '#8B5CF6' },
    { name: 'Error', value: 5, color: '#EF4444' },
  ];

  const stats = [
    {
      title: 'Total Mensajes',
      value: '12,458',
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Mensajes Enviados',
      value: '8,925',
      icon: Send,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Contactos',
      value: '3,542',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Tasa de Éxito',
      value: '94.2%',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      change: '+2.1%',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'Campaña Enviada',
      details: 'Promoción Black Friday',
      contacts: 1250,
      time: 'Hace 2 horas',
      status: 'Completada',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 2,
      type: 'Lista Creada',
      details: 'Clientes Premium',
      contacts: 85,
      time: 'Hace 4 horas',
      status: 'Activa',
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'Plantilla Aprobada',
      details: 'Bienvenida Nuevos Clientes',
      contacts: 0,
      time: 'Hace 6 horas',
      status: 'Disponible',
      icon: CheckCircle,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 4,
      type: 'Mensaje Programado',
      details: 'Recordatorio Cita',
      contacts: 45,
      time: 'Hace 1 día',
      status: 'Pendiente',
      icon: Clock,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen general de tu plataforma WhatsApp Business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
                <span className="text-green-600 text-sm font-semibold bg-green-50 px-2 py-1 rounded-lg">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mensajes por Día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#25D366"
                strokeWidth={3}
                dot={{ fill: '#25D366', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Estado de Mensajes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {activity.type}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.details}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 ml-4">
                  {activity.contacts > 0 && (
                    <div className="text-center hidden sm:block">
                      <p className="text-sm font-semibold text-gray-900">{activity.contacts}</p>
                      <p className="text-xs text-gray-500">Contactos</p>
                    </div>
                  )}
                  <div className="text-right hidden md:block">
                    <p className="text-sm text-gray-600">{activity.time}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    activity.status === 'Completada' ? 'bg-green-100 text-green-800' :
                    activity.status === 'Activa' ? 'bg-blue-100 text-blue-800' :
                    activity.status === 'Disponible' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
