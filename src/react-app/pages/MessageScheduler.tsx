import { useState, useEffect } from 'react';
import { loadScheduledMessages, saveScheduledMessages, loadContactLists, loadConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

interface ScheduledMessage {
  id: string;
  campaignName: string;
  scheduledDate: string;
  scheduledTime: string;
  contactListId: string;
  contactListName: string;
  contactCount: number;
  template: string;
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
    template: ''
  });
  const config = loadConfig();
  const { showSuccess, showError } = useToast();

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
  }, []);

  const handleScheduleMessage = () => {
    if (!newSchedule.campaignName || !newSchedule.scheduledDate || !newSchedule.scheduledTime || !newSchedule.contactListId || !newSchedule.template) {
      showError('Por favor completa todos los campos');
      return;
    }

    const selectedList = contactLists.find(list => list.id === newSchedule.contactListId);

    const scheduledMessage: ScheduledMessage = {
      id: Date.now().toString(),
      campaignName: newSchedule.campaignName,
      scheduledDate: newSchedule.scheduledDate,
      scheduledTime: newSchedule.scheduledTime,
      contactListId: newSchedule.contactListId,
      contactListName: selectedList?.name || 'Lista desconocida',
      contactCount: selectedList?.contacts?.length || 0,
      template: newSchedule.template,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedMessages = [...scheduledMessages, scheduledMessage];
    setScheduledMessages(updatedMessages);
    saveScheduledMessages(updatedMessages);

    showSuccess(`Campaña "${newSchedule.campaignName}" programada exitosamente`);

    setShowModal(false);
    setNewSchedule({
      campaignName: '',
      scheduledDate: '',
      scheduledTime: '',
      contactListId: '',
      template: ''
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
                        <button
                          onClick={() => handleCancelMessage(message.id)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 p-1 rounded"
                          title="Cancelar"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Programar Envío de Mensaje</h2>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lista de Contactos <span className="text-red-500 dark:text-red-400">*</span>
                </label>
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
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleScheduleMessage}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all"
              >
                Programar Mensaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
