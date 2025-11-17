import { useState, useEffect } from 'react';
import { loadCampaigns, saveCampaigns } from '@/react-app/utils/storage';
import { CheckCircle, Loader2, Clock, XCircle, HelpCircle, Plus, Megaphone, Users, Send, Eye, Trash2 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  date: string;
  contacts: number;
  sent: number;
  errors: number;
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled';
  template: string;
  createdAt: string;
}

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Load campaigns from localStorage and add some sample data if empty
    let savedCampaigns = loadCampaigns();
    
    if (savedCampaigns.length === 0) {
      savedCampaigns = [
        {
          id: '1',
          name: 'Promoción Black Friday',
          date: '2024-11-01',
          contacts: 1250,
          sent: 1200,
          errors: 50,
          status: 'completed',
          template: 'black_friday_promo',
          createdAt: '2024-11-01T10:00:00Z'
        },
        {
          id: '2',
          name: 'Bienvenida Nuevos Clientes',
          date: '2024-10-28',
          contacts: 85,
          sent: 85,
          errors: 0,
          status: 'completed',
          template: 'welcome_new_customers',
          createdAt: '2024-10-28T14:30:00Z'
        },
        {
          id: '3',
          name: 'Recordatorio Citas Médicas',
          date: '2024-11-05',
          contacts: 150,
          sent: 0,
          errors: 0,
          status: 'scheduled',
          template: 'appointment_reminder',
          createdAt: '2024-11-03T09:15:00Z'
        },
        {
          id: '4',
          name: 'Encuesta de Satisfacción',
          date: '2024-10-25',
          contacts: 300,
          sent: 280,
          errors: 20,
          status: 'completed',
          template: 'satisfaction_survey',
          createdAt: '2024-10-25T16:45:00Z'
        }
      ] as Campaign[];
      saveCampaigns(savedCampaigns);
    }
    
    setCampaigns(savedCampaigns);
  }, []);

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig: any = {
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Completada', icon: CheckCircle },
      'in-progress': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'En Progreso', icon: Loader2 },
      scheduled: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Programada', icon: Clock },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Cancelada', icon: XCircle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Desconocido', icon: HelpCircle };
    const IconComponent = config.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getSuccessRate = (sent: number, contacts: number) => {
    if (contacts === 0) return 0;
    return Math.round((sent / contacts) * 100);
  };

  const handleNewCampaign = () => {
    // This would redirect to bulk messaging page
    window.dispatchEvent(new CustomEvent('navigate-to-bulk-messaging'));
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta campaña?')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
      setCampaigns(updatedCampaigns);
      saveCampaigns(updatedCampaigns);
    }
  };

  const handleViewDetails = (campaign: Campaign) => {
    alert(`Detalles de la campaña: ${campaign.name}\nPlantilla: ${campaign.template}\nContactos: ${campaign.contacts}\nEnviados: ${campaign.sent}\nErrores: ${campaign.errors}`);
  };

  const sortedAndFilteredCampaigns = campaigns
    .filter(campaign => filterStatus === 'all' || campaign.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const totalCampaigns = campaigns.length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const totalContacts = campaigns.reduce((sum, c) => sum + (c.contacts || 0), 0);
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Historial de Campañas</h1>
          <p className="text-gray-600 dark:text-gray-300">Revisa el rendimiento y resultados de tus campañas de marketing</p>
        </div>
        <button
          onClick={handleNewCampaign}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Campañas</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCampaigns}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Completadas</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedCampaigns}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Contactos</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalContacts.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
              <Send className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Mensajes Enviados</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSent.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Fecha</option>
                <option value="name">Nombre</option>
                <option value="status">Estado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="completed">Completadas</option>
                <option value="in-progress">En Progreso</option>
                <option value="scheduled">Programadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {sortedAndFilteredCampaigns.length} de {totalCampaigns} campañas
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contactos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Enviados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Errores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Éxito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedAndFilteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{campaign.name || 'Sin nombre'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{campaign.template || 'Sin plantilla'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {campaign.date ? new Date(campaign.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {(campaign.contacts || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-green-600 dark:text-green-400 font-medium">{(campaign.sent || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-red-600 dark:text-red-400 font-medium">{(campaign.errors || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 dark:bg-green-400 h-2 rounded-full"
                          style={{ width: `${getSuccessRate(campaign.sent || 0, campaign.contacts || 0)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {getSuccessRate(campaign.sent || 0, campaign.contacts || 0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(campaign)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedAndFilteredCampaigns.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600 flex items-center justify-center">
              <Megaphone className="w-20 h-20" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              {filterStatus === 'all' ? 'No hay campañas' : 'No hay campañas con ese estado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {filterStatus === 'all'
                ? 'Crea tu primera campaña para comenzar a enviar mensajes'
                : 'Intenta con un filtro diferente'}
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={handleNewCampaign}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Crear Primera Campaña
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
