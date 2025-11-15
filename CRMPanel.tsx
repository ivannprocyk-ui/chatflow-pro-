import { useState, useEffect, useRef } from 'react';
import { loadCRMData, saveCRMData } from './storage';

interface CRMContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  messagesSent: number;
  lastInteraction: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
}

export default function CRMPanel() {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const data = loadCRMData();
    setContacts(data);
    
    // Load Chart.js and create charts
    const loadCharts = async () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.onload = () => {
        createCharts();
      };
      document.head.appendChild(script);
    };

    loadCharts();
  }, []);

  const createCharts = () => {
    // @ts-ignore
    const Chart = window.Chart;
    
    if (chartRef.current && Chart) {
      new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Mensajes por Mes',
            data: [320, 450, 380, 520, 490, 610],
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
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

    if (donutChartRef.current && Chart) {
      new Chart(donutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Completadas', 'En Progreso', 'Programadas', 'Canceladas'],
          datasets: [{
            data: [45, 25, 20, 10],
            backgroundColor: [
              '#10B981',
              '#3B82F6',
              '#F59E0B',
              '#EF4444'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  };

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      alert('Nombre y teléfono son requeridos');
      return;
    }

    const contact: CRMContact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      email: newContact.email,
      messagesSent: 0,
      lastInteraction: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const updatedContacts = [...contacts, contact];
    setContacts(updatedContacts);
    saveCRMData(updatedContacts);

    setShowModal(false);
    setNewContact({ name: '', phone: '', email: '' });
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      const updatedContacts = contacts.filter(c => c.id !== contactId);
      setContacts(updatedContacts);
      saveCRMData(updatedContacts);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Nombre', 'Teléfono', 'Email', 'Mensajes Enviados', 'Última Interacción', 'Estado'],
      ...contacts.map(contact => [
        contact.name,
        contact.phone,
        contact.email || '',
        contact.messagesSent.toString(),
        new Date(contact.lastInteraction).toLocaleDateString(),
        contact.status
      ])
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = [
    {
      title: 'Total Contactos',
      value: contacts.length.toString(),
      icon: 'fas fa-users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Mensajes Totales',
      value: contacts.reduce((sum, c) => sum + c.messagesSent, 0).toString(),
      icon: 'fas fa-envelope',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Campañas Activas',
      value: '12',
      icon: 'fas fa-bullhorn',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Tasa de Respuesta',
      value: '87.5%',
      icon: 'fas fa-chart-line',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel CRM</h1>
          <p className="text-gray-600">Gestiona tus contactos y analiza las métricas de engagement</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={exportData}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className="fas fa-download"></i>
            <span>Exportar Datos</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mensajes por Mes</h3>
          <canvas ref={chartRef} className="w-full h-64"></canvas>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Campañas por Estado</h3>
          <canvas ref={donutChartRef} className="w-full h-64"></canvas>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Contactos</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar contactos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensajes Enviados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Interacción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                      {contact.email && (
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {contact.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {contact.messagesSent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(contact.lastInteraction).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      contact.status === 'active' ? 'bg-green-100 text-green-800' :
                      contact.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {contact.status === 'active' ? 'Activo' :
                       contact.status === 'inactive' ? 'Inactivo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <i className="fas fa-eye"></i>
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
              {searchTerm ? 'No se encontraron contactos' : 'No hay contactos'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con una búsqueda diferente' : 'Añade tu primer contacto para comenzar'}
            </p>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Contacto</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddContact}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                Añadir Contacto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
