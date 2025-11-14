# 🚀 Guía de Inicio Rápido - ChatFlow Pro

## ⚠️ PRIMEROS PASOS OBLIGATORIOS

### 1. Configurar API de WhatsApp Business

Antes de poder usar el sistema, **DEBES** configurar tu API de WhatsApp:

1. Ve a **⚙️ Settings** (Configuración)
2. En la pestaña **"API Configuration"**
3. Completa los siguientes campos:
   - **Phone Number ID**: Tu ID de número de teléfono de WhatsApp Business
   - **WhatsApp Business Account ID (WABA ID)**: ID de tu cuenta de WhatsApp Business
   - **Access Token**: Token de acceso de Meta/Facebook
   - **API Version**: (por defecto: `v18.0`)

4. Click en **"Guardar Configuración"**

### 2. Sincronizar Plantillas de WhatsApp

Las plantillas son los mensajes aprobados por Meta que puedes enviar:

1. Ve a **📝 Plantillas** en el menú lateral
2. Click en **"Sincronizar Plantillas"** (botón azul arriba a la derecha)
3. Espera a que se carguen tus plantillas aprobadas
4. Verás el estado de cada plantilla (APPROVED, PENDING, REJECTED)

⚠️ **IMPORTANTE**: Solo puedes usar plantillas con estado **APPROVED**

### 3. Agregar Contactos

1. Ve a **👥 CRM Panel**
2. Click en **"Agregar Contacto"**
3. Completa al menos:
   - Nombre
   - Teléfono (formato internacional: +5491123456789)
4. Guarda el contacto

💡 **Tip**: Puedes importar múltiples contactos desde un CSV

---

## 🎯 Cómo Crear Tu Primera Automatización

### Paso 1: Crear la Automatización

1. Ve a **✨ Automatizaciones**
2. Click en **"Crear Automatización"** (botón morado)
3. Dale un nombre descriptivo (ej: "Bienvenida Nuevos Clientes")

### Paso 2: Añadir Nodos al Canvas

**Tipos de Nodos:**

#### 🟢 Trigger (Disparador)
**Qué hace**: Define CUÁNDO se ejecuta la automatización

**Opciones**:
- **Nuevo Contacto**: Cuando agregas un contacto nuevo
- **Cumpleaños**: En el cumpleaños del contacto
- **Contacto Inactivo**: Cuando pasa X días sin actividad
- **Cambio de Estado**: Cuando cambia el estado del contacto
- **Fecha Específica**: En una fecha/hora exacta
- **Tag Agregado**: Cuando le pones un tag específico
- **Sin Respuesta a Mensaje**: Cuando no responden en X horas
- **Manual**: Lo ejecutas tú manualmente

#### 🔵 Acción (Action)
**Qué hace**: Ejecuta UNA acción específica

**Opciones**:
- **📤 Enviar Mensaje**: Envía una plantilla de WhatsApp
- **🏷️ Agregar Tag**: Etiqueta al contacto
- **🗑️ Remover Tag**: Quita una etiqueta
- **✏️ Actualizar Campo**: Cambia nombre, email, etc.
- **🔄 Cambiar Estado**: Cambia a lead, cliente, etc.
- **📋 Agregar a Lista**: Añade a una lista de contactos
- **📅 Crear Evento**: Crea recordatorio en calendario

#### 🟠 Condición (Condition)
**Qué hace**: Separa el flujo en 2 caminos (SI/NO)

**Ejemplo**: "¿El contacto tiene tag VIP?"
- **✅ TRUE** (verde): Sigue por un camino
- **❌ FALSE** (rojo): Sigue por otro camino

#### 🟣 Delay (Espera)
**Qué hace**: Pausa la ejecución por X tiempo

**Opciones**:
- Horas
- Días
- Semanas

### Paso 3: Conectar los Nodos

1. Arrastra desde el **punto derecho** de un nodo
2. Suéltalo en el **punto izquierdo** del siguiente nodo
3. Los nodos se conectan con una línea

### Paso 4: Configurar Cada Nodo

1. **Click en el nodo** para abrir el panel de configuración
2. Completa los campos requeridos
3. Para "Enviar Mensaje", selecciona una **plantilla APPROVED**

### Paso 5: Guardar

1. Click en **"Guardar"** (botón morado arriba)
2. El sistema valida que todo esté correcto
3. Si hay errores, te dirá qué falta

---

## 🎬 Ejemplo Completo: Flujo de Bienvenida

```
[Trigger: Nuevo Contacto]
         ↓
[Acción: Enviar Mensaje "Bienvenida"]
         ↓
[Delay: 2 días]
         ↓
[Acción: Enviar Mensaje "Seguimiento"]
```

**Cómo crearlo**:

1. Añade nodo **Trigger** → Selecciona "Nuevo Contacto"
2. Añade nodo **Acción** → Selecciona "Enviar Mensaje" → Selecciona plantilla "Bienvenida"
3. Conecta Trigger → Acción
4. Añade nodo **Delay** → Configura "2 días"
5. Conecta Acción → Delay
6. Añade otra **Acción** → Selecciona plantilla "Seguimiento"
7. Conecta Delay → Acción
8. **Guardar**

---

## 🚀 Cómo Ejecutar una Automatización

### Ejecución Manual

1. Ve a **✨ Automatizaciones**
2. Busca tu automatización
3. Click en el botón **⚡ (rayo)** "Ejecutar Ahora"
4. Selecciona los contactos
5. Click en **"Ejecutar"**
6. Verás los resultados: éxitos y fallos

### Ejecución Automática

1. **Activa** la automatización (botón play/pause)
2. El sistema la ejecutará automáticamente cuando se cumpla el trigger
3. Por ejemplo:
   - Si el trigger es "Nuevo Contacto", se ejecuta al agregar un contacto
   - Si es "Sin Respuesta" con 24h, se ejecuta 24h después de enviar un mensaje sin respuesta

---

## 📊 Seguimiento de Mensajes

El sistema rastrea automáticamente:

- ✅ Mensajes enviados
- ⏰ Mensajes esperando respuesta
- ❌ Mensajes sin respuesta
- 📈 Tasa de respuesta

### Ver el Panel de Tracking

1. Ve a **✨ Automatizaciones**
2. Click en **"Seguimiento de Mensajes"** (botón naranja)
3. Verás:
   - Total enviados vs respondidos
   - Tiempo promedio de respuesta
   - Lista de contactos esperando respuesta
   - Alertas de follow-up necesarios

---

## ❓ Solución de Problemas

### "No hay plantillas sincronizadas"

**Solución**:
1. Ve a Plantillas
2. Configura tu API en Settings
3. Click "Sincronizar Plantillas"

### "Los nodos no hacen nada"

**Posibles causas**:
1. **Falta configuración de API**: Ve a Settings y configura
2. **No hay plantilla seleccionada**: Selecciona una plantilla APPROVED
3. **No hay contactos**: Agrega contactos en CRM Panel
4. **Automatización no activada**: Activa con el botón play

### "No puedo eliminar la automatización demo"

**Solución**:
1. Click en el botón 🗑️ (basura) de la automatización
2. Confirma la eliminación
3. Se eliminará permanentemente

### "Se perdieron mis datos"

**Explicación**:
- Los datos se guardan en **localStorage** del navegador
- Si cambias de navegador/dispositivo, no verás los datos
- Si limpias cache/cookies, pierdes los datos

**Solución**:
1. Usa siempre el mismo navegador
2. O haz backup: Settings → Export Data

---

## 🎯 Mejores Prácticas

### 1. Planifica Antes de Crear

Antes de hacer el flujo, escribe en papel:
- ¿Qué quiero lograr?
- ¿Cuándo debe ejecutarse?
- ¿Qué mensajes voy a enviar?
- ¿Qué pasa si el cliente responde/no responde?

### 2. Usa Nombres Claros

❌ MAL: "Auto 1", "Test"
✅ BIEN: "Bienvenida Nuevos Clientes", "Follow-up 48h Sin Respuesta"

### 3. Prueba con Pocos Contactos

Antes de activar para todos:
1. Crea 1-2 contactos de prueba
2. Ejecuta manual
3. Verifica que funcione
4. Luego activa automático

### 4. Monitorea los Resultados

Revisa regularmente:
- Panel de Seguimiento de Mensajes
- Analytics
- Tasa de conversión

---

## 🆘 ¿Necesitas Ayuda?

**Recurso**: Mira ejemplos en:
- Automatizaciones → Templates pre-diseñados
- FlowBuilder → Instrucciones en sidebar

**Tips**:
- Haz hover sobre los íconos ℹ️ para ver ayuda contextual
- Los mensajes de error te guían paso a paso
- Los emojis indican el tipo de acción en cada nodo

---

## 📚 Próximos Pasos

Una vez que domines lo básico:

1. **Crea seguimientos automáticos**: Trigger "Sin Respuesta" + Delay + Mensaje
2. **Segmenta con condiciones**: IF cliente VIP → Mensaje especial
3. **Automatiza eventos**: Crear recordatorios automáticamente
4. **Usa el calendario**: Programa llamadas de seguimiento
5. **Analiza resultados**: Ve Analytics para optimizar

---

**¡Listo! Ya puedes crear automatizaciones poderosas para WhatsApp Business** 🚀
