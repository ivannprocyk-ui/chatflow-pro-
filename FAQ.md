# ❓ PREGUNTAS FRECUENTES (FAQ)

## 📋 ÍNDICE

1. [Configuración Inicial](#configuración-inicial)
2. [Plantillas de WhatsApp](#plantillas-de-whatsapp)
3. [Envío de Mensajes](#envío-de-mensajes)
4. [Errores Comunes](#errores-comunes)
5. [API de Meta](#api-de-meta)
6. [Listas y Contactos](#listas-y-contactos)
7. [Exportación y Datos](#exportación-y-datos)
8. [Rendimiento](#rendimiento)

---

## 📱 CONFIGURACIÓN INICIAL

### ¿Dónde consigo las credenciales de Meta API?

**Respuesta:** 
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una app de "WhatsApp Business"
3. En el dashboard encontrarás:
   - **Phone Number ID**: En "WhatsApp" → "Getting Started"
   - **WABA ID**: En "WhatsApp" → "Settings"
   - **Access Token**: En "WhatsApp" → "Getting Started" (temporal) o en "Settings" → "System Users" (permanente)

**Tip:** Usa un token de sistema (permanente) para producción, no el temporal que expira en 24 horas.

---

### ¿Qué permisos necesita mi Access Token?

**Respuesta:**
Permisos mínimos necesarios:
- ✅ `whatsapp_business_messaging`
- ✅ `whatsapp_business_management`

Permisos opcionales pero recomendados:
- ⭐ `business_management` (para leer información de la cuenta)

---

### ¿Cómo sé si mi configuración es correcta?

**Respuesta:**
1. Ve a **Configuración** → **API de Meta**
2. Ingresa tus credenciales
3. Haz clic en **"Probar Conexión"**
4. Si ves "✅ Conectado" → Todo bien
5. Si ves "❌ Error" → Revisa credenciales

---

## 📄 PLANTILLAS DE WHATSAPP

### ¿Cómo creo plantillas de WhatsApp?

**Respuesta:**
1. Ve a [business.facebook.com](https://business.facebook.com)
2. Selecciona tu cuenta de WhatsApp Business
3. Ve a "Herramientas" → "Plantillas de mensaje"
4. Haz clic en "Crear plantilla"
5. Completa el formulario y envía para aprobación
6. Espera aprobación de Meta (24-48 horas)

---

### ¿Por qué no aparecen mis plantillas en ChatFlow?

**Soluciones:**
1. **Verifica que estén aprobadas** en Meta Business Manager
2. **Haz clic en "Sincronizar Plantillas"** en ChatFlow
3. **Verifica tu Access Token** tenga permisos de lectura
4. **Revisa WABA ID** sea correcto

---

### ¿Puedo usar variables en las plantillas?

**Respuesta:**
Sí, pero actualmente ChatFlow envía plantillas estáticas. Para usar variables necesitarías:
1. Crear plantilla con variables en Meta: `Hola {{1}}, tu cita es el {{2}}`
2. Modificar el código para incluir parámetros en el payload:
```typescript
payload.template.components = [{
  type: 'body',
  parameters: [
    { type: 'text', text: 'Juan' },
    { type: 'text', text: '15 de Noviembre' }
  ]
}];
```

**Próxima mejora:** Esta funcionalidad se agregará pronto.

---

### ¿Qué tipos de plantillas puedo usar?

**Respuesta:**
ChatFlow soporta:
- ✅ **Plantillas de texto simple**
- ✅ **Plantillas con imagen en header**
- ⚠️ **Plantillas con video** (próximamente)
- ⚠️ **Plantillas con documento** (próximamente)
- ⚠️ **Plantillas con botones** (próximamente)

---

## 📤 ENVÍO DE MENSAJES

### ¿Cuál es el formato correcto de número?

**Respuesta:**
```
Correcto: 5491112345678
          ↑ ↑ ↑
          | | └─ Número local (sin 15)
          | └─── Código de área (sin 0)
          └───── Código de país (sin +)

Incorrecto:
❌ +54 9 11 1234-5678  (con símbolos)
❌ 011 1234-5678       (sin código país)
❌ 54 11 15 1234-5678  (con 15)
```

**Ejemplos por país:**
- Argentina: `5491112345678`
- México: `5215512345678`
- España: `34612345678`
- Chile: `56912345678`

---

### ¿Cuántos mensajes puedo enviar por hora?

**Respuesta:**
Depende de tu cuenta de Meta:
- **Tier 1** (nueva): ~1,000 mensajes/día
- **Tier 2** (verificada): ~10,000 mensajes/día
- **Tier 3** (alta calidad): ~100,000 mensajes/día
- **Unlimited** (empresas grandes): Sin límite

**En ChatFlow:**
- Con delay 2 seg: ~1,800/hora
- Con delay 5 seg: ~720/hora

**Recomendación:** Empieza con delay de 3-5 segundos.

---

### ¿Por qué algunos mensajes fallan?

**Causas comunes:**
1. **Número inválido** → Verifica formato
2. **Plantilla no aprobada** → Sincroniza plantillas
3. **Límite de tasa** → Aumenta delay
4. **Usuario bloqueó tu número** → Normal, excluye del siguiente envío
5. **Usuario sin WhatsApp** → Normal, excluye
6. **Límite diario alcanzado** → Espera 24 horas o upgrade de tier

---

### ¿Puedo detener un envío masivo en progreso?

**Respuesta:**
Actualmente no hay botón de "Detener", pero puedes:
1. Cerrar la pestaña del navegador
2. Recargar la página
3. Los mensajes ya enviados no se pueden cancelar
4. Los pendientes no se enviarán

**Próxima mejora:** Botón de pausa/cancelar durante el envío.

---

## ❌ ERRORES COMUNES

### Error: "Configura primero tu API de Meta"

**Solución:**
1. Ve a **Configuración** → **API de Meta**
2. Completa **todos** los campos:
   - Phone Number ID
   - WABA ID
   - Access Token
   - API Version (v21.0)
3. Haz clic en **"Guardar Configuración"**

---

### Error: "Esta plantilla requiere una imagen"

**Solución:**
1. Tu plantilla tiene un header de tipo imagen
2. Ingresa una URL válida en el campo "URL de Imagen"
3. La URL debe:
   - Empezar con `https://` (no http)
   - Ser una imagen accesible públicamente
   - Estar en formato JPG, PNG o GIF
   - Tamaño recomendado: 800x418px

---

### Error: "Error al sincronizar plantillas"

**Soluciones:**
1. **Verifica Access Token** → Copia y pega sin espacios
2. **Verifica WABA ID** → Debe ser numérico
3. **Revisa permisos** → Token debe tener permisos de lectura
4. **Prueba conexión** → Botón "Probar Conexión" en Configuración

---

### Error: "Se encontraron X números inválidos"

**Solución:**
- ChatFlow detectó números con formato incorrecto
- Puedes:
  1. **Continuar** → Solo envía a números válidos
  2. **Cancelar** → Corrige los números y reintenta

Para ver qué números son inválidos:
- Exporta la lista
- Los inválidos tienen menos de 10 o más de 15 dígitos

---

### Error 429: "Too Many Requests"

**Solución:**
- Estás excediendo el límite de tasa de Meta
- Acciones:
  1. **Aumenta el delay** a 5-10 segundos
  2. **Reduce lote** de envío
  3. **Espera 1 hora** y reintenta
  4. **Contacta a Meta** para aumentar límites

---

## 🔌 API DE META

### ¿Cuánto cuesta usar la API de WhatsApp?

**Respuesta:**
**Meta Business API:**
- Conversaciones iniciadas por negocio: $0.005 - $0.10 USD/mensaje (varía por país)
- Conversaciones de servicio: Gratis primeras 1,000/mes
- Sesiones de 24 horas gratuitas si cliente responde

**ChatFlow:**
- Es completamente gratuito
- Solo pagas a Meta por los mensajes

---

### ¿Necesito un número de teléfono dedicado?

**Respuesta:**
Sí, necesitas:
- ✅ Número de teléfono **exclusivo** para WhatsApp Business API
- ✅ No puede estar registrado en WhatsApp regular
- ✅ Debe verificarse con Meta
- ⚠️ Una vez en API, no puedes usarlo en WhatsApp normal

**Opciones:**
1. Comprar SIM nueva
2. Usar número virtual (Twilio, etc)
3. Migrar número existente a API (pierde chats)

---

### ¿Puedo usar mi número personal de WhatsApp?

**Respuesta:**
❌ **NO.** Si tu número ya está en WhatsApp normal, no puedes usarlo en API sin migrarlo, lo cual:
- Borra todos los chats
- Pierde grupos
- Ya no funciona en WhatsApp normal

**Recomendación:** Usa un número nuevo para la API.

---

## 📇 LISTAS Y CONTACTOS

### ¿Cómo importo contactos desde Excel?

**Respuesta:**
1. Abre tu archivo Excel
2. Selecciona la columna de teléfonos
3. Copia (Ctrl+C)
4. Ve a ChatFlow → **Listas de Contactos** → **Nueva Lista**
5. Pega en el campo "Contactos"
6. Guarda

O exporta a CSV:
1. Excel → "Guardar como" → CSV
2. ChatFlow → **Envío Masivo** → Tab "Archivo CSV"
3. Arrastra el archivo

---

### ¿Puedo agregar nombres a mis contactos?

**Respuesta:**
Sí, en **Listas de Contactos**:

Formato:
```
Teléfono, Nombre, Apellido, Email
5491112345678, Juan, Pérez, juan@mail.com
5491187654321, María, González,
```

Solo el teléfono es obligatorio.

---

### ¿Cómo elimino duplicados de una lista?

**Respuesta:**
Actualmente manual:
1. Exporta la lista a CSV
2. Usa Excel para eliminar duplicados:
   - Selecciona datos → "Quitar duplicados"
3. Reimporta el archivo limpio

**Próxima mejora:** Detección automática de duplicados.

---

## 💾 EXPORTACIÓN Y DATOS

### ¿Dónde se guardan mis datos?

**Respuesta:**
Todo se guarda en **localStorage** de tu navegador:
- `chatflow_config` → Configuración
- `chatflow_templates` → Plantillas
- `chatflow_contact_lists` → Listas
- `chatflow_campaigns` → Historial
- `chatflow_send_log` → Logs de envío

**Importante:** 
- No se envía a ningún servidor externo
- Si borras caché del navegador, pierdes datos
- Recomendación: Exporta regularmente

---

### ¿Cómo hago backup de mis datos?

**Respuesta:**
1. Ve a **Configuración** → **Avanzado**
2. Haz clic en **"Exportar Todos los Datos"**
3. Se descarga un archivo JSON con todo
4. Guárdalo en lugar seguro

Para restaurar:
1. **"Importar Datos"** (próximamente)
2. O pega manualmente en localStorage

---

### ¿Puedo exportar el historial de envíos?

**Respuesta:**
Sí, de dos formas:

**1. Individual (después de cada envío):**
- Botón "Exportar CSV" en Resultados

**2. Completo (todo el historial):**
- **CRM** → **Exportar Datos**

---

## ⚡ RENDIMIENTO

### ¿Cuál es el delay recomendado entre mensajes?

**Respuesta:**
Depende de tu caso:
- **2 segundos**: Para cuentas con límites altos (Tier 3+)
- **3-5 segundos**: Recomendado para mayoría (Tier 2)
- **5-10 segundos**: Para cuentas nuevas (Tier 1)

**Muy importante:** Más rápido NO es mejor. Puedes ser bloqueado por spam.

---

### ¿Cuántos contactos puedo manejar?

**Respuesta:**
**Límites técnicos:**
- LocalStorage: ~10 MB (suficiente para 100,000+ contactos)
- Performance: Probado hasta 50,000 sin problemas

**Límites prácticos:**
- Meta API: Según tu tier
- Navegador: Sin problemas hasta 10,000

---

### ¿La aplicación funciona offline?

**Respuesta:**
Parcialmente:
- ✅ Puedes ver datos guardados
- ✅ Puedes crear listas
- ❌ No puedes sincronizar plantillas
- ❌ No puedes enviar mensajes (requiere internet)

---

## 🔒 PRIVACIDAD Y SEGURIDAD

### ¿Mis datos se envían a algún servidor?

**Respuesta:**
**NO.** Todo se guarda localmente en tu navegador:
- ✅ Credenciales en localStorage
- ✅ Contactos en localStorage
- ✅ Historial en localStorage

**Única comunicación:**
- Con Meta API (para enviar mensajes)
- Directa desde tu navegador
- Sin pasar por servidores intermedios

---

### ¿Es seguro guardar mi Access Token?

**Respuesta:**
Es tan seguro como tu navegador:
- ✅ localStorage está aislado por dominio
- ✅ Solo tú tienes acceso
- ⚠️ Si alguien accede a tu PC, puede verlo

**Recomendaciones:**
1. No compartas tu PC
2. Cierra sesión al terminar
3. Usa tokens con permisos mínimos
4. Renueva tokens periódicamente

---

## 🆘 MÁS AYUDA

### ¿Dónde encuentro más información?

**Recursos:**
- 📘 **README-MEJORAS.md** → Documentación completa
- 📋 **GUIA-IMPLEMENTACION.md** → Paso a paso
- 💻 **CODIGO-COMPLETO.md** → Ejemplos de código
- 📊 **RESUMEN-EJECUTIVO.md** → Overview general

**Links externos:**
- [Meta WhatsApp Docs](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help](https://www.facebook.com/business/help)
- [WhatsApp Business API](https://business.whatsapp.com)

---

### ¿Cómo reporto un bug?

**Pasos:**
1. Abre DevTools (F12)
2. Ve a Console
3. Captura el error
4. Describe qué hiciste
5. Incluye:
   - Navegador y versión
   - Sistema operativo
   - Pasos para reproducir

---

### ¿Hay soporte técnico?

**Respuesta:**
ChatFlow es open-source/self-hosted:
- ✅ Documentación completa incluida
- ✅ Código comentado y explicado
- ⚠️ Sin soporte oficial directo

Para problemas de Meta API:
- [Meta Support](https://developers.facebook.com/support/)

---

## 🎯 CONSEJOS PRO

### Tip 1: Testa antes de enviar masivo
Siempre envía un mensaje de prueba a tu propio número antes de una campaña grande.

### Tip 2: Usa listas organizadas
Crea listas por segmento: "Clientes_VIP", "Nuevos_Leads", etc.

### Tip 3: Monitorea tu tier
Revisa regularmente tu límite de mensajes en Meta Business Manager.

### Tip 4: Backup semanal
Exporta tus datos cada semana como medida de seguridad.

### Tip 5: Nombres descriptivos
Usa nombres claros para plantillas y listas: "Promo_BlackFriday_2025" mejor que "Template1".

---

**¿Más preguntas? Revisa la documentación completa en los archivos incluidos.**
