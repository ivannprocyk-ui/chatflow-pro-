import { useState, useEffect } from 'react';
import { loadCRMConfig, saveCRMConfig, CRMConfig, CRMFieldConfig, CRMStatusConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configuración del CRM</h1>
        <p className="text-gray-600">Personaliza los campos y estados de tu CRM</p>
      </div>

      {/* Fields Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📝 Campos Personalizados</h2>
            <p className="text-gray-600 text-sm mt-1">Configura qué campos aparecen en tus contactos</p>
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
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Nuevo Campo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.fields.map((field) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{field.label}</h3>
                  <p className="text-sm text-gray-500">
                    {field.name} • {field.type}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleMoveFieldUp(field.id)}
                    disabled={config.fields.indexOf(field) === 0}
                    className="text-gray-600 hover:text-gray-800 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover arriba"
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>
                  <button
                    onClick={() => handleMoveFieldDown(field.id)}
                    disabled={config.fields.indexOf(field) === config.fields.length - 1}
                    className="text-gray-600 hover:text-gray-800 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover abajo"
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>
                  <button
                    onClick={() => handleEditField(field)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className={`px-2 py-1 rounded ${field.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {field.visible ? 'Visible' : 'Oculto'}
                </span>
                {field.type === 'currency' && field.currencyType && (
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {field.currencyType}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statuses Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🏷️ Estados</h2>
            <p className="text-gray-600 text-sm mt-1">Define los estados para clasificar tus contactos</p>
          </div>
          <button
            onClick={() => {
              setEditingStatus(null);
              setNewStatus({ name: '', label: '', color: 'blue' });
              setShowStatusModal(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Nuevo Estado</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {config.statuses.map((status) => (
            <div key={status.id} className={`border-2 border-${status.color}-500 rounded-lg p-4 hover:shadow-md transition-shadow`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{status.label}</h3>
                  <p className="text-sm text-gray-500">{status.name}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditStatus(status)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteStatus(status.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                {status.color}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingField ? 'Editar Campo' : 'Nuevo Campo'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre (ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="ej: precio_unitario"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!!editingField}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiqueta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="ej: Precio Unitario"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Campo</label>
                  <select
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                    <select
                      value={newField.currencyType}
                      onChange={(e) => setNewField({ ...newField, currencyType: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Opciones del Campo <span className="text-red-500">*</span>
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
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newOption.trim()) {
                          setNewField({ ...newField, options: [...(newField.options || []), newOption.trim()] });
                          setNewOption('');
                        }
                      }}
                      className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-all"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(newField.options || []).map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <span className="text-sm text-gray-700">{option}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedOptions = [...(newField.options || [])];
                            updatedOptions.splice(index, 1);
                            setNewField({ ...newField, options: updatedOptions });
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  {(!newField.options || newField.options.length === 0) && (
                    <p className="text-sm text-gray-500 mt-2">
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
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Campo requerido</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newField.visible}
                    onChange={(e) => setNewField({ ...newField, visible: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Visible</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4">
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveField}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700"
              >
                {editingField ? 'Actualizar' : 'Crear'} Campo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingStatus ? 'Editar Estado' : 'Nuevo Estado'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre (ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStatus.name}
                  onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="ej: prospecto"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingStatus}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiqueta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStatus.label}
                  onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                  placeholder="ej: Prospecto"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <select
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setEditingStatus(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStatus}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700"
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
