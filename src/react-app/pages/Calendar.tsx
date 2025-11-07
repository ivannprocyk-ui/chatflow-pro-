import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { loadCRMData, loadCRMConfig } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEventData extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  contactId?: string;
  contactName?: string;
  type: 'call' | 'meeting' | 'followup' | 'reminder' | 'other';
  notes?: string;
  color?: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    endTime: '',
    contactId: '',
    type: 'reminder' as CalendarEventData['type'],
    notes: ''
  });
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const { showSuccess, showError } = useToast();
  const crmConfig = loadCRMConfig();

  useEffect(() => {
    loadEvents();
    setCrmContacts(loadCRMData());
  }, []);

  const loadEvents = () => {
    const stored = localStorage.getItem('chatflow_calendar_events');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const eventsWithDates = parsed.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end)
        }));
        setEvents(eventsWithDates);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }
  };

  const saveEvents = (eventsToSave: CalendarEventData[]) => {
    localStorage.setItem('chatflow_calendar_events', JSON.stringify(eventsToSave));
    setEvents(eventsToSave);
  };

  const getUpcomingEvents = () => {
    const now = startOfDay(new Date());
    const next7Days = addDays(now, 7);
    return events.filter(e =>
      e.start >= now && e.start <= next7Days
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      date: format(start, 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      endTime: format(addDays(new Date(), 0).setHours(new Date().getHours() + 1), 'HH:mm'),
      contactId: '',
      type: 'reminder',
      notes: ''
    });
    setShowModal(true);
  };

  const handleSelectEvent = (event: CalendarEventData) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title,
      date: format(event.start, 'yyyy-MM-dd'),
      time: format(event.start, 'HH:mm'),
      endTime: format(event.end, 'HH:mm'),
      contactId: event.contactId || '',
      type: event.type,
      notes: event.notes || ''
    });
    setShowModal(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title.trim()) {
      showError('El título es requerido');
      return;
    }

    if (!newEvent.date || !newEvent.time) {
      showError('Fecha y hora son requeridas');
      return;
    }

    const startDateTime = new Date(`${newEvent.date}T${newEvent.time}`);
    const endDateTime = newEvent.endTime
      ? new Date(`${newEvent.date}T${newEvent.endTime}`)
      : new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour default

    const contact = crmContacts.find(c => c.id === newEvent.contactId);
    const nameField = crmConfig.fields.find(f =>
      f.name.toLowerCase().includes('nombre') ||
      f.name.toLowerCase().includes('name')
    );

    const eventColors = {
      call: '#3b82f6',
      meeting: '#8b5cf6',
      followup: '#06b6d4',
      reminder: '#10b981',
      other: '#6b7280'
    };

    const eventData: CalendarEventData = {
      id: selectedEvent?.id || Date.now().toString(),
      title: newEvent.title,
      start: startDateTime,
      end: endDateTime,
      contactId: newEvent.contactId || undefined,
      contactName: contact && nameField ? contact[nameField.name] : undefined,
      type: newEvent.type,
      notes: newEvent.notes,
      color: eventColors[newEvent.type]
    };

    let updatedEvents;
    if (selectedEvent) {
      updatedEvents = events.map(e => e.id === selectedEvent.id ? eventData : e);
      showSuccess('Evento actualizado exitosamente');
    } else {
      updatedEvents = [...events, eventData];
      showSuccess('Evento creado exitosamente');
    }

    saveEvents(updatedEvents);
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    if (confirm(`¿Eliminar el evento "${selectedEvent.title}"?`)) {
      const updatedEvents = events.filter(e => e.id !== selectedEvent.id);
      saveEvents(updatedEvents);
      showSuccess('Evento eliminado');
      setShowModal(false);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event: CalendarEventData) => {
    return {
      style: {
        backgroundColor: event.color || '#3b82f6',
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <i className="fas fa-calendar-alt text-blue-600 mr-3"></i>
            Agenda y Calendario
          </h1>
          <p className="text-gray-600">Organiza eventos, reuniones y recordatorios vinculados a tus contactos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6">
          <div style={{ height: '700px' }}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              culture="es"
              messages={{
                next: "Siguiente",
                previous: "Anterior",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "No hay eventos en este rango",
                showMore: (total) => `+ Ver más (${total})`
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Add Button */}
          <button
            onClick={() => {
              setSelectedEvent(null);
              setNewEvent({
                title: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                time: format(new Date(), 'HH:mm'),
                endTime: format(new Date().setHours(new Date().getHours() + 1), 'HH:mm'),
                contactId: '',
                type: 'reminder',
                notes: ''
              });
              setShowModal(true);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Nuevo Evento</span>
          </button>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-bell text-amber-500 mr-2"></i>
              Próximos 7 Días
            </h3>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className="border-l-4 pl-3 py-2 cursor-pointer hover:bg-gray-50 rounded-r-lg transition-colors"
                    style={{ borderColor: event.color }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                        {event.contactName && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            <i className="fas fa-user mr-1"></i>
                            {event.contactName}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(event.start, 'dd/MM')}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-clock mr-1"></i>
                      {format(event.start, 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-calendar-check text-4xl mb-2"></i>
                <p className="text-sm">No hay eventos próximos</p>
              </div>
            )}
          </div>

          {/* Event Types Legend */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Evento</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                <span>Llamada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
                <span>Reunión</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#06b6d4' }}></div>
                <span>Seguimiento</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span>Recordatorio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }}></div>
                <span>Otro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <i className="fas fa-calendar-plus text-blue-600 mr-3"></i>
                  {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="ej: Llamada con cliente"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evento <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                >
                  <option value="call">📞 Llamada</option>
                  <option value="meeting">🤝 Reunión</option>
                  <option value="followup">📋 Seguimiento</option>
                  <option value="reminder">⏰ Recordatorio</option>
                  <option value="other">📌 Otro</option>
                </select>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vincular a Contacto (Opcional)
                </label>
                <select
                  value={newEvent.contactId}
                  onChange={(e) => setNewEvent({ ...newEvent, contactId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Sin vincular</option>
                  {crmContacts.map(contact => {
                    const nameField = crmConfig.fields.find(f =>
                      f.name.toLowerCase().includes('nombre') ||
                      f.name.toLowerCase().includes('name')
                    );
                    const name = nameField ? contact[nameField.name] : contact.id;
                    return (
                      <option key={contact.id} value={contact.id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  rows={3}
                  placeholder="Detalles adicionales del evento..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between">
              {selectedEvent && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all flex items-center space-x-2"
                >
                  <i className="fas fa-trash"></i>
                  <span>Eliminar</span>
                </button>
              )}
              <div className={`flex space-x-3 ${!selectedEvent ? 'ml-auto' : ''}`}>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center space-x-2"
                >
                  <i className="fas fa-check"></i>
                  <span>{selectedEvent ? 'Actualizar' : 'Crear'} Evento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
