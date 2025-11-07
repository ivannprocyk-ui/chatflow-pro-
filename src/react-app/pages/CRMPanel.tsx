import { useState, useEffect } from 'react';
import { loadCRMData, saveCRMData, loadCRMConfig, loadContactLists, saveContactLists, CRMFieldConfig, CRMConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

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
  const [formData, setFormData] = useState<any>({});
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const { showSuccess, showError } = useToast();

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

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <i className="fas fa-address-book text-blue-600 mr-3"></i>
            Contactos
          </h1>
          <p className="text-gray-600">Gestiona tus contactos de forma eficiente</p>
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
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col space-y-4">
            {/* Top Row: Title + Actions */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Contactos</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                    showFilters
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all flex items-center space-x-2"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 md:w-64"
              >
                <option value="all">Todos los estados</option>
                {config.statuses.map(status => (
                  <option key={status.name} value={status.name}>{status.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Filters Panel */}
            {showFilters && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <i className="fas fa-sliders-h mr-2"></i>
                  Filtros por Campo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {config.fields.filter(f => f.visible && ['text', 'email', 'tel', 'select', 'number', 'currency', 'date'].includes(f.type)).map(field => (
                    <div key={field.name} className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-700 mb-2">{field.label}</label>

                      {(field.type === 'text' || field.type === 'email' || field.type === 'tel') && (
                        <input
                          type="text"
                          placeholder={`Buscar por ${field.label.toLowerCase()}...`}
                          value={dynamicFilters[field.name] || ''}
                          onChange={(e) => setDynamicFilters({ ...dynamicFilters, [field.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={dynamicFilters[field.name] || ''}
                          onChange={(e) => setDynamicFilters({ ...dynamicFilters, [field.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-600"
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
                            className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-600"
                          />
                          <input
                            type="number"
                            placeholder="Máx"
                            value={dynamicFilters[field.name]?.max || ''}
                            onChange={(e) => setDynamicFilters({
                              ...dynamicFilters,
                              [field.name]: { ...dynamicFilters[field.name], max: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-600"
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
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-600"
                          />
                          <input
                            type="date"
                            value={dynamicFilters[field.name]?.to || ''}
                            onChange={(e) => setDynamicFilters({
                              ...dynamicFilters,
                              [field.name]: { ...dynamicFilters[field.name], to: e.target.value }
                            })}
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-600"
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
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all"
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

      {/* Add to List Modal */}
      {showAddToListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-list-ul text-blue-600 mr-3"></i>
                Agregar a Lista
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedContacts.size} contacto{selectedContacts.size !== 1 ? 's' : ''} seleccionado{selectedContacts.size !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Select Existing List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Lista Existente
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => {
                    setSelectedListId(e.target.value);
                    if (e.target.value) setNewListName('');
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O</span>
                </div>
              </div>

              {/* Create New List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4">
              <button
                onClick={() => {
                  setShowAddToListModal(false);
                  setSelectedListId('');
                  setNewListName('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all"
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
    </div>
  );
}
