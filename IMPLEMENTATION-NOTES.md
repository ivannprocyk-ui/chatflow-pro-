# Notas de Implementación - Sistema de Seguimientos Avanzado

## Cambios Solicitados por el Usuario

1. **Integración en Bot IA**: El módulo de seguimientos debe estar DENTRO de BotConfiguration, no como página separada
2. **UI más gráfica**: Vista previa de mensajes en tiempo real
3. **Selector de días y horarios**: El cliente debe poder elegir qué días y horarios de la semana
4. **Tipos de trigger completos**: Faltan opciones de triggers
5. **No eliminar datos demo**: Mantener datos de ejemplo si existían
6. **Variables configurables**: Según base de datos de Supabase

## Tipos de Trigger Completos

```typescript
type TriggerType =
  | 'keyword'              // Palabra clave detectada
  | 'variable'             // Variable capturada (nombre, email, etc.)
  | 'conversation_state'   // Estado de conversación
  | 'bot_stage'            // Etapa específica del bot
  | 'time_based'           // Basado en tiempo
  | 'action'               // Acción realizada (doc enviado, etc.)
  | 'no_response'          // Cliente no respondió
  | 'specific_intent'      // Intención específica detectada por IA
  | 'customer_left'        // Cliente abandonó la conversación
  | 'price_requested'      // Cliente pidió precio/cotización
  | 'info_sent'            // Se envió información y no respondió
  | 'cart_abandoned'       // Carrito abandonado (para ecommerce)
  | 'form_incomplete'      // Formulario incompleto
  | 'meeting_no_confirm'   // Cita agendada pero no confirmada
```

## Estructura de Días y Horarios

```typescript
conditions: {
  business_hours_only: boolean;    // Solo enviar en horario laboral
  days_of_week: number[];          // [0=Dom, 1=Lun, ..., 6=Sáb]
  hours_start: string;             // "09:00"
  hours_end: string;               // "18:00"
  max_follow_ups_per_contact: number; // Máximo de seguimientos por contacto
}
```

## Variables Disponibles

Según la configuración del Bot IA:
- `{nombre}` - Nombre del contacto
- `{producto}` - Producto mencionado
- `{precio}` - Precio solicitado
- `{empresa}` - Nombre de la empresa (de BotConfig.businessName)
- `{fecha}` - Fecha actual
- `{hora}` - Hora actual
- `{horario_atencion}` - Horario de atención (de BotConfig.businessHours)

## Vista Previa de Mensajes

La vista previa debe:
1. Mostrar el mensaje con variables reemplazadas por ejemplos
2. Simular cómo se vería en WhatsApp (burbuja de chat)
3. Mostrar timing entre mensajes visualmente
4. Indicar qué mensaje se está editando actualmente

## Estrategias

- **Pasivo**: 3 mensajes, intervalos largos (1h, 4h, 1 día)
- **Moderado**: 4 mensajes, intervalos medios (30min, 2h, 6h, 1 día)
- **Agresivo**: 5 mensajes, intervalos cortos (15min, 30min, 1h, 3h, 6h)

## Datos Demo

Crear 2 secuencias de ejemplo al cargar por primera vez:

### Secuencia 1: "Cotización Sin Respuesta"
- Trigger: price_requested
- Estrategia: moderate
- Mensajes:
  1. (30 min): "Hola {nombre}, ¿estás por ahí? ¿Te quedó alguna duda sobre {producto}?"
  2. (2h): "¿Te interesa un descuento del 10% en {producto}?"
  3. (1 día): "Última oportunidad para {producto} con envío gratis 🎁"

### Secuencia 2: "Información Enviada"
- Trigger: info_sent
- Estrategia: passive
- Mensajes:
  1. (1h): "Hola {nombre}, ¿pudiste ver la información que te envié?"
  2. (4h): "¿Necesitas que te explique algo sobre {producto}?"
  3. (1 día): "Estoy aquí si tienes alguna pregunta 😊"

## Integración con Supabase

Variables de entorno necesarias:
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_KEY`: API Key de Supabase (anon o service_role)

Tablas creadas:
- `follow_up_sequences`
- `follow_up_messages`
- `follow_up_executions`
- `follow_up_message_logs`

## Próximos Pasos

1. Completar el editor de secuencias (Parte 2)
2. Agregar vista previa de mensajes estilo WhatsApp
3. Implementar selector visual de días/horarios
4. Agregar datos demo
5. Actualizar routing (eliminar página separada)
6. Pruebas y commit
