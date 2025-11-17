import { useState, useEffect } from 'react';
import { loadCRMConfig, saveCRMConfig, CRMConfig, CRMFieldConfig, CRMStatusConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';
import { Plus, ArrowUp, ArrowDown, Edit, Trash2, X } from 'lucide-react';

export default function CRMSettings() {
  const [config, setConfig] = useState<CRMConfig>(loadCRMConfig());
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingField, setEditingField] = useState<CRMFieldConfig | null>(null);
  const [editingStatus, setEditingStatus] = useState<CRMStatusConfig | null>(null);
  const { showSuccess, showError } = useToast();
  const [newField, setNewField] = useState<Partial<CRMFieldConfig>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    visible: true,
    order: config.fields.length + 1,
    options: []
  });
  const [newOption, setNewOption] = useState('');
  const [newStatus, setNewStatus] = useState<Partial<CRMStatusConfig>>({
    name: '',
    label: '',
    color: 'blue'
  });

  const handleSaveField = () => {
    if (!newField.name || !newField.label) {
      showError('Nombre y etiqueta son requeridos');
      return;
    }

    if (newField.type === 'select' && (!newField.options || newField.options.length === 0)) {
      showError('Debes agregar al menos una opción para campos de selección');
      return;
    }

    let updatedFields;
    if (editingField) {
      updatedFields = config.fields.map(f =>
        f.id === editingField.id ? { ...newField, id: editingField.id } as CRMFieldConfig : f
      );
    } else {
      const field: CRMFieldConfig = {
        id: Date.now().toString(),
        name: newField.name!,
        label: newField.label!,
        type: newField.type || 'text',
        required: newField.required || false,
        visible: newField.visible !== false,
        order: newField.order || config.fields.length + 1,
        options: newField.options,
        currencyType: newField.currencyType,
        defaultValue: newField.defaultValue
      };
      updatedFields = [...config.fields, field];
    }

    const updatedConfig = { ...config, fields: updatedFields };
    setConfig(updatedConfig);
    saveCRMConfig(updatedConfig);
    setShowFieldModal(false);
    setEditingField(null);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      visible: true,
      order: updatedFields.length + 1,
      options: []
    });
    setNewOption('');
    showSuccess(editingField ? 'Campo actualizado exitosamente' : 'Campo creado exitosamente');
  };

  const handleSaveStatus = () => {
    if (!newStatus.name || !newStatus.label) {
      showError('Nombre y etiqueta son requeridos');
      return;
    }

    let updatedStatuses;
    if (editingStatus) {
      updatedStatuses = config.statuses.map(s =>
        s.id === editingStatus.id ? { ...newStatus, id: editingStatus.id } as CRMStatusConfig : s
      );
    } else {
      const status: CRMStatusConfig = {
        id: Date.now().toString(),
        name: newStatus.name!,
        label: newStatus.label!,
        color: newStatus.color || 'blue',
        icon: newStatus.icon
      };
      updatedStatuses = [...config.statuses, status];
    }

    const updatedConfig = { ...config, statuses: updatedStatuses };
    setConfig(updatedConfig);
    saveCRMConfig(updatedConfig);
    setShowStatusModal(false);
    setEditingStatus(null);
    setNewStatus({ name: '', label: '', color: 'blue' });
    showSuccess(editingStatus ? 'Estado actualizado exitosamente' : 'Estado creado exitosamente');
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('¿Estás seguro de eliminar este campo?')) {
      const updatedFields = config.fields.filter(f => f.id !== fieldId);
      const updatedConfig = { ...config, fields: updatedFields };
      setConfig(updatedConfig);
      saveCRMConfig(updatedConfig);
      showSuccess('Campo eliminado');
    }
  };

  const handleDeleteStatus = (statusId: string) => {
    if (confirm('¿Estás seguro de eliminar este estado?')) {
      const updatedStatuses = config.statuses.filter(s => s.id !== statusId);
      const updatedConfig = { ...config, statuses: updatedStatuses };
      setConfig(updatedConfig);
      saveCRMConfig(updatedConfig);
      showSuccess('Estado eliminado');
    }
  };

  const handleMoveFieldUp = (fieldId: string) => {
    const fieldIndex = config.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex <= 0) return;

    const updatedFields = [...config.fields];
    const temp = updatedFields[fieldIndex - 1];
    updatedFields[fieldIndex - 1] = updatedFields[fieldIndex];
    updatedFields[fieldIndex] = temp;

    // Update order property
    updatedFields.forEach((field, idx) => {
      field.order = idx + 1;
    });

    const updatedConfig = { ...config, fields: updatedFields };
    setConfig(updatedConfig);
    saveCRMConfig(updatedConfig);
    showSuccess('Campo movido hacia arriba');
  };

  const handleMoveFieldDown = (fieldId: string) => {
    const fieldIndex = config.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex >= config.fields.length - 1) return;

    const updatedFields = [...config.fields];
    const temp = updatedFields[fieldIndex + 1];
    updatedFields[fieldIndex + 1] = updatedFields[fieldIndex];
    updatedFields[fieldIndex] = temp;

    // Update order property
    updatedFields.forEach((field, idx) => {
      field.order = idx + 1;
    });

    const updatedConfig = { ...config, fields: updatedFields };
    setConfig(updatedConfig);
    saveCRMConfig(updatedConfig);
    showSuccess('Campo movido hacia abajo');
  };

  const handleEditField = (field: CRMFieldConfig) => {
    setEditingField(field);
    setNewField({ ...field });
    setShowFieldModal(true);
  };

  const handleEditStatus = (status: CRMStatusConfig) => {
    setEditingStatus(status);
    setNewStatus({ ...status });
    setShowStatusModal(true);
  };

  const colorOptions = [
    { value: 'blue', label: 'Azul' },
    { value: 'green', label: 'Verde' },
    { value: 'yellow', label: 'Amarillo' },
    { value: 'red', label: 'Rojo' },
    { value: 'purple', label: 'Morado' },
    { value: 'orange', label: 'Naranja' },
    { value: 'pink', label: 'Rosa' },
    { value: 'gray', label: 'Gris' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">⚙️ Configuración del CRM</h1>
        <p className="text-gray-600 dark:text-gray-300">Personaliza los campos y estados de tu CRM</p>
      </div>

      {/* Fields Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📝 Campos Personalizados</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Configura qué campos aparecen en tus contactos</p>
          </div>
          <button
            onClick={() => {
              setEditingField(null);
              setNewField({
                name: '',
                label: '',
                type: 'text',
                required: false,
                visible: true,
                order: config.fields.length + 1
              });
              setShowFieldModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Nuevo Campo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.fields.map((field) => (
            <div key={field.id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{field.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {field.name} • {field.type}
                    {field.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleMoveFieldUp(field.id)}
                    disabled={config.fields.indexOf(field) === 0}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover arriba"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveFieldDown(field.id)}
                    disabled={config.fields.indexOf(field) === config.fields.length - 1}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover abajo"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => handleEditField(field)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className={`px-2 py-1 rounded ${field.visible ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                  {field.visible ? 'Visible' : 'Oculto'}
                </span>
                {field.type === 'currency' && field.currencyType && (
                  <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {field.currencyType}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statuses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🏷️ Estados</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Define los estados para clasificar tus contactos</p>
          </div>
          <button
            onClick={() => {
              setEditingStatus(null);
              setNewStatus({ name: '', label: '', color: 'blue' });
              setShowStatusModal(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Nuevo Estado</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {config.statuses.map((status) => (
            <div key={status.id} className={`border-2 border-${status.color}-500 dark:border-${status.color}-600 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{status.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{status.name}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditStatus(status)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteStatus(status.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${status.color}-100 dark:bg-${status.color}-900 text-${status.color}-800 dark:text-${status.color}-200`}>
                {status.color}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingField ? 'Editar Campo' : 'Nuevo Campo'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre (ID) <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="ej: precio_unitario"
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    disabled={!!editingField}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Etiqueta <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="ej: Precio Unitario"
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Campo</label>
                  <select
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="email">Email</option>
                    <option value="phone">Teléfono</option>
                    <option value="date">Fecha</option>
                    <option value="currency">Moneda</option>
                    <option value="textarea">Área de texto</option>
                    <option value="select">Selección</option>
                  </select>
                </div>

                {newField.type === 'currency' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Moneda</label>
                    <select
                      value={newField.currencyType}
                      onChange={(e) => setNewField({ ...newField, currencyType: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      {config.currencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Options for Select Fields */}
              {newField.type === 'select' && (
                <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 transition-colors duration-300">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Opciones del Campo <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newOption.trim()) {
                            setNewField({ ...newField, options: [...(newField.options || []), newOption.trim()] });
                            setNewOption('');
                          }
                        }
                      }}
                      placeholder="Ej: INGLES, CASTELLANO, PORTUGUES"
                      className="flex-1 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newOption.trim()) {
                          setNewField({ ...newField, options: [...(newField.options || []), newOption.trim()] });
                          setNewOption('');
                        }
                      }}
                      className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(newField.options || []).map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedOptions = [...(newField.options || [])];
                            updatedOptions.splice(index, 1);
                            setNewField({ ...newField, options: updatedOptions });
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {(!newField.options || newField.options.length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Agrega al menos una opción para este campo de selección
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 dark:text-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Campo requerido</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newField.visible}
                    onChange={(e) => setNewField({ ...newField, visible: e.target.checked })}
                    className="w-4 h-4 text-blue-600 dark:text-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Visible</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveField}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all"
              >
                {editingField ? 'Actualizar' : 'Crear'} Campo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingStatus ? 'Editar Estado' : 'Nuevo Estado'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre (ID) <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newStatus.name}
                  onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="ej: prospecto"
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  disabled={!!editingStatus}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Etiqueta <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newStatus.label}
                  onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                  placeholder="ej: Prospecto"
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                <select
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setEditingStatus(null);
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 transition-all"
              >
                {editingStatus ? 'Actualizar' : 'Crear'} Estado
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
