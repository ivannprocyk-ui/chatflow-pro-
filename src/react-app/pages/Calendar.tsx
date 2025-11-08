import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isBefore, startOfDay, addWeeks, addMonths, differenceInMinutes, isWithinInterval, endOfDay } from 'date-fns';
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

interface RecurrenceConfig {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  endDate?: Date;
  occurrences?: number;
}

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
  recurrence?: RecurrenceConfig;
  parentEventId?: string; // For recurring event instances
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
    notes: '',
    recurrenceFrequency: 'none' as RecurrenceConfig['frequency'],
    recurrenceEndDate: '',
    recurrenceOccurrences: ''
  });
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilters, setTypeFilters] = useState<CalendarEventData['type'][]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const { showSuccess, showError } = useToast();
  const crmConfig = loadCRMConfig();

  useEffect(() => {
    loadEvents();
    setCrmContacts(loadCRMData());

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check for upcoming events every minute
    const notificationInterval = setInterval(() => {
      checkUpcomingEvents();
    }, 60000); // Check every minute

    // Initial check
    checkUpcomingEvents();

    return () => clearInterval(notificationInterval);
  }, [events]);

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

  const checkUpcomingEvents = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const now = new Date();
      const notifiedKey = 'chatflow_notified_events';
      const notifiedEvents = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

      events.forEach(event => {
        const eventStart = new Date(event.start);
        const minutesUntilEvent = (eventStart.getTime() - now.getTime()) / 60000;

        // Notify 15 minutes before and at event start time
        const shouldNotify = (
          (minutesUntilEvent >= 14 && minutesUntilEvent <= 16) || // 15 min before
          (minutesUntilEvent >= -1 && minutesUntilEvent <= 1)      // Event starting now
        );

        if (shouldNotify && !notifiedEvents.includes(event.id)) {
          const notificationBody = minutesUntilEvent > 5
            ? `Comienza en 15 minutos - ${format(eventStart, 'HH:mm', { locale: es })}`
            : `Comienza ahora - ${format(eventStart, 'HH:mm', { locale: es })}`;

          new Notification(`📅 ${event.title}`, {
            body: notificationBody,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: event.id,
            requireInteraction: false
          });

          // Mark as notified
          notifiedEvents.push(event.id);
          localStorage.setItem(notifiedKey, JSON.stringify(notifiedEvents));

          // Clean old notifications after 24 hours
          setTimeout(() => {
            const updated = notifiedEvents.filter((id: string) => id !== event.id);
            localStorage.setItem(notifiedKey, JSON.stringify(updated));
          }, 24 * 60 * 60 * 1000);
        }
      });
    }
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
      notes: '',
      recurrenceFrequency: 'none',
      recurrenceEndDate: '',
      recurrenceOccurrences: ''
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
      notes: event.notes || '',
      recurrenceFrequency: event.recurrence?.frequency || 'none',
      recurrenceEndDate: event.recurrence?.endDate ? format(event.recurrence.endDate, 'yyyy-MM-dd') : '',
      recurrenceOccurrences: event.recurrence?.occurrences?.toString() || ''
    });
    setShowModal(true);
  };

  const generateRecurringEvents = (baseEvent: CalendarEventData): CalendarEventData[] => {
    if (!baseEvent.recurrence || baseEvent.recurrence.frequency === 'none') {
      return [baseEvent];
    }

    const recurringEvents: CalendarEventData[] = [baseEvent];
    const { frequency, endDate, occurrences } = baseEvent.recurrence;
    const eventDuration = differenceInMinutes(baseEvent.end, baseEvent.start);

    let currentDate = baseEvent.start;
    let count = 1;
    const maxOccurrences = occurrences || 52; // Default 52 if not specified
    const maxDate = endDate || addMonths(baseEvent.start, 12); // Default 1 year

    while (count < maxOccurrences && isBefore(currentDate, maxDate)) {
      // Calculate next occurrence
      switch (frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }

      if (isBefore(currentDate, maxDate)) {
        const instanceStart = currentDate;
        const instanceEnd = new Date(instanceStart.getTime() + eventDuration * 60 * 1000);

        recurringEvents.push({
          ...baseEvent,
          id: `${baseEvent.id}-${count}`,
          start: instanceStart,
          end: instanceEnd,
          parentEventId: baseEvent.id
        });

        count++;
      }
    }

    return recurringEvents;
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

    // Build recurrence config
    const recurrence: RecurrenceConfig = {
      frequency: newEvent.recurrenceFrequency,
      endDate: newEvent.recurrenceEndDate ? new Date(newEvent.recurrenceEndDate) : undefined,
      occurrences: newEvent.recurrenceOccurrences ? parseInt(newEvent.recurrenceOccurrences) : undefined
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
      color: eventColors[newEvent.type],
      recurrence: recurrence.frequency !== 'none' ? recurrence : undefined
    };

    let updatedEvents;
    if (selectedEvent) {
      // Remove old instances if updating a recurring event
      updatedEvents = events.filter(e => e.parentEventId !== selectedEvent.id && e.id !== selectedEvent.id);
      const newInstances = generateRecurringEvents(eventData);
      updatedEvents = [...updatedEvents, ...newInstances];
      showSuccess('Evento actualizado exitosamente');
    } else {
      // Generate recurring instances for new event
      const newInstances = generateRecurringEvents(eventData);
      updatedEvents = [...events, ...newInstances];
      showSuccess(newInstances.length > 1
        ? `Evento creado con ${newInstances.length} ocurrencias`
        : 'Evento creado exitosamente');
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

  const handleExportToWhatsApp = () => {
    if (!selectedEvent) return;

    const typeLabels = {
      call: '📞 Llamada',
      meeting: '🤝 Reunión',
      followup: '📋 Seguimiento',
      reminder: '⏰ Recordatorio',
      other: '📌 Otro'
    };

    const message = `
*${selectedEvent.title}*

📅 *Fecha:* ${format(selectedEvent.start, "dd 'de' MMMM 'de' yyyy", { locale: es })}
🕐 *Hora:* ${format(selectedEvent.start, 'HH:mm', { locale: es })} - ${format(selectedEvent.end, 'HH:mm', { locale: es })}
🏷️ *Tipo:* ${typeLabels[selectedEvent.type]}
${selectedEvent.contactName ? `👤 *Contacto:* ${selectedEvent.contactName}\n` : ''}${selectedEvent.notes ? `\n📝 *Notas:*\n${selectedEvent.notes}` : ''}

_Evento creado desde ChatFlow Pro_
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    showSuccess('Abriendo WhatsApp para compartir evento');
  };

  const handleMoveEvent = ({ event, start, end }: { event: CalendarEventData; start: Date; end: Date }) => {
    const updatedEvent = {
      ...event,
      start,
      end
    };

    let updatedEvents;
    if (event.parentEventId) {
      // Moving a recurring event instance - only update this instance
      updatedEvents = events.map(e => e.id === event.id ? updatedEvent : e);
      showSuccess('Instancia del evento movida');
    } else if (event.recurrence && event.recurrence.frequency !== 'none') {
      // Moving parent of recurring series - update all instances
      const timeDiff = start.getTime() - event.start.getTime();
      updatedEvents = events.map(e => {
        if (e.id === event.id || e.parentEventId === event.id) {
          return {
            ...e,
            start: new Date(e.start.getTime() + timeDiff),
            end: new Date(e.end.getTime() + timeDiff)
          };
        }
        return e;
      });
      showSuccess('Serie completa de eventos movida');
    } else {
      // Moving regular event
      updatedEvents = events.map(e => e.id === event.id ? updatedEvent : e);
      showSuccess('Evento movido');
    }

    saveEvents(updatedEvents);
  };

  const handleResizeEvent = ({ event, start, end }: { event: CalendarEventData; start: Date; end: Date }) => {
    const updatedEvent = {
      ...event,
      start,
      end
    };

    const updatedEvents = events.map(e => e.id === event.id ? updatedEvent : e);
    saveEvents(updatedEvents);
    showSuccess('Duración del evento actualizada');
  };

  const handleExportToICS = () => {
    if (!selectedEvent) return;

    const formatDateToICS = (date: Date): string => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };

    const escapeICS = (str: string): string => {
      return str.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ChatFlow Pro//Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:ChatFlow Pro',
      'X-WR-TIMEZONE:America/Mexico_City',
      'BEGIN:VEVENT',
      `UID:${selectedEvent.id}@chatflowpro.com`,
      `DTSTAMP:${formatDateToICS(new Date())}`,
      `DTSTART:${formatDateToICS(selectedEvent.start)}`,
      `DTEND:${formatDateToICS(selectedEvent.end)}`,
      `SUMMARY:${escapeICS(selectedEvent.title)}`,
      selectedEvent.notes ? `DESCRIPTION:${escapeICS(selectedEvent.notes)}` : '',
      selectedEvent.contactName ? `ORGANIZER;CN=${escapeICS(selectedEvent.contactName)}:mailto:noreply@chatflowpro.com` : '',
      `CATEGORIES:${selectedEvent.type.toUpperCase()}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEvent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Archivo .ics descargado - Importa en Google Calendar o Outlook');
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

  const getFilteredEvents = () => {
    let filtered = events;

    // Apply type filters
    if (typeFilters.length > 0) {
      filtered = filtered.filter(event => typeFilters.includes(event.type));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.contactName?.toLowerCase().includes(query) ||
        event.notes?.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const upcomingEvents = useMemo(() => {
    let upcoming = getUpcomingEvents();

    // Apply type filters
    if (typeFilters.length > 0) {
      upcoming = upcoming.filter(event => typeFilters.includes(event.type));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      upcoming = upcoming.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.contactName?.toLowerCase().includes(query) ||
        event.notes?.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query)
      );
    }

    return upcoming;
  }, [events, searchQuery, typeFilters]);

  const filteredEvents = getFilteredEvents();

  const toggleTypeFilter = (type: CalendarEventData['type']) => {
    setTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="p-6 w-full bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <i className="fas fa-calendar-alt text-blue-600 mr-3"></i>
            Agenda y Calendario
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Organiza eventos, reuniones y recordatorios vinculados a tus contactos</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <i className="fas fa-calendar mr-2"></i>
            Calendario
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <i className="fas fa-list mr-2"></i>
            Lista
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div style={{ height: '700px' }}>
              <BigCalendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleMoveEvent}
                onEventResize={handleResizeEvent}
                selectable
                resizable
                draggableAccessor={() => true}
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
                  noEventsInRange: searchQuery ? "No se encontraron eventos" : "No hay eventos en este rango",
                  showMore: (total) => `+ Ver más (${total})`
                }}
              />
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="space-y-4 max-h-[700px] overflow-y-auto">
              {filteredEvents.length > 0 ? (
                filteredEvents
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                      style={{ borderLeftWidth: '4px', borderLeftColor: event.color }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {event.title}
                            </h3>
                            <span
                              className="px-2 py-1 rounded-md text-xs font-medium text-white"
                              style={{ backgroundColor: event.color }}
                            >
                              {event.type.toUpperCase()}
                            </span>
                            {event.recurrence && event.recurrence.frequency !== 'none' && (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                <i className="fas fa-repeat mr-1"></i>
                                {event.recurrence.frequency === 'daily' && 'Diario'}
                                {event.recurrence.frequency === 'weekly' && 'Semanal'}
                                {event.recurrence.frequency === 'monthly' && 'Mensual'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="flex items-center">
                              <i className="fas fa-calendar text-blue-600 mr-2"></i>
                              {format(event.start, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-clock text-green-600 mr-2"></i>
                              {format(event.start, 'HH:mm', { locale: es })} - {format(event.end, 'HH:mm', { locale: es })}
                            </span>
                          </div>

                          {event.contactName && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <i className="fas fa-user text-purple-600 mr-2"></i>
                              {event.contactName}
                            </div>
                          )}

                          {event.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                              {event.notes}
                            </p>
                          )}
                        </div>

                        <div className="ml-4 flex flex-col items-end space-y-2">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isBefore(event.end, new Date())
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                : isToday(event.start)
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {isBefore(event.end, new Date())
                              ? 'Pasado'
                              : isToday(event.start)
                              ? 'Hoy'
                              : 'Próximo'}
                          </div>
                          <i className="fas fa-chevron-right text-gray-400 dark:text-gray-500"></i>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-16">
                  <i className="fas fa-calendar-times text-gray-400 dark:text-gray-500 text-5xl mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No hay eventos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || typeFilters.length > 0
                      ? 'No se encontraron eventos con los filtros aplicados'
                      : 'Comienza creando tu primer evento'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eventos..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Event Type Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtrar por Tipo</h3>
              {typeFilters.length > 0 && (
                <button
                  onClick={() => setTypeFilters([])}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'call' as const, label: '📞 Llamada', color: '#3b82f6' },
                { type: 'meeting' as const, label: '🤝 Reunión', color: '#8b5cf6' },
                { type: 'followup' as const, label: '📋 Seguimiento', color: '#06b6d4' },
                { type: 'reminder' as const, label: '⏰ Recordatorio', color: '#10b981' },
                { type: 'other' as const, label: '📌 Otro', color: '#6b7280' }
              ].map(({ type, label, color }) => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all transform hover:scale-105 ${
                    typeFilters.includes(type)
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={typeFilters.includes(type) ? { backgroundColor: color } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
            {typeFilters.length > 0 && (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {typeFilters.length} filtro{typeFilters.length !== 1 ? 's' : ''} activo{typeFilters.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

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
                notes: '',
                recurrenceFrequency: 'none',
                recurrenceEndDate: '',
                recurrenceOccurrences: ''
              });
              setShowModal(true);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Nuevo Evento</span>
          </button>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-bell text-amber-500 mr-2"></i>
              Próximos 7 Días
            </h3>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className="border-l-4 pl-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg transition-all hover:shadow-md transform hover:-translate-y-1"
                    style={{ borderColor: event.color }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{event.title}</h4>
                        {event.contactName && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            <i className="fas fa-user mr-1"></i>
                            {event.contactName}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(event.start, 'dd/MM')}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <i className="fas fa-clock mr-1"></i>
                      {format(event.start, 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <i className="fas fa-calendar-check text-4xl mb-2"></i>
                <p className="text-sm">No hay eventos próximos</p>
              </div>
            )}
          </div>

          {/* Event Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-pie text-blue-600 mr-2"></i>
              Estadísticas
            </h3>

            {/* Total Events */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total de Eventos</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{events.length}</span>
              </div>
            </div>

            {/* Events by Type */}
            <div className="space-y-2.5 mb-4">
              {[
                { type: 'call' as const, label: '📞 Llamadas', color: '#3b82f6' },
                { type: 'meeting' as const, label: '🤝 Reuniones', color: '#8b5cf6' },
                { type: 'followup' as const, label: '📋 Seguimientos', color: '#06b6d4' },
                { type: 'reminder' as const, label: '⏰ Recordatorios', color: '#10b981' },
                { type: 'other' as const, label: '📌 Otros', color: '#6b7280' }
              ].map(({ type, label, color }) => {
                const count = events.filter(e => e.type === type).length;
                const percentage = events.length > 0 ? (count / events.length * 100).toFixed(0) : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{label}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-green-600 dark:text-green-400 mb-1">Próximos 7 días</div>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  {getUpcomingEvents().length}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pasados</div>
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {events.filter(e => isBefore(e.end, new Date())).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <i className="fas fa-calendar-plus text-blue-600 mr-3"></i>
                  {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título del Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="ej: Llamada con cliente"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Evento <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vincular a Contacto (Opcional)
                </label>
                <select
                  value={newEvent.contactId}
                  onChange={(e) => setNewEvent({ ...newEvent, contactId: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas
                </label>
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  rows={3}
                  placeholder="Detalles adicionales del evento..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Recurrence Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <i className="fas fa-repeat text-purple-600 mr-2"></i>
                  Repetir Evento
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Frequency */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frecuencia
                    </label>
                    <select
                      value={newEvent.recurrenceFrequency}
                      onChange={(e) => setNewEvent({ ...newEvent, recurrenceFrequency: e.target.value as RecurrenceConfig['frequency'] })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="none">🚫 No repetir</option>
                      <option value="daily">📅 Diariamente</option>
                      <option value="weekly">📆 Semanalmente</option>
                      <option value="monthly">🗓️ Mensualmente</option>
                    </select>
                  </div>

                  {newEvent.recurrenceFrequency !== 'none' && (
                    <>
                      {/* End Date */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Finaliza el (Opcional)
                        </label>
                        <input
                          type="date"
                          value={newEvent.recurrenceEndDate}
                          onChange={(e) => setNewEvent({ ...newEvent, recurrenceEndDate: e.target.value })}
                          min={newEvent.date}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      {/* Occurrences */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          N° Repeticiones
                        </label>
                        <input
                          type="number"
                          value={newEvent.recurrenceOccurrences}
                          onChange={(e) => setNewEvent({ ...newEvent, recurrenceOccurrences: e.target.value })}
                          placeholder="Ej: 10"
                          min="1"
                          max="365"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      {/* Info message */}
                      <div className="md:col-span-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          <i className="fas fa-info-circle mr-2"></i>
                          {newEvent.recurrenceFrequency === 'daily' && 'Este evento se repetirá todos los días'}
                          {newEvent.recurrenceFrequency === 'weekly' && 'Este evento se repetirá cada semana'}
                          {newEvent.recurrenceFrequency === 'monthly' && 'Este evento se repetirá cada mes'}
                          {newEvent.recurrenceEndDate && ` hasta el ${format(new Date(newEvent.recurrenceEndDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}`}
                          {newEvent.recurrenceOccurrences && ` por ${newEvent.recurrenceOccurrences} veces`}
                          {!newEvent.recurrenceEndDate && !newEvent.recurrenceOccurrences && ' (máximo 52 repeticiones o 1 año)'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-between gap-3">
              <div className="flex space-x-3">
                {selectedEvent && (
                  <>
                    <button
                      onClick={handleDeleteEvent}
                      className="px-6 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-all hover:shadow-lg transform hover:scale-105 flex items-center space-x-2"
                    >
                      <i className="fas fa-trash"></i>
                      <span>Eliminar</span>
                    </button>
                    <button
                      onClick={handleExportToWhatsApp}
                      className="px-6 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-all hover:shadow-lg transform hover:scale-105 flex items-center space-x-2"
                    >
                      <i className="fab fa-whatsapp"></i>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={handleExportToICS}
                      className="px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all hover:shadow-lg transform hover:scale-105 flex items-center space-x-2"
                    >
                      <i className="fas fa-calendar-alt"></i>
                      <span>Exportar .ics</span>
                    </button>
                  </>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                  }}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg transform hover:scale-105 active:scale-95 flex items-center space-x-2"
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
