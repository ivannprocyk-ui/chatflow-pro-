import { useState, useEffect } from 'react';
import { Alert } from '../components/ui/Alert';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'paused';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  lastLogin?: Date;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
  botMessagesCount: number;
  campaignsCount: number;
  monthlyLimit: number;
  usedMessages: number;
  apiKey?: string;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalBots: number;
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
}

type AdminSection = 'dashboard' | 'users' | 'logs';

const DEMO_USERS: User[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'admin',
    status: 'active',
    plan: 'enterprise',
    lastLogin: new Date(),
    createdAt: new Date('2024-01-15'),
    startDate: new Date('2024-01-15'),
    endDate: new Date('2025-01-15'),
    botMessagesCount: 2340,
    campaignsCount: 12,
    monthlyLimit: 10000,
    usedMessages: 2340,
    apiKey: 'sk_test_1234567890',
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@example.com',
    role: 'user',
    status: 'active',
    plan: 'pro',
    lastLogin: new Date(Date.now() - 3600000),
    createdAt: new Date('2024-02-20'),
    startDate: new Date('2024-02-20'),
    endDate: new Date('2025-02-20'),
    botMessagesCount: 1890,
    campaignsCount: 8,
    monthlyLimit: 5000,
    usedMessages: 1890,
    apiKey: 'sk_test_0987654321',
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos@example.com',
    role: 'user',
    status: 'paused',
    plan: 'basic',
    lastLogin: new Date(Date.now() - 86400000 * 7),
    createdAt: new Date('2024-03-10'),
    startDate: new Date('2024-03-10'),
    endDate: new Date('2025-03-10'),
    botMessagesCount: 450,
    campaignsCount: 3,
    monthlyLimit: 1000,
    usedMessages: 450,
  },
];

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'destructive' | 'warning' | 'info'; message: string } | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    loadMetrics();
  }, [users]);

  const loadMetrics = () => {
    setMetrics({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalBots: users.length,
      totalMessages: users.reduce((sum, u) => sum + u.botMessagesCount, 0),
      avgResponseTime: 1250,
      successRate: 97.8,
    });
  };

  const showAlert = (type: 'success' | 'destructive' | 'warning' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      plan: 'basic',
      monthlyLimit: 1000,
      usedMessages: 0,
      botMessagesCount: 0,
      campaignsCount: 0,
      createdAt: new Date(),
      startDate: new Date(),
    });
    setShowUserModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData(user);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!formData.name || !formData.email) {
      showAlert('destructive', 'Nombre y email son obligatorios');
      return;
    }

    if (editingUser) {
      // Edit existing user
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u));
      showAlert('success', `Usuario ${formData.name} actualizado correctamente`);
    } else {
      // Create new user
      const newUser: User = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date(),
        startDate: new Date(),
      } as User;
      setUsers([...users, newUser]);
      showAlert('success', `Usuario ${formData.name} creado correctamente`);
    }

    setShowUserModal(false);
    setFormData({});
    setEditingUser(null);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
      setUsers(users.filter(u => u.id !== user.id));
      showAlert('success', `Usuario ${user.name} eliminado correctamente`);
    }
  };

  const handleToggleStatus = (userId: string, newStatus: 'active' | 'inactive' | 'paused') => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, status: newStatus } : u
    ));
    showAlert('success', 'Estado del usuario actualizado');
  };

  const getChartData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        usuarios: users.length - Math.floor(Math.random() * 3),
        mensajes: Math.floor(Math.random() * 500) + 200,
        bots: users.filter(u => u.status === 'active').length,
      });
    }
    return last7Days;
  };

  const getPlanDistribution = () => {
    const planCounts = users.reduce((acc, user) => {
      acc[user.plan] = (acc[user.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(planCounts).map(([plan, count]) => ({
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      value: count,
      color:
        plan === 'enterprise' ? '#8b5cf6' :
        plan === 'pro' ? '#3b82f6' :
        plan === 'basic' ? '#10b981' :
        '#6b7280'
    }));
  };

  const renderDashboard = () => {
    const chartData = getChartData();
    const planData = getPlanDistribution();

    return (
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-users text-xl"></i>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics?.totalUsers}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400 font-semibold">{metrics?.activeUsers} activos</span>
              {' • '}
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                {users.filter(u => u.status === 'paused').length} pausados
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <i className="fas fa-comments text-xl"></i>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Mensajes</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{metrics?.totalMessages.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Últimos 30 días
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Éxito</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics?.successRate}%</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Promedio general
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-line text-blue-600 mr-2"></i>
              Actividad de los Últimos 7 Días
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="mensajes" stroke="#8b5cf6" name="Mensajes" strokeWidth={3} />
                <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" name="Usuarios" strokeWidth={3} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-bar text-green-600 mr-2"></i>
              Distribución de Planes
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={planData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" name="Usuarios" radius={[8, 8, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gestión de Usuarios ({users.length})
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nuevo Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Uso</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fechas</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                      user.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                      user.plan === 'basic' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) => handleToggleStatus(user.id, e.target.value as any)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border-0 ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : user.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}
                    >
                      <option value="active">Activo</option>
                      <option value="paused">Pausado</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col">
                      <div className="text-gray-900 dark:text-gray-100">
                        {user.usedMessages.toLocaleString()} / {user.monthlyLimit.toLocaleString()}
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            (user.usedMessages / user.monthlyLimit) > 0.9 ? 'bg-red-500' :
                            (user.usedMessages / user.monthlyLimit) > 0.7 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((user.usedMessages / user.monthlyLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>Inicio: {new Date(user.startDate).toLocaleDateString('es-ES')}</span>
                      {user.endDate && (
                        <span>Fin: {new Date(user.endDate).toLocaleDateString('es-ES')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Logs del Sistema</h2>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="space-y-3">
          {[
            { level: 'info', message: `Usuario ${users[0]?.name} inició sesión`, timestamp: new Date(), icon: 'fa-info-circle', color: 'blue' },
            { level: 'success', message: 'Bot procesó 150 mensajes exitosamente', timestamp: new Date(Date.now() - 300000), icon: 'fa-check-circle', color: 'green' },
            { level: 'warning', message: `Usuario ${users[1]?.name} alcanzó 80% del límite mensual`, timestamp: new Date(Date.now() - 600000), icon: 'fa-exclamation-triangle', color: 'yellow' },
            { level: 'error', message: 'Error al conectar con ChatWoot API', timestamp: new Date(Date.now() - 900000), icon: 'fa-times-circle', color: 'red' },
          ].map((log, idx) => (
            <div key={idx} className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${
              log.level === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
              log.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
              log.level === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
              'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
            }`}>
              <i className={`fas ${log.icon} text-${log.color}-600 mt-1`}></i>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {log.timestamp.toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <i className="fas fa-shield-alt text-blue-600 mr-3"></i>
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona usuarios, monitorea métricas y configura el sistema
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <div className="mb-6">
            <Alert
              variant={alert.type}
              description={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
                { id: 'users', label: 'Usuarios', icon: 'fa-users' },
                { id: 'logs', label: 'Logs', icon: 'fa-file-alt' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as AdminSection)}
                  className={`
                    py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors
                    ${activeSection === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeSection === 'dashboard' && renderDashboard()}
            {activeSection === 'users' && renderUsers()}
            {activeSection === 'logs' && renderLogs()}
          </div>
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Juan Pérez"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="juan@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rol
                    </label>
                    <select
                      value={formData.role || 'user'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="admin">Administrador</option>
                      <option value="user">Usuario</option>
                      <option value="viewer">Visor</option>
                    </select>
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plan
                    </label>
                    <select
                      value={formData.plan || 'basic'}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Monthly Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Límite Mensual
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyLimit || 1000}
                      onChange={(e) => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="active">Activo</option>
                      <option value="paused">Pausado</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
