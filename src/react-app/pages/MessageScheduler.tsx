import { useState, useEffect, useRef } from 'react';
import { loadScheduledMessages, saveScheduledMessages, loadContactLists, loadConfig, loadCRMData, saveCampaigns, loadCampaigns, addMessageToHistory } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';
import ContactSelector from '@/react-app/components/ContactSelector';

interface ScheduledMessage {
  id: string;
  campaignName: string;
  scheduledDate: string;
  scheduledTime: string;
  contactListId?: string; // Para retrocompatibilidad con listas
  contactListName?: string;
  contactIds?: string[]; // Para selección directa de contactos
  contactCount: number;
  template: string;
  imageUrl?: string; // URL de imagen para plantillas con header de imagen
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
}

export default function MessageScheduler() {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    campaignName: '',
    scheduledDate: '',
    scheduledTime: '',
    contactListId: '',
    contactIds: [] as string[],
    selectionMode: 'list' as 'list' | 'contacts', // Modo de selección
    template: '',
    imageUrl: ''
  });
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);
  const config = loadConfig();
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    // Load scheduled messages (no demo data)
    const savedMessages = loadScheduledMessages();
    setScheduledMessages(savedMessages);

    // Load contact lists
    setContactLists(loadContactLists());

    // Load Meta templates from cache
    const cachedTemplates = localStorage.getItem('chatflow_cached_templates');
    if (cachedTemplates) {
      const parsedTemplates = JSON.parse(cachedTemplates);
      setTemplates(parsedTemplates.filter((t: WhatsAppTemplate) => t.status === 'APPROVED'));
    }

    // Listen for scheduled message executions from AppNew.tsx
    const handleMessageExecuted = (event: any) => {
      console.log('[MessageScheduler] Received execution notification:', event.detail);
      // Reload messages to refresh the UI
      const updatedMessages = loadScheduledMessages();
      setScheduledMessages(updatedMessages);

      // Show notification
      const { messageId, results } = event.detail;
      const message = updatedMessages.find((m: ScheduledMessage) => m.id === messageId);
      if (message && results.sent > 0) {
        showSuccess(`Campaña "${message.campaignName}" ejecutada: ${results.sent}/${results.total} enviados`);
      } else if (message) {
        showError(`Campaña "${message.campaignName}" falló: 0 mensajes enviados`);
      }
    };

    window.addEventListener('scheduled-message-executed', handleMessageExecuted);

    return () => {
      window.removeEventListener('scheduled-message-executed', handleMessageExecuted);
    };
  }, [showSuccess, showError]);

  // Función para editar un mensaje programado
  const handleEditMessage = (message: ScheduledMessage) => {
    setEditingMessage(message);
    setNewSchedule({
      campaignName: message.campaignName,
      scheduledDate: message.scheduledDate,
      scheduledTime: message.scheduledTime,
      contactListId: message.contactListId || '',
      contactIds: message.contactIds || [],
      selectionMode: message.contactIds && message.contactIds.length > 0 ? 'contacts' : 'list',
      template: message.template,
      imageUrl: message.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleScheduleMessage = () => {
    if (!newSchedule.campaignName || !newSchedule.scheduledDate || !newSchedule.scheduledTime || !newSchedule.template) {
      showError('Por favor completa todos los campos');
      return;
    }

    // Validar que haya contactos seleccionados (ya sea por lista o selección directa)
    const hasContactsSelected =
      (newSchedule.selectionMode === 'list' && newSchedule.contactListId) ||
      (newSchedule.selectionMode === 'contacts' && newSchedule.contactIds.length > 0);

    if (!hasContactsSelected) {
      showError('Por favor selecciona al menos un contacto o una lista');
      return;
    }

    let contactCount = 0;
    let contactListName = '';

    if (newSchedule.selectionMode === 'list') {
      const selectedList = contactLists.find(list => list.id === newSchedule.contactListId);
      contactCount = selectedList?.contacts?.length || 0;
      contactListName = selectedList?.name || 'Lista desconocida';
    } else {
      contactCount = newSchedule.contactIds.length;
      contactListName = 'Selección personalizada';
    }

    if (editingMessage) {
      // EDITAR mensaje existente
      const updatedMessages = scheduledMessages.map(msg =>
        msg.id === editingMessage.id
          ? {
              ...msg,
              campaignName: newSchedule.campaignName,
              scheduledDate: newSchedule.scheduledDate,
              scheduledTime: newSchedule.scheduledTime,
              ...(newSchedule.selectionMode === 'list'
                ? {
                    contactListId: newSchedule.contactListId,
                    contactListName: contactListName,
                    contactIds: undefined
                  }
                : {
                    contactIds: newSchedule.contactIds,
                    contactListName: contactListName,
                    contactListId: undefined
                  }
              ),
              contactCount: contactCount,
              template: newSchedule.template,
              imageUrl: newSchedule.imageUrl || undefined
            }
          : msg
      );

      setScheduledMessages(updatedMessages);
      saveScheduledMessages(updatedMessages);
      showSuccess(`Campaña "${newSchedule.campaignName}" actualizada exitosamente`);
    } else {
      // CREAR nuevo mensaje
      const scheduledMessage: ScheduledMessage = {
        id: Date.now().toString(),
        campaignName: newSchedule.campaignName,
        scheduledDate: newSchedule.scheduledDate,
        scheduledTime: newSchedule.scheduledTime,
        ...(newSchedule.selectionMode === 'list'
          ? {
              contactListId: newSchedule.contactListId,
              contactListName: contactListName
            }
          : {
              contactIds: newSchedule.contactIds,
              contactListName: contactListName
            }
        ),
        contactCount: contactCount,
        template: newSchedule.template,
        imageUrl: newSchedule.imageUrl || undefined,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const updatedMessages = [...scheduledMessages, scheduledMessage];
      setScheduledMessages(updatedMessages);
      saveScheduledMessages(updatedMessages);
      showSuccess(`Campaña "${newSchedule.campaignName}" programada exitosamente con ${contactCount} contactos`);
    }

    // Reset form
    setShowModal(false);
    setEditingMessage(null);
    setNewSchedule({
      campaignName: '',
      scheduledDate: '',
      scheduledTime: '',
      contactListId: '',
      contactIds: [],
      selectionMode: 'list',
      template: '',
      imageUrl: ''
    });
  };

  const handleContactSelectionConfirm = (selectedIds: string[]) => {
    setNewSchedule({
      ...newSchedule,
      contactIds: selectedIds,
      selectionMode: 'contacts'
    });
  };

  const handleCancelMessage = (messageId: string) => {
    const message = scheduledMessages.find(msg => msg.id === messageId);
    if (window.confirm(`¿Estás seguro de que quieres cancelar "${message?.campaignName}"?`)) {
      const updatedMessages = scheduledMessages.map(msg =>
        msg.id === messageId ? { ...msg, status: 'cancelled' as const } : msg
      );
      setScheduledMessages(updatedMessages);
      saveScheduledMessages(updatedMessages);
      showSuccess('Campaña cancelada exitosamente');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const message = scheduledMessages.find(msg => msg.id === messageId);
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${message?.campaignName}"?`)) {
      const updatedMessages = scheduledMessages.filter(msg => msg.id !== messageId);
      setScheduledMessages(updatedMessages);
      saveScheduledMessages(updatedMessages);
      showSuccess('Campaña eliminada exitosamente');
    }
  };

  const getStatusBadge = (status: ScheduledMessage['status']) => {
    const statusConfig = {
      pending: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', label: 'Pendiente', icon: 'fas fa-clock' },
      sent: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Enviado', icon: 'fas fa-check' },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Cancelado', icon: 'fas fa-times' }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${config.color}`}>
        <i className={`${config.icon} mr-1`}></i>
        {config.label}
      </span>
    );
  };

  const isDateTimePassed = (date: string, time: string) => {
    const scheduledDateTime = new Date(`${date}T${time}`);
    return scheduledDateTime < new Date();
  };

  const pendingMessages = scheduledMessages.filter(msg => msg.status === 'pending');
  const sentMessages = scheduledMessages.filter(msg => msg.status === 'sent');
  const cancelledMessages = scheduledMessages.filter(msg => msg.status === 'cancelled');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Programador de Mensajes</h1>
          <p className="text-gray-600 dark:text-gray-300">Programa tus campañas para que se envíen automáticamente</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <i className="fas fa-clock"></i>
          <span>Programar Envío</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-colors duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Mensajes Pendientes</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingMessages.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-colors duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
              <i className="fas fa-check"></i>
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Mensajes Enviados</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sentMessages.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-colors duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
              <i className="fas fa-times"></i>
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Mensajes Cancelados</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cancelledMessages.length}</p>
        </div>
      </div>

      {/* Scheduled Messages Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mensajes Programados</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Programada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lista de Contactos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contactos
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
              {scheduledMessages.map((message) => (
                <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{message.campaignName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{message.template}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <i className="fas fa-calendar mr-2 text-gray-400 dark:text-gray-500"></i>
                      {new Date(message.scheduledDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <i className="fas fa-clock mr-2 text-gray-400 dark:text-gray-500"></i>
                      {message.scheduledTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {message.contactListName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{message.contactCount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(message.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {message.status === 'pending' && !isDateTimePassed(message.scheduledDate, message.scheduledTime) && (
                        <>
                          <button
                            onClick={() => handleEditMessage(message)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleCancelMessage(message.id)}
                            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 p-1 rounded"
                            title="Cancelar"
                          >
                            <i className="fas fa-ban"></i>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded"
                        title="Eliminar"
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

        {scheduledMessages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600">
              <i className="fas fa-clock text-8xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No hay mensajes programados</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Programa tu primer mensaje para enviarlo automáticamente</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Programar Primer Mensaje
            </button>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingMessage ? 'Editar Mensaje Programado' : 'Programar Envío de Mensaje'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Campaña <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newSchedule.campaignName}
                  onChange={(e) => setNewSchedule({ ...newSchedule, campaignName: e.target.value })}
                  placeholder="Ejemplo: Promoción Fin de Semana"
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={newSchedule.scheduledDate}
                    onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={newSchedule.scheduledTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, scheduledTime: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                  />
                </div>
              </div>

              {/* Contact Selection Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Destinatarios <span className="text-red-500 dark:text-red-400">*</span>
                </label>

                {/* Selection Mode Tabs */}
                <div className="flex space-x-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setNewSchedule({ ...newSchedule, selectionMode: 'list', contactIds: [] })}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      newSchedule.selectionMode === 'list'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <i className="fas fa-list mr-2"></i>
                    Lista Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSchedule({ ...newSchedule, selectionMode: 'contacts', contactListId: '' })}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      newSchedule.selectionMode === 'contacts'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <i className="fas fa-user-friends mr-2"></i>
                    Selección Avanzada
                  </button>
                </div>

                {/* List Selection Mode */}
                {newSchedule.selectionMode === 'list' && (
                  <select
                    value={newSchedule.contactListId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, contactListId: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                  >
                    <option value="">Selecciona una lista</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.contacts?.length || 0} contactos)
                      </option>
                    ))}
                  </select>
                )}

                {/* Advanced Contact Selection Mode */}
                {newSchedule.selectionMode === 'contacts' && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                    {newSchedule.contactIds.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            <i className="fas fa-check-circle text-green-600 mr-2"></i>
                            {newSchedule.contactIds.length} contacto(s) seleccionado(s)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowContactSelector(true)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Modificar selección
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewSchedule({ ...newSchedule, contactIds: [] })}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          <i className="fas fa-times mr-1"></i>
                          Limpiar selección
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowContactSelector(true)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
                      >
                        <i className="fas fa-users"></i>
                        <span>Seleccionar Contactos</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plantilla <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  value={newSchedule.template}
                  onChange={(e) => setNewSchedule({ ...newSchedule, template: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                >
                  <option value="">Selecciona una plantilla</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    No hay plantillas disponibles. Sincroniza plantillas desde la sección Plantillas.
                  </p>
                )}
              </div>

              {/* Image URL field - only show if template has image header */}
              {newSchedule.template && templates.find(t => t.name === newSchedule.template)?.components?.some((c: any) => c.type === 'HEADER' && c.format === 'IMAGE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-image mr-1"></i>
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={newSchedule.imageUrl}
                    onChange={(e) => setNewSchedule({ ...newSchedule, imageUrl: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-300"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <i className="fas fa-info-circle mr-1"></i>
                    La plantilla seleccionada incluye una imagen en el encabezado. Proporciona la URL de la imagen que deseas enviar.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingMessage(null);
                  setNewSchedule({
                    campaignName: '',
                    scheduledDate: '',
                    scheduledTime: '',
                    contactListId: '',
                    contactIds: [],
                    selectionMode: 'list',
                    template: '',
                    imageUrl: ''
                  });
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleScheduleMessage}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all"
              >
                {editingMessage ? 'Guardar Cambios' : 'Programar Mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Selector Modal */}
      <ContactSelector
        isOpen={showContactSelector}
        onClose={() => setShowContactSelector(false)}
        onConfirm={handleContactSelectionConfirm}
        initialSelectedIds={newSchedule.contactIds}
        title="Seleccionar Contactos para Campaña"
        confirmText="Confirmar Selección"
        multiSelect={true}
      />
    </div>
  );
}
