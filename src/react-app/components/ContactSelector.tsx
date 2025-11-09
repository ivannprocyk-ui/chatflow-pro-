import { useState, useEffect, useMemo } from 'react';
import { loadCRMData, loadCRMConfig } from '@/react-app/utils/storage';

interface ContactSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  initialSelectedIds?: string[];
  title?: string;
  confirmText?: string;
  multiSelect?: boolean;
}

export default function ContactSelector({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedIds = [],
  title = 'Seleccionar Contactos',
  confirmText = 'Confirmar',
  multiSelect = true
}: ContactSelectorProps) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});

  const crmConfig = loadCRMConfig();
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    if (isOpen) {
      const data = loadCRMData();
      setContacts(data);
      setSelectedIds(new Set(initialSelectedIds));
      setSearchTerm('');
      setStatusFilter('all');
      setCurrentPage(1);
      setDynamicFilters({});
      setShowFilters(false);
    }
  }, [isOpen, initialSelectedIds]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Apply filters
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(contact => {
        return crmConfig.fields.some(field => {
          const value = contact[field.name];
          return value && value.toString().toLowerCase().includes(query);
        });
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }

    // Dynamic filters
    for (const [fieldName, filterValue] of Object.entries(dynamicFilters)) {
      if (!filterValue) continue;

      const field = crmConfig.fields.find(f => f.name === fieldName);
      if (!field) continue;

      filtered = filtered.filter(contact => {
        const contactValue = contact[fieldName];

        switch (field.type) {
          case 'text':
          case 'email':
          case 'tel':
            return contactValue && contactValue.toString().toLowerCase().includes(filterValue.toLowerCase());
          case 'select':
            return contactValue === filterValue;
          case 'number':
          case 'currency':
            const numValue = parseFloat(contactValue);
            if (filterValue.min !== undefined && numValue < filterValue.min) return false;
            if (filterValue.max !== undefined && numValue > filterValue.max) return false;
            return true;
          case 'date':
            const dateValue = new Date(contactValue);
            if (filterValue.from && dateValue < new Date(filterValue.from)) return false;
            if (filterValue.to && dateValue > new Date(filterValue.to)) return false;
            return true;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [contacts, debouncedSearch, statusFilter, dynamicFilters, crmConfig.fields]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  // Actions
  const handleToggleContact = (contactId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      if (!multiSelect) {
        newSelected.clear();
      }
      newSelected.add(contactId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set(selectedIds);
    paginatedContacts.forEach(contact => newSelected.add(contact.id));
    setSelectedIds(newSelected);
  };

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(filteredContacts.map(c => c.id));
    setSelectedIds(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleInvertSelection = () => {
    const newSelected = new Set<string>();
    paginatedContacts.forEach(contact => {
      if (!selectedIds.has(contact.id)) {
        newSelected.add(contact.id);
      }
    });
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  const getContactDisplayName = (contact: any) => {
    const nameField = crmConfig.fields.find(f =>
      f.name.toLowerCase().includes('nombre') ||
      f.name.toLowerCase().includes('name')
    );
    return nameField ? contact[nameField.name] || 'Sin nombre' : contact.id;
  };

  const getContactSecondaryInfo = (contact: any) => {
    const phoneField = crmConfig.fields.find(f => f.type === 'tel');
    const emailField = crmConfig.fields.find(f => f.type === 'email');

    const phone = phoneField ? contact[phoneField.name] : null;
    const email = emailField ? contact[emailField.name] : null;

    return phone || email || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <i className="fas fa-users text-blue-600 mr-3"></i>
                {title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedIds.size} de {filteredContacts.length} contactos seleccionados
                {filteredContacts.length < contacts.length && ` (${contacts.length} total)`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4 flex-shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono, email..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
            >
              <i className="fas fa-check-double mr-2"></i>
              Seleccionar página ({paginatedContacts.length})
            </button>
            {filteredContacts.length > ITEMS_PER_PAGE && (
              <button
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-all"
              >
                <i className="fas fa-check-circle mr-2"></i>
                Seleccionar todos filtrados ({filteredContacts.length})
              </button>
            )}
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
            >
              <i className="fas fa-times-circle mr-2"></i>
              Limpiar todo
            </button>
            <button
              onClick={handleInvertSelection}
              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all"
            >
              <i className="fas fa-exchange-alt mr-2"></i>
              Invertir selección
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showFilters
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-filter mr-2"></i>
              Filtros {Object.keys(dynamicFilters).length > 0 && `(${Object.keys(dynamicFilters).length})`}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Filtros Avanzados
              </h4>

              {/* Status Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">Todos</option>
                    <option value="lead">Lead</option>
                    <option value="client">Cliente</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                {/* Add more dynamic filters based on CRM config */}
                {crmConfig.fields
                  .filter(f => f.type === 'select' && f.name !== 'status')
                  .slice(0, 2)
                  .map(field => (
                    <div key={field.name}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {field.label}
                      </label>
                      <select
                        value={dynamicFilters[field.name] || ''}
                        onChange={(e) => {
                          const newFilters = { ...dynamicFilters };
                          if (e.target.value) {
                            newFilters[field.name] = e.target.value;
                          } else {
                            delete newFilters[field.name];
                          }
                          setDynamicFilters(newFilters);
                          setCurrentPage(1);
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Todos</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>

              {Object.keys(dynamicFilters).length > 0 && (
                <button
                  onClick={() => {
                    setDynamicFilters({});
                    setStatusFilter('all');
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  <i className="fas fa-times mr-1"></i>
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selected Contacts Panel */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Seleccionados ({selectedIds.size}):
                </span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {Array.from(selectedIds).slice(0, 10).map(id => {
                    const contact = contacts.find(c => c.id === id);
                    if (!contact) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-md text-xs font-medium"
                      >
                        {getContactDisplayName(contact)}
                        <button
                          onClick={() => handleToggleContact(id)}
                          className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </span>
                    );
                  })}
                  {selectedIds.size > 10 && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 rounded-md text-xs font-medium">
                      +{selectedIds.size - 10} más
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {paginatedContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedContacts.map(contact => {
                const isSelected = selectedIds.has(contact.id);
                const displayName = getContactDisplayName(contact);
                const secondaryInfo = getContactSecondaryInfo(contact);

                return (
                  <div
                    key={contact.id}
                    onClick={() => handleToggleContact(contact.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {displayName}
                        </h4>
                        {secondaryInfo && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                            {secondaryInfo}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            contact.status === 'client'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : contact.status === 'lead'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {contact.status || 'Sin estado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="fas fa-search text-gray-400 dark:text-gray-500 text-6xl mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No se encontraron contactos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intenta ajustar los filtros o la búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredContacts.length)} de {filteredContacts.length}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <i className="fas fa-check"></i>
            <span>{confirmText} ({selectedIds.size})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
