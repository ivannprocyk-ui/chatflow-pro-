# 🚀 ChatFlow Pro - Customer Onboarding Flow

## Flujo Completo de Activación de Clientes

---

## 📋 PLAN STARTER ($29/mes) - Self-Service Inmediato

### **Paso 1: Cliente se Registra**
```
Cliente va a: https://chatflow.tudominio.com/register

Completa:
- Email
- Password
- Nombre de Empresa
- Plan: Starter

→ Click "Crear Cuenta"
```

### **Paso 2: Sistema Crea Organización (Automático)**
```sql
-- Backend ejecuta automáticamente:
INSERT INTO organizations (name, plan, ai_enabled, ai_status)
VALUES ('Pizzería Don Juan', 'starter', true, 'active');

INSERT INTO users (organization_id, email, password_hash, role)
VALUES (org_id, 'admin@pizzeria.com', hash, 'admin');
```

### **Paso 3: Cliente Redirigido a Onboarding Wizard**

**Pantalla 1: Conectar WhatsApp**
```
┌─────────────────────────────────────────────┐
│  🎉 ¡Bienvenido a ChatFlow Pro!             │
├─────────────────────────────────────────────┤
│                                             │
│  Paso 1 de 4: Conecta tu WhatsApp          │
│                                             │
│  [📱 Escanear Código QR]                    │
│                                             │
│  ⏭️  [Omitir por ahora]                     │
└─────────────────────────────────────────────┘
```

**Pantalla 2: Configuración Básica de IA** (Formulario simple)
```
┌─────────────────────────────────────────────┐
│  Paso 2 de 4: Configura tu Asistente IA    │
├─────────────────────────────────────────────┤
│                                             │
│  ¿A qué se dedica tu empresa?               │
│  ┌─────────────────────────────────────┐   │
│  │ Ej: Vendemos pizzas artesanales    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ¿Qué productos/servicios ofreces?          │
│  ┌─────────────────────────────────────┐   │
│  │ Ej: Pizza Margarita $150           │   │
│  │     Pizza Pepperoni $180           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ¿Qué debe hacer el asistente?              │
│  ☑️ Responder preguntas sobre productos     │
│  ☑️ Tomar pedidos básicos                   │
│  ☑️ Dar horarios de atención                │
│  ☐ Agendar citas                            │
│                                             │
│  [Continuar →]                              │
└─────────────────────────────────────────────┘
```

**Pantalla 3: Horarios de Atención**
```
┌─────────────────────────────────────────────┐
│  Paso 3 de 4: ¿Cuándo debe responder?      │
├─────────────────────────────────────────────┤
│                                             │
│  ○ 24/7 - Siempre responder                │
│     El bot responde en todo momento         │
│                                             │
│  ● Solo en horario laboral                 │
│     Lun-Vie: 9:00 AM - 6:00 PM             │
│     Sáb-Dom: Cerrado                        │
│                                             │
│     Fuera de horario, el bot dirá:         │
│     "Estamos fuera de horario. Te          │
│      contactaremos mañana."                 │
│                                             │
│  [← Atrás]  [Continuar →]                  │
└─────────────────────────────────────────────┘
```

**Pantalla 4: ¡Listo!**
```
┌─────────────────────────────────────────────┐
│  ✅ ¡Todo Configurado!                      │
├─────────────────────────────────────────────┤
│                                             │
│  Tu asistente IA está activo y listo       │
│  para responder mensajes de WhatsApp.      │
│                                             │
│  Próximos pasos recomendados:               │
│  • Envía un mensaje de prueba              │
│  • Invita a tu equipo                      │
│  • Explora las analíticas                  │
│                                             │
│  [Ir al Dashboard →]                        │
└─────────────────────────────────────────────┘
```

### **Paso 4: Backend Guarda Configuración**
```typescript
// Automáticamente al completar wizard:
await this.organizations.update(organizationId, {
  ai_company_info: formData.companyDescription,
  ai_products_info: formData.products,
  ai_objective: formData.objectives.join(', '),
  ai_business_hours_only: formData.businessHoursOnly,
  business_hours: formData.schedule,
  ai_status: 'active',
  onboarding_completed: true,
  onboarding_completed_at: new Date()
});
```

### **Paso 5: Email de Bienvenida (Automático)**
```
De: ChatFlow Pro <bienvenida@chatflow.com>
Para: admin@pizzeria.com
Asunto: 🎉 Tu asistente IA está activo

Hola Admin de Pizzería Don Juan,

¡Felicidades! Tu asistente de WhatsApp con IA está activo y
respondiendo mensajes automáticamente.

✅ WhatsApp conectado
✅ Asistente IA configurado
✅ Listo para recibir clientes

Próximos pasos:
1. Envía un mensaje de prueba: [Tutorial]
2. Personaliza respuestas: [Ir a Configuración]
3. Invita a tu equipo: [Gestionar Usuarios]

¿Necesitas ayuda? Responde este email.

Saludos,
Equipo ChatFlow Pro
```

**⏱️ TIEMPO TOTAL: 5-10 minutos** (el cliente lo hace solo)

---

## 📋 PLAN PRO ($79/mes) - Semi-Automatizado

### **Mismo flujo que Starter PERO:**

**Email adicional después del registro:**
```
De: ChatFlow Pro <onboarding@chatflow.com>
Para: admin@tienda.com
Asunto: ✨ Vamos a potenciar tu asistente IA

Hola Admin,

Gracias por elegir el Plan PRO de ChatFlow Pro.

Completaste la configuración básica, pero como cliente PRO
tienes acceso a features avanzadas:

📄 Knowledge Base - Sube PDFs con info de productos
🌐 Web Scraping - Conecta tu sitio web
🎯 Follow-ups Automáticos - Reactiva leads inactivos
📊 Analíticas Avanzadas

¿Quieres que te ayudemos a configurar estas features?

[Sí, agendar llamada de 15 min] [No, lo haré yo mismo]

Si prefieres hacerlo tú mismo: [Guía de Configuración PRO]

Saludos,
Equipo ChatFlow Pro
```

**Si el cliente elige "Agendar llamada":**
- Calendly integration o similar
- Tú tienes una llamada de 15-30 min
- Configuras lo que necesite
- Cliente recibe email "Ya está todo listo"

**Si elige "Lo haré yo mismo":**
- Acceso a documentación avanzada
- Videos tutoriales
- Puede solicitar ayuda en cualquier momento

**⏱️ TIEMPO TOTAL:
- Sin ayuda: 15-30 minutos
- Con ayuda: 24 horas (incluye tu tiempo)

---

## 📋 PLAN ENTERPRISE ($199+/mes) - White Glove Setup

### **Paso 1: Cliente se Registra en Plan Enterprise**

### **Paso 2: Sistema Cambia Status a "pending_setup"**
```typescript
await this.organizations.update(organizationId, {
  ai_status: 'pending_setup',
  plan: 'enterprise'
});
```

### **Paso 3: TÚ Recibes Notificación Inmediata**

**Email a ti:**
```
De: ChatFlow System <system@chatflow.com>
Para: tu-email@tuempresa.com
Asunto: 🚨 NUEVO CLIENTE ENTERPRISE - Requiere Setup

Nueva organización Enterprise requiere configuración:

Empresa: Clínica Dental DentPro
Email: admin@dentpro.com
Plan: Enterprise ($199/mes)
Registro: 15/01/2024 10:30 AM

ACCIÓN REQUERIDA:
Setup completo en menos de 24 horas.

[Ver Detalles] [Marcar como En Proceso]
```

**Slack/Discord notification:**
```
🚨 NUEVO CLIENTE ENTERPRISE

Empresa: Clínica Dental DentPro
Plan: $199/mes
⏰ Setup deadline: 16/01/2024 10:30 AM

[Ir a Panel de Setup]
```

### **Paso 4: Cliente Ve Pantalla de "En Proceso"**
```
┌─────────────────────────────────────────────┐
│  ⏳ Tu Setup Está en Proceso                │
├─────────────────────────────────────────────┤
│                                             │
│  Nuestro equipo está configurando tu       │
│  asistente IA personalizado.               │
│                                             │
│  Recibirás un email cuando esté listo.     │
│  Tiempo estimado: 24 horas                 │
│                                             │
│  Mientras tanto:                            │
│  • [📄 Completa este formulario]           │
│  • [📁 Sube documentos de productos]       │
│  • [🌐 Comparte URL de tu sitio web]       │
│                                             │
└─────────────────────────────────────────────┘
```

### **Paso 5: TÚ Configuras (Panel de Admin Especial)**

**URL: `https://chatflow.tudominio.com/admin/setup/:orgId`**

```
┌─────────────────────────────────────────────┐
│  🔧 Setup Panel - Clínica Dental DentPro    │
├─────────────────────────────────────────────┤
│                                             │
│  STATUS: 🔴 En Proceso                      │
│  [Marcar como Completado]                   │
│                                             │
│  ──────────────────────────────────────     │
│  1️⃣ FLOWISE FLOW                            │
│  ──────────────────────────────────────     │
│                                             │
│  ○ Usar flow compartido (rápido)           │
│  ● Crear flow dedicado (recomendado)       │
│                                             │
│  [Crear Flow en Flowise →]                 │
│  Flow ID: _________________                │
│                                             │
│  ──────────────────────────────────────     │
│  2️⃣ KNOWLEDGE BASE                          │
│  ──────────────────────────────────────     │
│                                             │
│  Documentos subidos por el cliente:         │
│  📄 catalogo-servicios.pdf (2.3 MB)        │
│  📄 precios-2024.pdf (1.1 MB)              │
│                                             │
│  [Procesar en Flowise]                      │
│                                             │
│  Sitio web para scraping:                   │
│  🌐 https://dentpro.com                     │
│                                             │
│  [Iniciar Scraping →]                       │
│                                             │
│  ──────────────────────────────────────     │
│  3️⃣ PROMPTS PERSONALIZADOS                  │
│  ──────────────────────────────────────     │
│                                             │
│  System Prompt:                             │
│  ┌─────────────────────────────────────┐   │
│  │ Eres la asistente virtual de       │   │
│  │ Clínica Dental DentPro.            │   │
│  │                                     │   │
│  │ Especialidades:                     │   │
│  │ - Ortodoncia                        │   │
│  │ - Implantes                         │   │
│  │ - Blanqueamiento                    │   │
│  │                                     │   │
│  │ Tu objetivo es agendar citas y     │   │
│  │ responder preguntas sobre servicios.│   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ──────────────────────────────────────     │
│  4️⃣ FOLLOW-UPS AUTOMÁTICOS                  │
│  ──────────────────────────────────────     │
│                                             │
│  ☑️ Activar follow-ups                      │
│                                             │
│  Secuencia de mensajes:                     │
│  • Día 1: Cliente no responde              │
│  • Día 3: "Hola [nombre], vimos que..."    │
│  • Día 7: "Última oportunidad de 10% desc" │
│                                             │
│  [Configurar Mensajes →]                    │
│                                             │
│  ──────────────────────────────────────     │
│  5️⃣ PRUEBAS                                 │
│  ──────────────────────────────────────     │
│                                             │
│  [🧪 Enviar Mensaje de Prueba]             │
│                                             │
│  Mensajes de prueba enviados: 3            │
│  ✅ "Hola, cuánto cuesta ortodoncia?"      │
│  ✅ "Tienen horarios los sábados?"         │
│  ✅ "Quiero agendar cita"                  │
│                                             │
│  [Ver Respuestas]                           │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  [💾 Guardar Todo]                          │
│  [✅ Marcar como Completado y Notificar]   │
│                                             │
└─────────────────────────────────────────────┘
```

### **Paso 6: Marcas como Completado**

Sistema automáticamente:
1. Cambia status a "active"
2. Envía email al cliente
3. Crea tarea de follow-up en 7 días (¿cómo va todo?)

**Email al cliente:**
```
De: ChatFlow Pro <setup@chatflow.com>
Para: admin@dentpro.com
Asunto: ✅ Tu Asistente IA Enterprise está LISTO

Hola Admin de Clínica Dental DentPro,

¡Excelentes noticias! Tu asistente IA personalizado
está completamente configurado y activo.

LO QUE CONFIGURAMOS:
✅ Flow personalizado en Flowise
✅ Knowledge base con tus 2 PDFs procesados
✅ Scraping de tu sitio web integrado
✅ Prompts optimizados para agendar citas
✅ Follow-ups automáticos activados
✅ 3 mensajes de prueba verificados

TU ASISTENTE PUEDE:
• Responder preguntas sobre servicios dentales
• Dar precios de ortodoncia, implantes, blanqueamiento
• Agendar citas (conectado con tu calendario)
• Hacer follow-up a leads que no responden

PRÓXIMOS PASOS:
1. [Ver Dashboard con Analíticas]
2. [Tutorial: Cómo monitorear conversaciones]
3. [Agendar llamada de training con tu equipo]

Si tienes preguntas, responde este email.

¡A vender más! 🚀

Equipo ChatFlow Pro
```

**⏱️ TIEMPO TOTAL: 2-24 horas** (dependiendo de complejidad)

---

## 🔄 FOLLOW-UPS AUTOMÁTICOS - Sistema de Reactivación

### **Feature Más Solicitada: Reactivar Leads Inactivos**

**Cómo funciona (estilo Dittofeed pero más simple):**

### **Configuración Simple en UI:**

```
┌─────────────────────────────────────────────┐
│  🔄 Follow-ups Automáticos                  │
├─────────────────────────────────────────────┤
│                                             │
│  ☑️ Activar follow-ups automáticos          │
│                                             │
│  ──────────────────────────────────────     │
│  TRIGGER: ¿Cuándo reactivar?                │
│  ──────────────────────────────────────     │
│                                             │
│  Cliente no responde después de:            │
│  [3] días ▼                                 │
│                                             │
│  Aplicar solo a leads con status:           │
│  ☑️ Lead                                    │
│  ☑️ Contacted                               │
│  ☐ Customer (no molestar clientes activos) │
│                                             │
│  ──────────────────────────────────────     │
│  SECUENCIA DE MENSAJES                      │
│  ──────────────────────────────────────     │
│                                             │
│  📨 Mensaje 1 (Día 3)                       │
│  ┌─────────────────────────────────────┐   │
│  │ Hola {{nombre}}, vi que te          │   │
│  │ interesaban nuestros servicios.     │   │
│  │ ¿Tienes alguna pregunta? 😊        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ➕ Agregar Mensaje 2 (Día 7)              │
│  ┌─────────────────────────────────────┐   │
│  │ Hola de nuevo! Te ofrezco un        │   │
│  │ 10% de descuento si agendas hoy.    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ➕ Agregar Mensaje 3 (Día 14)             │
│                                             │
│  ──────────────────────────────────────     │
│  LÍMITES Y SEGURIDAD                        │
│  ──────────────────────────────────────     │
│                                             │
│  Máximo de follow-ups por lead: [3] ▼      │
│  Detener si el lead responde: ☑️            │
│                                             │
│  ──────────────────────────────────────     │
│                                             │
│  [💾 Guardar Configuración]                │
│                                             │
└─────────────────────────────────────────────┘
```

### **Backend: Sistema de Follow-up**

```typescript
// backend/src/followup/followup.service.ts

@Injectable()
export class FollowupService {

  @Cron('0 */6 * * *') // Cada 6 horas
  async checkInactiveLeads() {
    console.log('🔍 Buscando leads inactivos...');

    // Obtener todas las orgs con follow-up activado
    const orgs = await this.prisma.organization.findMany({
      where: { followup_enabled: true }
    });

    for (const org of orgs) {
      await this.processOrgFollowups(org);
    }
  }

  async processOrgFollowups(org: Organization) {
    const config = org.followup_config; // JSON con configuración

    // Buscar contactos inactivos
    const inactiveContacts = await this.prisma.contact.findMany({
      where: {
        organization_id: org.id,
        status: { in: config.trigger_statuses }, // ['lead', 'contacted']
        last_message_at: {
          lt: new Date(Date.now() - config.inactive_days * 24 * 60 * 60 * 1000)
        },
        followup_count: {
          lt: config.max_followups // No ha recibido más de 3 follow-ups
        }
      }
    });

    console.log(`📊 ${org.name}: ${inactiveContacts.length} leads inactivos`);

    for (const contact of inactiveContacts) {
      await this.sendFollowup(org, contact);
    }
  }

  async sendFollowup(org: Organization, contact: Contact) {
    const daysSinceLastMessage = Math.floor(
      (Date.now() - contact.last_message_at.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determinar qué mensaje enviar según días
    const config = org.followup_config;
    let messageTemplate = null;

    if (daysSinceLastMessage >= 14 && contact.followup_count === 2) {
      messageTemplate = config.message_3;
    } else if (daysSinceLastMessage >= 7 && contact.followup_count === 1) {
      messageTemplate = config.message_2;
    } else if (daysSinceLastMessage >= 3 && contact.followup_count === 0) {
      messageTemplate = config.message_1;
    }

    if (!messageTemplate) return;

    // Reemplazar variables
    const message = messageTemplate
      .replace('{{nombre}}', contact.custom_fields?.name || 'Cliente')
      .replace('{{empresa}}', org.name);

    // Enviar mensaje
    await this.whatsapp.sendMessage(org.id, contact.phone, message);

    // Actualizar contador
    await this.prisma.contact.update({
      where: { id: contact.id },
      data: {
        followup_count: { increment: 1 },
        last_followup_at: new Date()
      }
    });

    // Log actividad
    await this.prisma.activity_log.create({
      data: {
        organization_id: org.id,
        action: 'followup_sent',
        entity_type: 'contact',
        entity_id: contact.id,
        description: `Follow-up automático #${contact.followup_count + 1} enviado`
      }
    });

    console.log(`✅ Follow-up enviado a ${contact.phone}`);
  }
}
```

### **Database Schema para Follow-ups:**

```sql
-- Agregar a organizations table
ALTER TABLE organizations ADD COLUMN followup_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN followup_config JSONB;

-- Ejemplo de followup_config:
{
  "inactive_days": 3,
  "trigger_statuses": ["lead", "contacted"],
  "max_followups": 3,
  "message_1": "Hola {{nombre}}, vi que te interesaban nuestros servicios. ¿Tienes alguna pregunta? 😊",
  "message_2": "Hola de nuevo! Te ofrezco un 10% de descuento si agendas hoy.",
  "message_3": "Última oportunidad para aprovechar nuestro descuento especial. ¿Te interesa?"
}

-- Agregar a contacts table
ALTER TABLE contacts ADD COLUMN followup_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN last_followup_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN last_message_at TIMESTAMP;
```

---

## 📊 DASHBOARD DE MONITOREO (Para ti)

**URL: `https://chatflow.tudominio.com/admin/customers`**

```
┌─────────────────────────────────────────────────────────┐
│  📊 Panel de Clientes                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TOTAL CLIENTES: 127                                    │
│  • Activos: 120 ✅                                      │
│  • Pending Setup: 7 ⏳                                  │
│                                                         │
│  ─────────────────────────────────────────────────      │
│                                                         │
│  CLIENTES PENDIENTES SETUP:                             │
│                                                         │
│  🔴 Gym FitPro           | Enterprise | 2h restantes   │
│     [Ir a Setup] [Notificar]                            │
│                                                         │
│  🟡 Restaurante La Casa  | Pro        | 18h restantes  │
│     [Ir a Setup] [Notificar]                            │
│                                                         │
│  ─────────────────────────────────────────────────      │
│                                                         │
│  MÉTRICAS:                                              │
│  • Tiempo promedio setup: 4.2 horas                     │
│  • Tasa de activación: 94%                              │
│  • Follow-ups enviados hoy: 342                         │
│  • Mensajes IA procesados hoy: 1,247                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 RESUMEN DE FLUJOS:

| Plan | Activación | Config | Follow-ups | Tu Tiempo |
|------|-----------|--------|------------|-----------|
| **Starter** | Inmediata | Cliente solo | Templates básicos | 0 min |
| **Pro** | 2 horas | Semi-auto | Personalizables | 15-30 min (opcional) |
| **Enterprise** | 24 horas | Tú lo haces | Totalmente custom | 1-3 horas |

---

¿Implemento esto? Es 100% operacional y escalable. 🚀
