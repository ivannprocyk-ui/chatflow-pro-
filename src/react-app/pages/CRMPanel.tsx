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
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredContacts.map(c => c.id));
      setSelectedContacts(allIds);
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
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
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Revenue Promedio',
      value: `$${avgRevenue.toFixed(0)}`,
      icon: 'fas fa-chart-line',
      color: 'from-purple-600 to-purple-700'
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
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
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
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
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

        {/* Selection Actions Bar */}
        {selectedContacts.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedContacts.size} contacto{selectedContacts.size !== 1 ? 's' : ''} seleccionado{selectedContacts.size !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => {/* TODO: Agregar a lista */}}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i className="fas fa-list-ul mr-1.5"></i>
                Agregar a Lista
              </button>
              <button
                onClick={() => setSelectedContacts(new Set())}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                {config.fields.filter(f => f.visible).sort((a, b) => a.order - b.order).map(field => (
                  <th key={field.name} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {field.label}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Estado
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Última Interacción
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={selectedContacts.has(contact.id) ? 'bg-gray-50' : undefined}
                >
                  <td className="relative px-7 sm:w-12 sm:px-6">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      checked={selectedContacts.has(contact.id)}
                      onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                    />
                  </td>
                  {config.fields.filter(f => f.visible).sort((a, b) => a.order - b.order).map(field => (
                    <td key={field.name} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {field.type === 'currency' ? (
                        <span className="font-semibold text-emerald-600">
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
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    {getStatusBadge(contact.status)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar<span className="sr-only">, {contact[config.fields[0]?.name]}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar<span className="sr-only">, {contact[config.fields[0]?.name]}</span>
                    </button>
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
