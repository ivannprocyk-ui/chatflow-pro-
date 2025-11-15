# 🔧 CAMBIOS PENDIENTES - CHATFLOW PRO

## ✅ COMPLETADO:
1. ✅ Dashboard de plantillas mejorado - Muestra todas las plantillas con estados
2. ✅ Vista Kanban eliminada - No funcionaba correctamente
3. ✅ Vista de tarjetas uniformizada - Todas del mismo tamaño
4. ✅ Roadmap por fases creado - ROADMAP_FASES.md

## ⏳ PENDIENTE:

### 1. REDISEÑAR VISTA DE LISTA DEL CRM

**Archivo:** `src/react-app/pages/CRMPanel.tsx`
**Línea:** Aproximadamente 1335
**Sección:** `{/* List View */}`

**Cambios a aplicar:**

Reemplazar la vista de lista actual con este diseño moderno estilo Calendar:

```tsx
        {/* List View - Modern Calendar-Style Design */}
        {viewMode === 'list' && (
          <div className="space-y-3 p-4 animate-fadeIn">
            {filteredContacts.map((contact) => {
              // Status color mapping
              const statusColors: any = {
                lead: '#eab308',
                contacted: '#3b82f6',
                qualified: '#8b5cf6',
                proposal: '#f97316',
                negotiation: '#ec4899',
                won: '#10b981',
                lost: '#ef4444'
              };
              const borderColor = statusColors[contact.status] || '#6b7280';

              return (
                <div
                  key={contact.id}
                  className={`border-l-4 pl-4 pr-4 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-r-xl transition-all hover:shadow-lg transform hover:-translate-y-1 bg-white dark:bg-gray-800 ${ selectedContacts.has(contact.id) ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                  style={{ borderColor }}
                  onClick={() => handleViewContact(contact)}
                >
                  <div className="flex items-start justify-between">
                    {/* Left: Checkbox + Avatar + Info */}
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectContact(contact.id, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        />
                      </div>

                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full ${getAvatarColor(contact)} flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white dark:ring-gray-800`}>
                        {getContactInitials(contact)}
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + Status + Tags */}
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {getContactName(contact)}
                          </h4>
                          {getStatusBadge(contact.status)}
                          {duplicateContactIds.has(contact.id) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              <i className="fas fa-exclamation-triangle mr-1"></i>
                              Duplicado
                            </span>
                          )}
                          {renderTagBadges(contact, 3)}
                        </div>

                        {/* Contact Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {config.fields
                            .filter(f => f.visible && f.name.toLowerCase() !== 'nombre' && f.name.toLowerCase() !== 'name')
                            .sort((a, b) => a.order - b.order)
                            .slice(0, 4)
                            .map((field) => (
                              <div key={field.name} className="flex items-center space-x-2 text-sm">
                                <i className={`fas ${
                                  field.type === 'tel' || field.type === 'phone' ? 'fa-phone' :
                                  field.type === 'email' ? 'fa-envelope' :
                                  field.type === 'currency' ? 'fa-dollar-sign' :
                                  field.type === 'date' ? 'fa-calendar' :
                                  'fa-info-circle'
                                } text-gray-400 dark:text-gray-500 flex-shrink-0`}></i>
                                <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
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
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <i className="fas fa-clock flex-shrink-0"></i>
                              <span className="truncate">
                                {new Date(contact.lastInteraction).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex-shrink-0 flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewContact(contact);
                        }}
                        className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditContact(contact);
                        }}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContact(contact.id);
                        }}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
```

**Características del nuevo diseño:**
- ✨ Border-left de 4px con color según estado
- ✨ Hover effect con shadow y translate
- ✨ Avatar más grande (14x14) con ring
- ✨ Click en toda la fila para ver detalles
- ✨ Checkbox más grande (5x5)
- ✨ Mejor spacing y padding
- ✨ Grid responsivo de datos
- ✨ Stop propagation en botones de acción

---

### 2. ARREGLAR ENVÍO PROGRAMADO

**Problema reportado:** "El envío programado no cambia de estado y tampoco envía el mensaje"

**Archivo:** `src/react-app/AppNew.tsx`
**Líneas:** 299-316 (sistema de ejecución)

**Debugging necesario:**

1. **Abrir consola del navegador (F12) y verificar:**
   - ¿Aparecen logs `[ScheduledExecution]`?
   - ¿Cada 60 segundos hay un check?
   - ¿Qué dice el log cuando hay un mensaje pendiente?

2. **Posibles problemas:**
   - API de WhatsApp no configurada
   - Formato de fecha/hora incorrecto en los mensajes
   - Contact lists vacíos o ID incorrectos
   - Template no encontrado o no aprobado

3. **Agregar más logging temporal:**

En `AppNew.tsx`, línea 282, cambiar:

```tsx
const checkAndExecuteScheduledMessages = async () => {
  if (isExecutingRef.current) {
    console.log('[ScheduledExecution] Already executing, skipping check');
    return;
  }

  const now = new Date();
  const allMessages = loadScheduledMessages();
  const pendingMessages = allMessages.filter((msg: any) => msg.status === 'pending');

  console.log(`[ScheduledExecution] ========== CHECK START ==========`);
  console.log(`[ScheduledExecution] Current time: ${now.toLocaleString('es-AR')}`);
  console.log(`[ScheduledExecution] Total messages: ${allMessages.length}`);
  console.log(`[ScheduledExecution] Pending messages: ${pendingMessages.length}`);
  console.log(`[ScheduledExecution] All messages:`, allMessages);

  for (const message of pendingMessages) {
    const scheduledDateTime = new Date(`${message.scheduledDate}T${message.scheduledTime}`);
    console.log(`[ScheduledExecution] ----------------------------------`);
    console.log(`[ScheduledExecution] Message: "${message.campaignName}"`);
    console.log(`[ScheduledExecution] Scheduled for: ${scheduledDateTime.toLocaleString('es-AR')}`);
    console.log(`[ScheduledExecution] Current time: ${now.toLocaleString('es-AR')}`);
    console.log(`[ScheduledExecution] Should execute: ${now >= scheduledDateTime}`);
    console.log(`[ScheduledExecution] Message object:`, message);

    // If scheduled time has passed, execute it
    if (now >= scheduledDateTime) {
      console.log(`[ScheduledExecution] ✅ EXECUTING NOW!`);
      await executeScheduledMessage(message);
    } else {
      console.log(`[ScheduledExecution] ⏰ Waiting... ${Math.round((scheduledDateTime.getTime() - now.getTime()) / 1000)} seconds remaining`);
    }
  }
  console.log(`[ScheduledExecution] ========== CHECK END ==========`);
};
```

4. **Verificar datos del mensaje programado:**
   - En localStorage, buscar: `chatflow_scheduled_messages`
   - Verificar que tenga:
     ```json
     {
       "id": "...",
       "campaignName": "...",
       "scheduledDate": "2025-01-13",  // formato YYYY-MM-DD
       "scheduledTime": "14:30",        // formato HH:mm
       "status": "pending",
       "template": "...",
       "contactListId": "..." o "contactIds": [...]
     }
     ```

5. **Test manual:**
   - Crear mensaje programado para 2 minutos en el futuro
   - Abrir consola
   - Esperar y observar los logs cada 60 segundos
   - Ver si ejecuta cuando llega la hora

---

## 📝 NOTAS ADICIONALES:

### Formato de teléfono:
- Ya está implementado `formatArgentinaPhone()` en storage.ts
- Se aplica automáticamente en CRM y Contact Lists

### Message History:
- Ya rediseñado estilo WhatsApp chat
- Muestra todos los mensajes con scroll

### Templates Dashboard:
- Muestra todas las plantillas con badges de estado
- Grid de 3 columnas

### Roadmap:
- Documento completo en `ROADMAP_FASES.md`
- 5 fases detalladas con tiempos estimados
- Recomendación: Empezar con Fase 1 (Analytics)

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS:

1. Aplicar cambios de vista de lista (copiar/pegar código de arriba)
2. Agregar logging detallado para debug de envío programado
3. Probar envío programado con logs en consola
4. Una vez funcionando, comenzar Fase 1 del roadmap (Analytics)
