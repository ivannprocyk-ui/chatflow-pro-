import { useState, useEffect, useRef } from 'react';
import { loadCRMData, saveCRMData, loadCRMConfig, saveCRMConfig, CRMFieldConfig, CRMConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

export default function CRMPanel() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [config, setConfig] = useState<CRMConfig>(loadCRMConfig());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showChartConfig, setShowChartConfig] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState(config.chartConfig?.dateRangeStart || '');
  const [dateRangeEnd, setDateRangeEnd] = useState(config.chartConfig?.dateRangeEnd || '');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const costChartRef = useRef<HTMLCanvasElement>(null);
  const { showSuccess } = useToast();

  useEffect(() => {
    const data = loadCRMData();
    setContacts(data);

    // Load Chart.js and create charts
    setTimeout(() => {
      loadCharts();
    }, 100);
  }, []);

  useEffect(() => {
    // Recreate charts when contacts change or date filters change
    if (contacts.length > 0) {
      setTimeout(() => {
        createCharts();
      }, 100);
    }
  }, [contacts, config, dateRangeStart, dateRangeEnd]);

  const loadCharts = async () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
    script.onload = () => {
      createCharts();
    };
    // Check if already loaded
    // @ts-ignore
    if (window.Chart) {
      createCharts();
    } else {
      document.head.appendChild(script);
    }
  };

  const createCharts = () => {
    // @ts-ignore
    const Chart = window.Chart;
    if (!Chart) return;

    // Get filtered contacts by date range
    const filteredContacts = getFilteredContactsByDate();
    const chartColors = config.chartConfig?.colors || {
      primary: '#8B5CF6',
      secondary: '#10B981',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6'
    };

    // Clear existing charts
    if (chartRef.current) {
      const existingChart = Chart.getChart(chartRef.current);
      if (existingChart) existingChart.destroy();
    }
    if (statusChartRef.current) {
      const existingChart = Chart.getChart(statusChartRef.current);
      if (existingChart) existingChart.destroy();
    }
    if (costChartRef.current) {
      const existingChart = Chart.getChart(costChartRef.current);
      if (existingChart) existingChart.destroy();
    }

    // Messages trend chart
    if (chartRef.current && Chart) {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      const messageData = months.map(() => Math.floor(Math.random() * 200) + 300);

      new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Mensajes por Mes',
            data: messageData,
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primary + '20',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Status distribution chart
    if (statusChartRef.current && Chart && filteredContacts.length > 0) {
      const statusCounts: Record<string, number> = {};
      filteredContacts.forEach(contact => {
        const status = contact.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusConfig = config.statuses.reduce((acc, s) => {
        acc[s.name] = { label: s.label, color: s.color };
        return acc;
      }, {} as Record<string, { label: string, color: string }>);

      const colorMap: Record<string, string> = {
        green: '#10B981', blue: '#3B82F6', yellow: '#F59E0B',
        red: '#EF4444', purple: '#8B5CF6', orange: '#F97316',
        pink: '#EC4899', gray: '#6B7280'
      };

      const labels = Object.keys(statusCounts).map(k => statusConfig[k]?.label || k);
      const data = Object.values(statusCounts);
      const colors = Object.keys(statusCounts).map(k => colorMap[statusConfig[k]?.color] || '#6B7280');

      new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    // Cost/Revenue chart
    if (costChartRef.current && Chart && filteredContacts.length > 0) {
      const costByMonth: Record<string, number> = {};

      filteredContacts.forEach(contact => {
        if (contact.cost && contact.createdAt) {
          const date = new Date(contact.createdAt);
          const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
          costByMonth[monthKey] = (costByMonth[monthKey] || 0) + (contact.cost || 0);
        }
      });

      const sortedMonths = Object.keys(costByMonth).sort();
      const costData = sortedMonths.map(m => costByMonth[m]);

      new Chart(costChartRef.current, {
        type: 'bar',
        data: {
          labels: sortedMonths,
          datasets: [{
            label: 'Revenue Total',
            data: costData,
            backgroundColor: chartColors.secondary,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  };

  const initializeFormData = (contact?: any) => {
    const data: any = {};
    config.fields.forEach(field => {
      data[field.name] = contact?.[field.name] || field.defaultValue || '';
    });
    if (contact) {
      data.id = contact.id;
      data.messagesSent = contact.messagesSent || 0;
      data.lastInteraction = contact.lastInteraction;
      data.createdAt = contact.createdAt;
    }
    return data;
  };

  const getFilteredContactsByDate = () => {
    if (!dateRangeStart && !dateRangeEnd) {
      return contacts;
    }

    return contacts.filter(contact => {
      if (!contact.createdAt) return false;
      const contactDate = new Date(contact.createdAt);

      if (dateRangeStart && dateRangeEnd) {
        return contactDate >= new Date(dateRangeStart) && contactDate <= new Date(dateRangeEnd);
      } else if (dateRangeStart) {
        return contactDate >= new Date(dateRangeStart);
      } else if (dateRangeEnd) {
        return contactDate <= new Date(dateRangeEnd);
      }
      return true;
    });
  };

  const saveChartConfig = () => {
    const updatedConfig = {
      ...config,
      chartConfig: {
        ...(config.chartConfig || { colors: {} }),
        dateRangeStart,
        dateRangeEnd
      }
    };
    setConfig(updatedConfig);
    saveCRMConfig(updatedConfig);
    showSuccess('Configuración de gráficos guardada');
  };

  const handleAddOrEditContact = () => {
    // Validate required fields
    const missingFields = config.fields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);

    if (missingFields.length > 0) {
      showSuccess(`⚠️ Campos requeridos: ${missingFields.join(', ')}`);
      return;
    }

    let updatedContacts;

    if (editingContact) {
      // Edit existing
      updatedContacts = contacts.map(c =>
        c.id === editingContact.id ? { ...formData, id: editingContact.id } : c
      );
    } else {
      // Add new
      const newContact = {
        ...formData,
        id: Date.now().toString(),
        messagesSent: 0,
        lastInteraction: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      updatedContacts = [...contacts, newContact];
    }

    setContacts(updatedContacts);
    saveCRMData(updatedContacts);

    setShowModal(false);
    setEditingContact(null);
    setFormData({});
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setFormData(initializeFormData(contact));
    setShowModal(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm('¿Estás seguro de eliminar este contacto?')) {
      const updatedContacts = contacts.filter(c => c.id !== contactId);
      setContacts(updatedContacts);
      saveCRMData(updatedContacts);
    }
  };

  const exportData = () => {
    const visibleFields = config.fields.filter(f => f.visible);
    const headers = visibleFields.map(f => f.label);
    const rows = filteredContacts.map(contact =>
      visibleFields.map(f => contact[f.name] || '')
    );

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = config.fields.some(field => {
      const value = contact[field.name];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusName: string) => {
    const status = config.statuses.find(s => s.name === statusName);
    if (!status) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{statusName}</span>;

    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      pink: 'bg-pink-100 text-pink-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorMap[status.color]}`}>
        {status.label}
      </span>
    );
  };

  const renderFieldInput = (field: CRMFieldConfig) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'currency':
        return (
          <div className="flex space-x-2">
            <input
              type="number"
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.name]: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.currency || field.currencyType || 'USD'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {config.currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  const totalRevenue = contacts.reduce((sum, c) => sum + (c.cost || 0), 0);
  const avgRevenue = contacts.length > 0 ? totalRevenue / contacts.length : 0;

  const stats = [
    {
      title: 'Total Contactos',
      value: contacts.length.toString(),
      icon: 'fas fa-users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Revenue Total',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: 'fas fa-dollar-sign',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Revenue Promedio',
      value: `$${avgRevenue.toFixed(0)}`,
      icon: 'fas fa-chart-line',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Mensajes Totales',
      value: contacts.reduce((sum, c) => sum + (c.messagesSent || 0), 0).toString(),
      icon: 'fas fa-envelope',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel CRM</h1>
          <p className="text-gray-600">Gestiona tus contactos con campos personalizables</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={exportData}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className="fas fa-download"></i>
            <span>Exportar</span>
          </button>
          <button
            onClick={() => {
              setEditingContact(null);
              setFormData(initializeFormData());
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Añadir Contacto</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                <i className={stat.icon}></i>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Chart Configuration Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Gráficos y Análisis</h3>
            <p className="text-sm text-gray-600">Filtra y personaliza la visualización de datos</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range Filters */}
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Desde</label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(dateRangeStart || dateRangeEnd) && (
                <button
                  onClick={() => {
                    setDateRangeStart('');
                    setDateRangeEnd('');
                  }}
                  className="mt-5 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
                  title="Limpiar filtros"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* Save & Config Buttons */}
            <div className="flex gap-2">
              <button
                onClick={saveChartConfig}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition shadow-lg"
              >
                <i className="fas fa-save mr-2"></i>
                Guardar
              </button>
              <button
                onClick={() => setShowChartConfig(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition shadow-lg"
              >
                <i className="fas fa-palette mr-2"></i>
                Colores
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mensajes por Mes</h3>
          <div className="h-64">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Distribución por Estado</h3>
          <div className="h-64">
            <canvas ref={statusChartRef}></canvas>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Revenue por Mes</h3>
          <div className="h-64">
            <canvas ref={costChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h3 className="text-xl font-semibold text-gray-900">Contactos</h3>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar contactos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                {config.statuses.map(status => (
                  <option key={status.name} value={status.name}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {config.fields.filter(f => f.visible).sort((a, b) => a.order - b.order).map(field => (
                  <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Interacción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                  {config.fields.filter(f => f.visible).sort((a, b) => a.order - b.order).map(field => (
                    <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {field.type === 'currency' ? (
                        <span className="font-semibold text-green-600">
                          ${contact[field.name]?.toLocaleString()} {contact.currency || 'USD'}
                        </span>
                      ) : field.type === 'textarea' ? (
                        <div className="max-w-xs truncate">{contact[field.name] || '-'}</div>
                      ) : field.type === 'date' && contact[field.name] ? (
                        new Date(contact[field.name]).toLocaleDateString()
                      ) : (
                        contact[field.name] || '-'
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(contact.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-900"
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

        {filteredContacts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <i className="fas fa-users text-8xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No se encontraron contactos' : 'No hay contactos'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' ? 'Intenta ajustar los filtros' : 'Añade tu primer contacto para comenzar'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.fields.filter(f => f.visible).map(field => (
                  <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar estado...</option>
                    {config.statuses.map(status => (
                      <option key={status.name} value={status.name}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingContact(null);
                  setFormData({});
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOrEditContact}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                {editingContact ? 'Actualizar' : 'Añadir'} Contacto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
