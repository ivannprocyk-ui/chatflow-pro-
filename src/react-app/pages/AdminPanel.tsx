import { useState, useEffect } from 'react';
import { Alert } from '../components/ui/Alert';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  botMessagesCount: number;
  campaignsCount: number;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalBots: number;
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
}

type AdminSection = 'dashboard' | 'users' | 'settings' | 'logs';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'destructive' | 'warning' | 'info'; message: string } | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = () => {
    // Demo data
    setMetrics({
      totalUsers: 24,
      activeUsers: 18,
      totalBots: 24,
      totalMessages: 15420,
      avgResponseTime: 1250,
      successRate: 97.8,
    });

    setUsers([
      {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        role: 'admin',
        status: 'active',
        lastLogin: new Date(),
        createdAt: new Date('2024-01-15'),
        botMessagesCount: 2340,
        campaignsCount: 12,
      },
      {
        id: '2',
        name: 'María García',
        email: 'maria@example.com',
        role: 'user',
        status: 'active',
        lastLogin: new Date(Date.now() - 3600000),
        createdAt: new Date('2024-02-20'),
        botMessagesCount: 1890,
        campaignsCount: 8,
      },
      {
        id: '3',
        name: 'Carlos López',
        email: 'carlos@example.com',
        role: 'viewer',
        status: 'inactive',
        lastLogin: new Date(Date.now() - 86400000 * 7),
        createdAt: new Date('2024-03-10'),
        botMessagesCount: 450,
        campaignsCount: 3,
      },
    ]);
  };

  const showAlert = (type: 'success' | 'destructive' | 'warning' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== userId));
      showAlert('success', 'Usuario eliminado correctamente');
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
    showAlert('success', 'Estado del usuario actualizado');
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
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
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
              <i className="fas fa-robot text-xl"></i>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Bots Activos</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{metrics?.totalBots}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Todos los clientes
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
              <i className="fas fa-comments text-xl"></i>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Mensajes</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics?.totalMessages.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Últimos 30 días
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
              <i className="fas fa-clock text-xl"></i>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{(metrics?.avgResponseTime || 0) / 1000}s</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Respuesta del bot
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
              <i className="fas fa-check-circle text-xl"></i>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Éxito</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{metrics?.successRate}%</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mensajes exitosos
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-2xl p-6 border border-pink-200 dark:border-pink-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white">
              <i className="fas fa-chart-line text-xl"></i>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Crecimiento</p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">+23%</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Último mes
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <i className="fas fa-history text-blue-600 mr-2"></i>
          Actividad Reciente
        </h3>
        <div className="space-y-3">
          {[
            { user: 'Juan Pérez', action: 'creó un nuevo bot', time: 'Hace 5 minutos', icon: 'fa-robot', color: 'purple' },
            { user: 'María García', action: 'envió 250 mensajes', time: 'Hace 15 minutos', icon: 'fa-paper-plane', color: 'blue' },
            { user: 'Carlos López', action: 'inició sesión', time: 'Hace 1 hora', icon: 'fa-sign-in-alt', color: 'green' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-${activity.color}-100 dark:bg-${activity.color}-900/20 flex items-center justify-center`}>
                  <i className={`fas ${activity.icon} text-${activity.color}-600`}></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{activity.user}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gestión de Usuarios
        </h2>
        <button
          onClick={() => setShowUserModal(true)}
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actividad
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último acceso
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                      user.role === 'user' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : user.role === 'user' ? 'Usuario' : 'Visor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-200'
                      }`}
                    >
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex flex-col">
                      <span>{user.botMessagesCount.toLocaleString()} mensajes</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{user.campaignsCount} campañas</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-ES') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Configuración del Sistema
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-key text-blue-600 mr-2"></i>
            API Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limit (requests/min)
              </label>
              <input
                type="number"
                defaultValue={60}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Tokens per Request
              </label>
              <input
                type="number"
                defaultValue={4000}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-envelope text-green-600 mr-2"></i>
            Email Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SMTP Server
              </label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Email
              </label>
              <input
                type="email"
                placeholder="noreply@chatflow.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => showAlert('success', 'Configuración guardada correctamente')}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
      >
        <i className="fas fa-save mr-2"></i>
        Guardar Configuración
      </button>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Logs del Sistema
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="space-y-3">
          {[
            { level: 'info', message: 'Usuario juan@example.com inició sesión', timestamp: new Date(), icon: 'fa-info-circle', color: 'blue' },
            { level: 'success', message: 'Bot procesó 150 mensajes exitosamente', timestamp: new Date(Date.now() - 300000), icon: 'fa-check-circle', color: 'green' },
            { level: 'warning', message: 'API rate limit alcanzado para usuario maria@example.com', timestamp: new Date(Date.now() - 600000), icon: 'fa-exclamation-triangle', color: 'yellow' },
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
            Gestiona usuarios, configuraciones y monitorea el sistema
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
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
                { id: 'users', label: 'Usuarios', icon: 'fa-users' },
                { id: 'settings', label: 'Configuración', icon: 'fa-cog' },
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
            {activeSection === 'settings' && renderSettings()}
            {activeSection === 'logs' && renderLogs()}
          </div>
        </div>
      </div>
    </div>
  );
}
