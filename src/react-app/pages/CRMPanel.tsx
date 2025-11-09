import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { loadCRMData, saveCRMData, loadCRMConfig, loadContactLists, saveContactLists, CRMFieldConfig, CRMConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

type ViewMode = 'table' | 'list' | 'cards' | 'kanban';

export default function CRMPanel() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [config, setConfig] = useState<CRMConfig>(loadCRMConfig());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [viewingContact, setViewingContact] = useState<any | null>(null);
  const [contactEvents, setContactEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('chatflow_crm_view_mode');
    return (saved as ViewMode) || 'table';
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError} = useToast();

  useEffect(() => {
    const data = loadCRMData();
    setContacts(data);
    setContactLists(loadContactLists());
  }, []);

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

  const handleAddOrEditContact = () => {
    // Validate required fields
    const missingFields = config.fields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);

    if (missingFields.length > 0) {
      showError(`Campos requeridos: ${missingFields.join(', ')}`);
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

    showSuccess(editingContact ? 'Contacto actualizado exitosamente' : 'Contacto agregado exitosamente');

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

  const handleViewContact = (contact: any) => {
    setViewingContact(contact);
    // Load calendar events for this contact
    const eventsData = localStorage.getItem('chatflow_calendar_events');
    if (eventsData) {
      try {
        const allEvents = JSON.parse(eventsData);
        // Filter events where this contact is linked (support both old and new format)
        const linkedEvents = allEvents.filter((event: any) => {
          const isLinkedOld = event.contactId === contact.id;
          const isLinkedNew = event.contactIds?.includes(contact.id);
          return isLinkedOld || isLinkedNew;
        }).map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setContactEvents(linkedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        setContactEvents([]);
      }
    } else {
      setContactEvents([]);
    }
  };

  const handleAddToList = () => {
    if (!selectedListId && !newListName.trim()) {
      showError('Selecciona una lista o crea una nueva');
      return;
    }

    if (selectedContacts.size === 0) {
      showError('No hay contactos seleccionados');
      return;
    }

    const selectedContactsData = contacts.filter(c => selectedContacts.has(c.id));

    // Find phone field (tel type or phone/telefono in name)
    const phoneField = config.fields.find(f =>
      f.type === 'tel' ||
      f.name.toLowerCase().includes('phone') ||
      f.name.toLowerCase().includes('telefono') ||
      f.name.toLowerCase().includes('tel')
    );

    // Find name fields
    const nameField = config.fields.find(f =>
      f.name.toLowerCase().includes('nombre') ||
      f.name.toLowerCase().includes('name') ||
      f.name.toLowerCase() === 'name'
    );

    const emailField = config.fields.find(f =>
      f.type === 'email' ||
      f.name.toLowerCase().includes('email') ||
      f.name.toLowerCase().includes('correo')
    );

    // Validate and transform contacts
    const contactsWithoutPhone: string[] = [];
    const transformedContacts = selectedContactsData.map(contact => {
      const phoneNumber = phoneField ? contact[phoneField.name] : '';

      if (!phoneNumber || phoneNumber.trim() === '') {
        const identifier = nameField ? contact[nameField.name] : contact.id;
        contactsWithoutPhone.push(identifier || 'Sin nombre');
      }

      return {
        phone_number: phoneNumber || '',
        first_name: nameField ? contact[nameField.name] : '',
        last_name: '',
        email: emailField ? contact[emailField.name] : ''
      };
    }).filter(c => c.phone_number.trim() !== ''); // Only include contacts with phone

    if (contactsWithoutPhone.length > 0) {
      showError(`⚠️ ${contactsWithoutPhone.length} contacto(s) sin teléfono no se agregaron: ${contactsWithoutPhone.slice(0, 3).join(', ')}${contactsWithoutPhone.length > 3 ? '...' : ''}`);
    }

    if (transformedContacts.length === 0) {
      showError('Ningún contacto seleccionado tiene número de teléfono');
      return;
    }

    let updatedLists = [...contactLists];
    let targetList: any;

    if (newListName.trim()) {
      // Create new list
      targetList = {
        id: Date.now().toString(),
        name: newListName.trim(),
        contacts: transformedContacts,
        createdAt: new Date().toISOString()
      };
      updatedLists.push(targetList);
    } else {
      // Add to existing list
      updatedLists = updatedLists.map(list => {
        if (list.id === selectedListId) {
          targetList = list;
          const existingPhones = new Set((list.contacts || []).map((c: any) => c.phone_number));
          const newContacts = transformedContacts.filter(c => !existingPhones.has(c.phone_number));
          return {
            ...list,
            contacts: [...(list.contacts || []), ...newContacts]
          };
        }
        return list;
      });
      targetList = updatedLists.find(l => l.id === selectedListId);
    }

    saveContactLists(updatedLists);
    setContactLists(updatedLists);

    showSuccess(`✓ ${transformedContacts.length} contacto(s) agregado(s) a "${targetList.name}"`);

    // Reset state
    setSelectedContacts(new Set());
    setSelectedListId('');
    setNewListName('');
    setShowAddToListModal(false);
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

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('chatflow_crm_view_mode', mode);
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

  const applyDynamicFilters = (contact: any): boolean => {
    // Apply each dynamic filter
    for (const [fieldName, filterValue] of Object.entries(dynamicFilters)) {
      if (!filterValue) continue;

      const field = config.fields.find(f => f.name === fieldName);
      if (!field) continue;

      const contactValue = contact[fieldName];

      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
          if (!contactValue || !contactValue.toString().toLowerCase().includes(filterValue.toLowerCase())) {
            return false;
          }
          break;

        case 'select':
          if (contactValue !== filterValue) {
            return false;
          }
          break;

        case 'number':
        case 'currency':
          const numValue = parseFloat(contactValue);
          if (filterValue.min !== undefined && numValue < filterValue.min) return false;
          if (filterValue.max !== undefined && numValue > filterValue.max) return false;
          break;

        case 'date':
          const dateValue = new Date(contactValue);
          if (filterValue.from && dateValue < new Date(filterValue.from)) return false;
          if (filterValue.to && dateValue > new Date(filterValue.to)) return false;
          break;
      }
    }
    return true;
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' || config.fields.some(field => {
      const value = contact[field.name];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesDynamicFilters = applyDynamicFilters(contact);

    return matchesSearch && matchesStatus && matchesDynamicFilters;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDynamicFilters({});
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || Object.keys(dynamicFilters).some(k => dynamicFilters[k]);

  const getStatusBadge = (statusName: string) => {
    const status = config.statuses.find(s => s.name === statusName);
    if (!status) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{statusName}</span>;

    const colorMap: Record<string, string> = {
      green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      orange: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      pink: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
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
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
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
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
            />
            <select
              value={formData.currency || field.currencyType || 'USD'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
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
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
          />
        );
    }
  };

  // Helper function to get contact initials for avatar
  const getContactInitials = (contact: any) => {
    const nameField = config.fields.find(f =>
      f.name.toLowerCase().includes('nombre') ||
      f.name.toLowerCase().includes('name')
    );
    const name = nameField ? contact[nameField.name] : '';
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper function to get avatar color based on contact name
  const getAvatarColor = (contact: any) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500',
      'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-indigo-500'
    ];
    const nameField = config.fields.find(f =>
      f.name.toLowerCase().includes('nombre') ||
      f.name.toLowerCase().includes('name')
    );
    const name = nameField ? contact[nameField.name] : contact.id;
    const hash = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Helper function to get contact display name
  const getContactName = (contact: any) => {
    const nameField = config.fields.find(f =>
      f.name.toLowerCase().includes('nombre') ||
      f.name.toLowerCase().includes('name')
    );
    return nameField ? contact[nameField.name] || 'Sin nombre' : 'Sin nombre';
  };

  return (
    <div className="p-6 w-full transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <i className="fas fa-address-book text-blue-600 mr-3"></i>
            Contactos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Gestiona tus contactos de forma eficiente</p>
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
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col space-y-4">
            {/* Top Row: Title + View Toggle + Actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contactos</h3>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 transition-colors duration-300">
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Vista de Tabla"
                  >
                    <i className="fas fa-table"></i>
                    <span className="hidden sm:inline">Tabla</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Vista de Lista"
                  >
                    <i className="fas fa-list"></i>
                    <span className="hidden sm:inline">Lista</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('cards')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Vista de Tarjetas"
                  >
                    <i className="fas fa-th-large"></i>
                    <span className="hidden sm:inline">Tarjetas</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('kanban')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                      viewMode === 'kanban'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Vista Kanban"
                  >
                    <i className="fas fa-columns"></i>
                    <span className="hidden sm:inline">Kanban</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                    showFilters
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <i className="fas fa-filter"></i>
                  <span>Filtros Avanzados</span>
                  {hasActiveFilters && !showFilters && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">●</span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center space-x-2"
                  >
                    <i className="fas fa-times"></i>
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Basic Filters Row */}
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar en todos los campos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors duration-300"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600 md:w-64 transition-colors duration-300"
              >
                <option value="all">Todos los estados</option>
                {config.statuses.map(status => (
                  <option key={status.name} value={status.name}>{status.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Filters Panel */}
            {showFilters && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 transition-colors duration-300">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center">
                  <i className="fas fa-sliders-h mr-2"></i>
                  Filtros por Campo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {config.fields.filter(f => f.visible && ['text', 'email', 'tel', 'select', 'number', 'currency', 'date'].includes(f.type)).map(field => (
                    <div key={field.name} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm transition-colors duration-300">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>

                      {(field.type === 'text' || field.type === 'email' || field.type === 'tel') && (
                        <input
                          type="text"
                          placeholder={`Buscar por ${field.label.toLowerCase()}...`}
                          value={dynamicFilters[field.name] || ''}
                          onChange={(e) => setDynamicFilters({ ...dynamicFilters, [field.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors duration-300"
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={dynamicFilters[field.name] || ''}
                          onChange={(e) => setDynamicFilters({ ...dynamicFilters, [field.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                        >
                          <option value="">Todos</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {(field.type === 'number' || field.type === 'currency') && (
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Mín"
                            value={dynamicFilters[field.name]?.min || ''}
                            onChange={(e) => setDynamicFilters({
                              ...dynamicFilters,
                              [field.name]: { ...dynamicFilters[field.name], min: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                          />
                          <input
                            type="number"
                            placeholder="Máx"
                            value={dynamicFilters[field.name]?.max || ''}
                            onChange={(e) => setDynamicFilters({
                              ...dynamicFilters,
                              [field.name]: { ...dynamicFilters[field.name], max: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                          />
                        </div>
                      )}

                      {field.type === 'date' && (
                        <div className="flex space-x-2">
                          <input
                            type="date"
                            value={dynamicFilters[field.name]?.from || ''}
                            onChange={(e) => setDynamicFilters({
                              ...dynamicFilters,
                              [field.name]: { ...dynamicFilters[field.name], from: e.target.value }
                            })}
                            className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                          />
                          <input
                            type="date"
                            value={dynamicFilters[field.name]?.to || ''}
                            onChange={(e) => setDynamicFilters({
                              ...dynamicFilters,
                              [field.name]: { ...dynamicFilters[field.name], to: e.target.value }
                            })}
                            className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-600 transition-colors duration-300"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selection Actions Bar */}
        {selectedContacts.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between transition-colors duration-300">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {selectedContacts.size} contacto{selectedContacts.size !== 1 ? 's' : ''} seleccionado{selectedContacts.size !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddToListModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
              >
                <i className="fas fa-list-ul mr-2"></i>
                Agregar a Lista
              </button>
              <button
                onClick={() => setSelectedContacts(new Set())}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg animate-fadeIn">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
                <tr>
                  <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600"
                      checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  {config.fields.filter(f => f.visible).sort((a, b) => a.order - b.order).map(field => (
                    <th key={field.name} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {field.label}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Estado
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Última Interacción
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`transition-all duration-200 ${selectedContacts.has(contact.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <td className="relative px-7 sm:w-12 sm:px-6">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600"
                        checked={selectedContacts.has(contact.id)}
                        onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                      />
                    </td>
                    {config.fields.filter(f => f.visible).sort((a, b) => a.order - b.order).map(field => (
                      <td key={field.name} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {field.type === 'currency' ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : '-'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => handleViewContact(contact)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 mr-4 transition-colors"
                      >
                        Ver<span className="sr-only">, {contact[config.fields[0]?.name]}</span>
                      </button>
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4 transition-colors"
                      >
                        Editar<span className="sr-only">, {contact[config.fields[0]?.name]}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                      >
                        Eliminar<span className="sr-only">, {contact[config.fields[0]?.name]}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 animate-fadeIn">
            {filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-200 dark:border-gray-700"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Card Header */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full ${getAvatarColor(contact)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {getContactInitials(contact)}
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {getContactName(contact)}
                        </h4>
                        <div className="mt-1">
                          {getStatusBadge(contact.status)}
                        </div>
                      </div>
                    </div>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2">
                  {config.fields
                    .filter(f => f.visible && !f.name.toLowerCase().includes('nombre') && !f.name.toLowerCase().includes('name'))
                    .sort((a, b) => a.order - b.order)
                    .slice(0, 4)
                    .map(field => (
                      <div key={field.name} className="flex items-center text-xs">
                        <i className={`fas ${
                          field.type === 'tel' ? 'fa-phone' :
                          field.type === 'email' ? 'fa-envelope' :
                          field.type === 'currency' ? 'fa-dollar-sign' :
                          field.type === 'date' ? 'fa-calendar' :
                          'fa-info-circle'
                        } text-gray-400 dark:text-gray-500 mr-2 w-4`}></i>
                        <span className="text-gray-500 dark:text-gray-400 mr-2">{field.label}:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate flex-1">
                          {field.type === 'currency' && contact[field.name] ? (
                            `$${contact[field.name]?.toLocaleString()}`
                          ) : field.type === 'date' && contact[field.name] ? (
                            new Date(contact[field.name]).toLocaleDateString()
                          ) : (
                            contact[field.name] || '-'
                          )}
                        </span>
                      </div>
                    ))}

                  {/* Last Interaction */}
                  {contact.lastInteraction && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <i className="fas fa-clock mr-2"></i>
                      <span>Última interacción: {new Date(contact.lastInteraction).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <button
                    onClick={() => handleViewContact(contact)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <i className="fas fa-eye"></i>
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center space-x-1 mx-1"
                  >
                    <i className="fas fa-edit"></i>
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <i className="fas fa-trash"></i>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 animate-fadeIn">
            {filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                  selectedContacts.has(contact.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0 mr-4">
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600"
                  />
                </div>

                {/* Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(contact)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {getContactInitials(contact)}
                </div>

                {/* Main Content */}
                <div className="flex-1 ml-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  {/* Name + Status */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {getContactName(contact)}
                    </h4>
                    <div className="mt-1">
                      {getStatusBadge(contact.status)}
                    </div>
                  </div>

                  {/* Contact Info */}
                  {config.fields
                    .filter(f => f.visible && (f.type === 'tel' || f.type === 'email'))
                    .slice(0, 2)
                    .map((field, idx) => (
                      <div key={field.name} className={idx === 0 ? 'md:col-span-2' : ''}>
                        <div className="flex items-center text-xs">
                          <i className={`fas ${field.type === 'tel' ? 'fa-phone' : 'fa-envelope'} text-gray-400 dark:text-gray-500 mr-2`}></i>
                          <span className="text-gray-900 dark:text-gray-100">{contact[field.name] || '-'}</span>
                        </div>
                      </div>
                    ))}

                  {/* Last Interaction */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <i className="fas fa-clock mr-1"></i>
                    {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : '-'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex space-x-2 ml-4">
                  <button
                    onClick={() => handleViewContact(contact)}
                    className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Ver"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-4 animate-fadeIn">
            <div className="flex space-x-4 min-w-max p-4">
              {config.statuses.map((status) => {
                const statusContacts = filteredContacts.filter(c => c.status === status.name);
                return (
                  <div
                    key={status.name}
                    className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 transition-colors duration-300"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${
                          status.name === 'lead' ? 'bg-yellow-500' :
                          status.name === 'contacted' ? 'bg-blue-500' :
                          status.name === 'qualified' ? 'bg-purple-500' :
                          status.name === 'proposal' ? 'bg-orange-500' :
                          status.name === 'negotiation' ? 'bg-pink-500' :
                          status.name === 'won' ? 'bg-green-500' :
                          status.name === 'lost' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></span>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{status.label}</h3>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                        {statusContacts.length}
                      </span>
                    </div>

                    {/* Cards in Column */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {statusContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 cursor-move"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className={`w-8 h-8 flex-shrink-0 rounded-full ${getAvatarColor(contact)} flex items-center justify-center text-white font-bold text-xs`}>
                                {getContactInitials(contact)}
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {getContactName(contact)}
                              </h4>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedContacts.has(contact.id)}
                              onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                              className="h-3.5 w-3.5 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600"
                            />
                          </div>

                          {/* Card Body */}
                          <div className="space-y-1.5 text-xs">
                            {config.fields
                              .filter(f => f.visible && (f.type === 'tel' || f.type === 'email'))
                              .slice(0, 2)
                              .map(field => (
                                <div key={field.name} className="flex items-center text-gray-600 dark:text-gray-400">
                                  <i className={`fas ${field.type === 'tel' ? 'fa-phone' : 'fa-envelope'} mr-2 w-3`}></i>
                                  <span className="truncate">{contact[field.name] || '-'}</span>
                                </div>
                              ))}
                            {contact.lastInteraction && (
                              <div className="flex items-center text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                                <i className="fas fa-clock mr-1.5 text-[10px]"></i>
                                <span>{new Date(contact.lastInteraction).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Actions */}
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-1">
                            <button
                              onClick={() => handleViewContact(contact)}
                              className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                              title="Ver"
                            >
                              <i className="fas fa-eye text-xs"></i>
                            </button>
                            <button
                              onClick={() => handleEditContact(contact)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Editar"
                            >
                              <i className="fas fa-edit text-xs"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Eliminar"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        </div>
                      ))}

                      {statusContacts.length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                          <i className="fas fa-inbox text-3xl mb-2"></i>
                          <p className="text-xs">Sin contactos</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty States - View Specific */}
        {filteredContacts.length === 0 && (
          <div className="text-center py-16 px-4 animate-fadeIn">
            {/* Table Empty State */}
            {viewMode === 'table' && (
              <div>
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600">
                  <i className="fas fa-table text-7xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No se encontraron contactos' : 'Tabla vacía'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda para encontrar los contactos que necesitas'
                    : 'Comienza agregando tu primer contacto para ver tus datos organizados en tabla'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setFormData(initializeFormData());
                      setShowModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                  >
                    <i className="fas fa-plus"></i>
                    <span>Agregar Primer Contacto</span>
                  </button>
                )}
              </div>
            )}

            {/* Cards Empty State */}
            {viewMode === 'cards' && (
              <div>
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600">
                  <i className="fas fa-id-card text-7xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No hay tarjetas para mostrar' : 'Sin tarjetas de contacto'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Prueba con diferentes criterios de búsqueda para encontrar contactos'
                    : 'Crea contactos y visualízalos en formato de tarjetas atractivas'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setFormData(initializeFormData());
                      setShowModal(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                  >
                    <i className="fas fa-plus-circle"></i>
                    <span>Crear Primera Tarjeta</span>
                  </button>
                )}
              </div>
            )}

            {/* List Empty State */}
            {viewMode === 'list' && (
              <div>
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600">
                  <i className="fas fa-list-ul text-7xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'Lista vacía' : 'Sin contactos en la lista'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Modifica tus filtros para ver más contactos en la lista'
                    : 'Agrega contactos para verlos en una lista compacta y fácil de leer'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setFormData(initializeFormData());
                      setShowModal(true);
                    }}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                  >
                    <i className="fas fa-user-plus"></i>
                    <span>Agregar a la Lista</span>
                  </button>
                )}
              </div>
            )}

            {/* Kanban Empty State */}
            {viewMode === 'kanban' && (
              <div>
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600">
                  <i className="fas fa-columns text-7xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No hay contactos que cumplan los criterios' : 'Tablero Kanban vacío'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Ajusta los filtros para visualizar contactos en el tablero Kanban'
                    : 'Comienza a gestionar tus contactos visualmente organizados por estado'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setFormData(initializeFormData());
                      setShowModal(true);
                    }}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                  >
                    <i className="fas fa-th"></i>
                    <span>Iniciar Tablero</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.fields.filter(f => f.visible).map(field => (
                  <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
                  >
                    <option value="">Seleccionar estado...</option>
                    {config.statuses.map(status => (
                      <option key={status.name} value={status.name}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingContact(null);
                  setFormData({});
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
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

      {/* Add to List Modal */}
      {showAddToListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <i className="fas fa-list-ul text-blue-600 mr-3"></i>
                Agregar a Lista
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {selectedContacts.size} contacto{selectedContacts.size !== 1 ? 's' : ''} seleccionado{selectedContacts.size !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Select Existing List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar Lista Existente
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => {
                    setSelectedListId(e.target.value);
                    if (e.target.value) setNewListName('');
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors duration-300"
                  disabled={newListName.trim() !== ''}
                >
                  <option value="">Selecciona una lista...</option>
                  {contactLists.map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.contacts?.length || 0} contactos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">O</span>
                </div>
              </div>

              {/* Create New List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Crear Nueva Lista
                </label>
                <input
                  type="text"
                  placeholder="Nombre de la nueva lista..."
                  value={newListName}
                  onChange={(e) => {
                    setNewListName(e.target.value);
                    if (e.target.value.trim()) setSelectedListId('');
                  }}
                  disabled={selectedListId !== ''}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-500 transition-colors duration-300"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => {
                  setShowAddToListModal(false);
                  setSelectedListId('');
                  setNewListName('');
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddToList}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                <i className="fas fa-check mr-2"></i>
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Detail View Modal */}
      {viewingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <i className="fas fa-user-circle text-purple-600 mr-3"></i>
                    Detalles del Contacto
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Información completa y eventos vinculados
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingContact(null);
                    setContactEvents([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  {config.fields.filter(f => f.visible).map(field => (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {field.label}
                      </label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {field.type === 'currency' && viewingContact[field.name] ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ${viewingContact[field.name]?.toLocaleString()} {viewingContact.currency || 'USD'}
                          </span>
                        ) : field.type === 'date' && viewingContact[field.name] ? (
                          new Date(viewingContact[field.name]).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        ) : (
                          viewingContact[field.name] || '-'
                        )}
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Estado
                    </label>
                    <div className="text-sm">
                      {getStatusBadge(viewingContact.status)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Última Interacción
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {viewingContact.lastInteraction
                        ? new Date(viewingContact.lastInteraction).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Events */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <i className="fas fa-calendar-alt text-blue-600 mr-2"></i>
                  Eventos de Calendario
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({contactEvents.length})
                  </span>
                </h3>

                {contactEvents.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {contactEvents
                      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                      .map((event) => {
                        const eventColors: Record<string, string> = {
                          call: '#3b82f6',
                          meeting: '#8b5cf6',
                          followup: '#06b6d4',
                          reminder: '#10b981',
                          other: '#6b7280'
                        };

                        const typeLabels: Record<string, string> = {
                          call: '📞 Llamada',
                          meeting: '🤝 Reunión',
                          followup: '📋 Seguimiento',
                          reminder: '⏰ Recordatorio',
                          other: '📌 Otro'
                        };

                        const isPast = new Date(event.end) < new Date();

                        return (
                          <div
                            key={event.id}
                            className="border-l-4 pl-4 py-3 bg-white dark:bg-gray-700 rounded-r-lg hover:shadow-md transition-all"
                            style={{ borderColor: eventColors[event.type] || '#6b7280' }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {event.title}
                                  </h4>
                                  <span
                                    className="px-2 py-0.5 rounded-md text-xs font-medium text-white"
                                    style={{ backgroundColor: eventColors[event.type] }}
                                  >
                                    {typeLabels[event.type]}
                                  </span>
                                  {event.recurrence && event.recurrence.frequency !== 'none' && (
                                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                      <i className="fas fa-repeat mr-1"></i>
                                      Recurrente
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center">
                                    <i className="fas fa-calendar text-blue-600 mr-1.5"></i>
                                    {format(event.start, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                                  </span>
                                  <span className="flex items-center">
                                    <i className="fas fa-clock text-green-600 mr-1.5"></i>
                                    {format(event.start, 'HH:mm', { locale: es })} - {format(event.end, 'HH:mm', { locale: es })}
                                  </span>
                                </div>
                                {event.notes && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                    {event.notes}
                                  </p>
                                )}
                              </div>
                              <div className="ml-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isPast
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  }`}
                                >
                                  {isPast ? 'Pasado' : 'Próximo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <i className="fas fa-calendar-times text-gray-400 dark:text-gray-500 text-5xl mb-3"></i>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                      No hay eventos vinculados
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Este contacto no tiene eventos de calendario asociados
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-between">
              <button
                onClick={() => handleEditContact(viewingContact)}
                className="px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center space-x-2"
              >
                <i className="fas fa-edit"></i>
                <span>Editar Contacto</span>
              </button>
              <button
                onClick={() => {
                  setViewingContact(null);
                  setContactEvents([]);
                }}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
