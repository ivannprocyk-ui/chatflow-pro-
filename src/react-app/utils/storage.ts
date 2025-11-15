export interface APIConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  apiVersion: string;
}

export interface BrandingConfig {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface AppConfig {
  api: APIConfig;
  branding: BrandingConfig;
}

// CRM Field Configuration
export interface CRMFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'currency' | 'textarea';
  required: boolean;
  options?: string[]; // For select fields
  currencyType?: string; // For currency fields
  defaultValue?: any;
  visible: boolean;
  order: number;
}

export interface CRMStatusConfig {
  id: string;
  name: string;
  label: string;
  color: string;
  icon?: string;
}

export interface CRMFieldStatusRelation {
  id: string;
  fieldId: string;
  fieldValue: string;
  statusId: string;
  autoApply: boolean; // Si se aplica automáticamente al cumplir la condición
}

export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
}

export interface CRMChartConfig {
  colors: ChartColors;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

// Tag Configuration
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMConfig {
  fields: CRMFieldConfig[];
  statuses: CRMStatusConfig[];
  currencies: string[];
  fieldStatusRelations?: CRMFieldStatusRelation[];
  chartConfig?: CRMChartConfig;
}

const defaultCRMConfig: CRMConfig = {
  fields: [
    { id: 'name', name: 'name', label: 'Nombre', type: 'text', required: true, visible: true, order: 1 },
    { id: 'phone', name: 'phone', label: 'Teléfono', type: 'phone', required: true, visible: true, order: 2 },
    { id: 'email', name: 'email', label: 'Email', type: 'email', required: false, visible: true, order: 3 },
    { id: 'company', name: 'company', label: 'Empresa', type: 'text', required: false, visible: true, order: 4 },
    { id: 'position', name: 'position', label: 'Cargo', type: 'text', required: false, visible: true, order: 5 },
    { id: 'cost', name: 'cost', label: 'Costo/Valor', type: 'currency', required: false, visible: true, order: 6, currencyType: 'USD' },
    { id: 'notes', name: 'notes', label: 'Notas', type: 'textarea', required: false, visible: true, order: 7 },
  ],
  statuses: [
    { id: 'active', name: 'active', label: 'Activo', color: 'green' },
    { id: 'inactive', name: 'inactive', label: 'Inactivo', color: 'yellow' },
    { id: 'lead', name: 'lead', label: 'Lead', color: 'blue' },
    { id: 'customer', name: 'customer', label: 'Cliente', color: 'purple' },
    { id: 'blocked', name: 'blocked', label: 'Bloqueado', color: 'red' },
  ],
  currencies: ['USD', 'ARS', 'EUR', 'MXN', 'BRL', 'CLP'],
  fieldStatusRelations: [],
  chartConfig: {
    colors: {
      primary: '#8B5CF6',
      secondary: '#10B981',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6'
    }
  }
};

// Tag color palette (10 predefined colors)
export const TAG_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

// Default predefined tags
const defaultTags: Tag[] = [
  {
    id: 'tag-vip',
    name: 'VIP',
    color: '#8B5CF6', // Purple
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tag-new-client',
    name: 'Cliente Nuevo',
    color: '#10B981', // Green
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tag-urgent-follow',
    name: 'Seguimiento Urgente',
    color: '#EF4444', // Red
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tag-inactive',
    name: 'Inactivo',
    color: '#6B7280', // Gray
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tag-hot-prospect',
    name: 'Prospecto Caliente',
    color: '#F59E0B', // Amber
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultConfig: AppConfig = {
  api: {
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    apiVersion: 'v21.0'
  },
  branding: {
    appName: 'ChatFlow Pro',
    logoUrl: '',
    primaryColor: '#25D366',
    secondaryColor: '#128C7E',
    accentColor: '#8B5CF6'
  }
};

export function loadConfig(): AppConfig {
  try {
    const stored = localStorage.getItem('chatflow_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultConfig, ...parsed };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return defaultConfig;
}

export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem('chatflow_config', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// CRM Configuration
export function loadCRMConfig(): CRMConfig {
  try {
    const stored = localStorage.getItem('chatflow_crm_config');
    if (stored) {
      const config = JSON.parse(stored);
      // Ensure fieldStatusRelations exists
      if (!config.fieldStatusRelations) {
        config.fieldStatusRelations = [];
      }
      // Ensure chartConfig exists with defaults
      if (!config.chartConfig) {
        config.chartConfig = defaultCRMConfig.chartConfig;
      }
      return config;
    }
  } catch (error) {
    console.error('Error loading CRM config:', error);
  }
  return defaultCRMConfig;
}

export function saveCRMConfig(config: CRMConfig): void {
  try {
    localStorage.setItem('chatflow_crm_config', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving CRM config:', error);
  }
}

export function loadContactLists(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_contact_lists');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading contact lists:', error);
    return [];
  }
}

export function saveContactLists(lists: any[]): void {
  try {
    localStorage.setItem('chatflow_contact_lists', JSON.stringify(lists));
  } catch (error) {
    console.error('Error saving contact lists:', error);
  }
}

export function loadCRMData(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_crm_data');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading CRM data:', error);
    return [];
  }
}

export function saveCRMData(data: any[]): void {
  try {
    localStorage.setItem('chatflow_crm_data', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving CRM data:', error);
  }
}

export function loadCalendarEvents(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_calendar_events');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading calendar events:', error);
    return [];
  }
}

export function saveCalendarEvents(events: any[]): void {
  try {
    localStorage.setItem('chatflow_calendar_events', JSON.stringify(events));
  } catch (error) {
    console.error('Error saving calendar events:', error);
  }
}

export function loadCampaigns(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_campaigns');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading campaigns:', error);
    return [];
  }
}

export function saveCampaigns(campaigns: any[]): void {
  try {
    localStorage.setItem('chatflow_campaigns', JSON.stringify(campaigns));
  } catch (error) {
    console.error('Error saving campaigns:', error);
  }
}

export function loadScheduledMessages(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_scheduled_messages');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading scheduled messages:', error);
    return [];
  }
}

export function saveScheduledMessages(messages: any[]): void {
  try {
    localStorage.setItem('chatflow_scheduled_messages', JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving scheduled messages:', error);
  }
}

// Templates
export function loadTemplates(): any[] {
  try {
    // Usar la misma key que Templates.tsx para mantener sincronización
    const stored = localStorage.getItem('chatflow_cached_templates');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

export function saveTemplates(templates: any[]): void {
  try {
    // Usar la misma key que Templates.tsx para mantener sincronización
    localStorage.setItem('chatflow_cached_templates', JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
}

// Send Log
export function loadSendLog(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_send_log');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading send log:', error);
    return [];
  }
}

export function saveSendLog(log: any[]): void {
  try {
    localStorage.setItem('chatflow_send_log', JSON.stringify(log));
  } catch (error) {
    console.error('Error saving send log:', error);
  }
}

export function appendToSendLog(entry: any): void {
  try {
    const log = loadSendLog();
    log.push(entry);
    saveSendLog(log);
  } catch (error) {
    console.error('Error appending to send log:', error);
  }
}

// ============================================================================
// PHONE NUMBER UTILITIES (Argentina)
// ============================================================================

/**
 * Formatea automáticamente números de teléfono argentinos al formato WhatsApp
 * Formato final: 549 + código de área + número (sin 15)
 *
 * Ejemplos:
 * - Input: "11xxxxxxxx" → Output: "5491xxxxxxxx"
 * - Input: "5411xxxxxxxx" → Output: "5491xxxxxxxx"
 * - Input: "1xxxxxxxx" → Output: "5491xxxxxxxx"
 * - Input: "54911xxxxxxxx" → Output: "5491xxxxxxxx"
 * - Input: "15xxxxxxxx" → Output: "5491xxxxxxxx"
 */
export function formatArgentinaPhone(phone: string): string {
  if (!phone) return phone;

  // Remover espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Remover el + si existe
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Caso 1: Ya tiene formato correcto 549 + area + número
  if (cleaned.match(/^549\d{10}$/)) {
    return cleaned;
  }

  // Caso 2: Tiene 54911... (formato incorrecto con 15)
  // Debe ser 549 + area + número (sin el 15)
  if (cleaned.match(/^54911\d{8}$/)) {
    // Remover el "15" después del código de país
    return '549' + cleaned.substring(5);
  }

  // Caso 3: Tiene 5491... pero el área code puede estar mal
  if (cleaned.startsWith('549')) {
    // Si tiene 54 + 9 + area de 2 dígitos + 15 + número
    if (cleaned.match(/^549\d{2}15\d{6,8}$/)) {
      const area = cleaned.substring(3, 5);
      const number = cleaned.substring(7);
      return `549${area}${number}`;
    }
    // Si ya tiene formato 549 + area + número (sin 15)
    if (cleaned.match(/^549\d{8,10}$/)) {
      return cleaned;
    }
  }

  // Caso 4: Empieza con 54 pero sin el 9
  if (cleaned.match(/^5411\d{8}$/)) {
    // 5411xxxxxxxx → 5491xxxxxxxx
    return '549' + cleaned.substring(3);
  }

  if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    // Detectar si tiene area code
    if (cleaned.length >= 12) {
      // Probablemente 54 + area de 2 dígitos + número
      const withoutCountry = cleaned.substring(2);
      // Agregar el 9 después del 54
      return '549' + withoutCountry.replace(/^15/, '');
    }
  }

  // Caso 5: Comienza con 11 (CABA/GBA)
  if (cleaned.match(/^11\d{8}$/)) {
    return '5491' + cleaned.substring(2);
  }

  // Caso 6: Comienza con 15 seguido de área code
  if (cleaned.match(/^15\d{8,10}$/)) {
    // Remover el 15 inicial y procesar
    const withoutPrefix = cleaned.substring(2);
    return formatArgentinaPhone(withoutPrefix);
  }

  // Caso 7: Área de 3 dígitos (interior del país)
  // Ejemplos: 221, 351, 341, etc.
  if (cleaned.match(/^\d{3}\d{7}$/)) {
    // Es área + número → 549 + área + número
    return '549' + cleaned;
  }

  // Caso 8: Solo 8 dígitos (asumimos CABA/GBA sin código de área)
  if (cleaned.match(/^\d{8}$/)) {
    return '5491' + cleaned;
  }

  // Caso 9: Tiene 10 dígitos y no matcheó ningún caso anterior
  if (cleaned.match(/^\d{10}$/)) {
    // Asumimos que es área + número
    return '549' + cleaned;
  }

  // Si no matchea ningún patrón conocido, retornar sin modificar
  console.warn(`[Phone Format] Formato no reconocido: ${phone}`);
  return cleaned;
}

/**
 * Valida si un número de teléfono argentino es válido
 */
export function isValidArgentinaPhone(phone: string): boolean {
  if (!phone) return false;

  const formatted = formatArgentinaPhone(phone);

  // Debe tener 549 seguido de 8-10 dígitos
  return /^549\d{8,10}$/.test(formatted);
}

// Tags
export function loadTags(): Tag[] {
  try {
    const stored = localStorage.getItem('chatflow_tags');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading tags:', error);
  }
  return defaultTags;
}

export function saveTags(tags: Tag[]): void {
  try {
    localStorage.setItem('chatflow_tags', JSON.stringify(tags));
  } catch (error) {
    console.error('Error saving tags:', error);
  }
}

export function createTag(name: string, color: string): Tag {
  return {
    id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateTag(tagId: string, updates: Partial<Pick<Tag, 'name' | 'color'>>): void {
  try {
    const tags = loadTags();
    const tagIndex = tags.findIndex(t => t.id === tagId);
    if (tagIndex !== -1) {
      tags[tagIndex] = {
        ...tags[tagIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveTags(tags);
    }
  } catch (error) {
    console.error('Error updating tag:', error);
  }
}

export function deleteTag(tagId: string): void {
  try {
    const tags = loadTags();
    const filteredTags = tags.filter(t => t.id !== tagId);
    saveTags(filteredTags);

    // Also remove this tag from all contacts
    const contacts = loadCRMData();
    const updatedContacts = contacts.map(contact => ({
      ...contact,
      tags: (contact.tags || []).filter((t: string) => t !== tagId)
    }));
    saveCRMData(updatedContacts);
  } catch (error) {
    console.error('Error deleting tag:', error);
  }
}

export function initializeDemoData(): void {
  try {
    // Initialize only the CRM configuration if it doesn't exist
    // All other data (templates, contacts, CRM data) should come from user input or API
    if (!localStorage.getItem('chatflow_crm_config')) {
      saveCRMConfig(defaultCRMConfig);
    }
    // Initialize default tags if they don't exist
    if (!localStorage.getItem('chatflow_tags')) {
      saveTags(defaultTags);
    }
  } catch (error) {
    console.error('Error initializing config:', error);
  }
}

// Utilities
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Data Validation and Cleaning
export interface ValidationIssue {
  id: string;
  contactId: string;
  type: 'duplicate' | 'invalid_phone' | 'invalid_email' | 'missing_required' | 'formatting';
  field: string;
  severity: 'error' | 'warning';
  message: string;
  suggestedFix?: string;
  duplicateWith?: string; // ID del contacto duplicado
}

// ============================================================================
// MESSAGE HISTORY INTERFACES
// ============================================================================

export interface MessageHistory {
  id: string;
  contactId: string;
  templateName: string;
  templateId?: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  campaignId?: string;
  campaignName?: string;
  listId?: string;
  listName?: string;
  messageId?: string; // WhatsApp message ID
  phoneNumber: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface MessageStats {
  totalSent: number;
  lastContactedAt?: string;
  responseRate?: number;
  topTemplates: Array<{
    templateName: string;
    count: number;
  }>;
  statusBreakdown: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

export function findDuplicateContacts(contacts: any[], config?: CRMConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const phoneMap = new Map<string, string[]>();
  const emailMap = new Map<string, string[]>();

  // Usar configuración por defecto si no se proporciona
  const actualConfig = config || loadCRMConfig();

  // Buscar campos de teléfono y email en la configuración
  const phoneFields = actualConfig.fields.filter(f => f.type === 'phone');
  const emailFields = actualConfig.fields.filter(f => f.type === 'email');

  // Agrupar contactos por teléfono y email
  contacts.forEach(contact => {
    // Revisar todos los campos de teléfono
    phoneFields.forEach(phoneField => {
      if (contact[phoneField.name]) {
        const cleanedPhone = cleanPhone(contact[phoneField.name]);
        if (cleanedPhone && cleanedPhone.length >= 8) { // Validar longitud mínima
          if (!phoneMap.has(cleanedPhone)) {
            phoneMap.set(cleanedPhone, []);
          }
          phoneMap.get(cleanedPhone)!.push(contact.id);
        }
      }
    });

    // Revisar todos los campos de email
    emailFields.forEach(emailField => {
      if (contact[emailField.name]) {
        const email = contact[emailField.name].toLowerCase().trim();
        if (email && validateEmail(email)) {
          if (!emailMap.has(email)) {
            emailMap.set(email, []);
          }
          emailMap.get(email)!.push(contact.id);
        }
      }
    });
  });

  // Crear issues para duplicados de teléfono
  phoneMap.forEach((ids, phone) => {
    if (ids.length > 1) {
      // Eliminar duplicados en el array de IDs (por si un contacto aparece dos veces)
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length > 1) {
        uniqueIds.forEach((id, index) => {
          const otherIds = uniqueIds.filter(dupId => dupId !== id);
          issues.push({
            id: `dup-phone-${id}-${index}`,
            contactId: id,
            type: 'duplicate',
            field: 'phone',
            severity: 'warning',
            message: `Teléfono duplicado: ${phone} (${uniqueIds.length} contactos)`,
            duplicateWith: otherIds[0]
          });
        });
      }
    }
  });

  // Crear issues para duplicados de email
  emailMap.forEach((ids, email) => {
    if (ids.length > 1) {
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length > 1) {
        uniqueIds.forEach((id, index) => {
          const otherIds = uniqueIds.filter(dupId => dupId !== id);
          issues.push({
            id: `dup-email-${id}-${index}`,
            contactId: id,
            type: 'duplicate',
            field: 'email',
            severity: 'warning',
            message: `Email duplicado: ${email} (${uniqueIds.length} contactos)`,
            duplicateWith: otherIds[0]
          });
        });
      }
    }
  });

  return issues;
}

export function validateContactData(contacts: any[], config: CRMConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  contacts.forEach(contact => {
    // Validar campos requeridos
    config.fields.filter(f => f.required).forEach(field => {
      if (!contact[field.name] || contact[field.name].toString().trim() === '') {
        issues.push({
          id: `missing-${contact.id}-${field.name}`,
          contactId: contact.id,
          type: 'missing_required',
          field: field.name,
          severity: 'error',
          message: `Campo requerido vacío: ${field.label}`
        });
      }
    });

    // Validar teléfonos
    config.fields.filter(f => f.type === 'phone').forEach(field => {
      if (contact[field.name] && !validatePhone(contact[field.name])) {
        issues.push({
          id: `invalid-phone-${contact.id}-${field.name}`,
          contactId: contact.id,
          type: 'invalid_phone',
          field: field.name,
          severity: 'error',
          message: `Teléfono inválido: ${contact[field.name]}`,
          suggestedFix: cleanPhone(contact[field.name])
        });
      }
    });

    // Validar emails
    config.fields.filter(f => f.type === 'email').forEach(field => {
      if (contact[field.name] && !validateEmail(contact[field.name])) {
        issues.push({
          id: `invalid-email-${contact.id}-${field.name}`,
          contactId: contact.id,
          type: 'invalid_email',
          field: field.name,
          severity: 'error',
          message: `Email inválido: ${contact[field.name]}`
        });
      }
    });

    // Detectar problemas de formato
    config.fields.filter(f => f.type === 'text').forEach(field => {
      const value = contact[field.name];
      if (value && typeof value === 'string') {
        // Detectar espacios múltiples o espacios al inicio/fin
        if (value !== value.trim() || /\s{2,}/.test(value)) {
          issues.push({
            id: `formatting-${contact.id}-${field.name}`,
            contactId: contact.id,
            type: 'formatting',
            field: field.name,
            severity: 'warning',
            message: `Formato incorrecto en ${field.label}: espacios extras`,
            suggestedFix: normalizeText(value)
          });
        }
      }
    });
  });

  return issues;
}

export function mergeContacts(keepContact: any, mergeContact: any, config: CRMConfig): any {
  const merged = { ...keepContact };

  // Fusionar campos - priorizar valores no vacíos de mergeContact
  config.fields.forEach(field => {
    if (!merged[field.name] || merged[field.name].toString().trim() === '') {
      if (mergeContact[field.name] && mergeContact[field.name].toString().trim() !== '') {
        merged[field.name] = mergeContact[field.name];
      }
    }
  });

  // Fusionar tags
  if (mergeContact.tags && mergeContact.tags.length > 0) {
    const existingTags = merged.tags || [];
    merged.tags = Array.from(new Set([...existingTags, ...mergeContact.tags]));
  }

  // Actualizar contador de mensajes
  merged.messagesSent = (merged.messagesSent || 0) + (mergeContact.messagesSent || 0);

  // Mantener la fecha de creación más antigua
  if (mergeContact.createdAt && (!merged.createdAt || new Date(mergeContact.createdAt) < new Date(merged.createdAt))) {
    merged.createdAt = mergeContact.createdAt;
  }

  // Mantener la fecha de última interacción más reciente
  if (mergeContact.lastInteraction && (!merged.lastInteraction || new Date(mergeContact.lastInteraction) > new Date(merged.lastInteraction))) {
    merged.lastInteraction = mergeContact.lastInteraction;
  }

  return merged;
}

export function applyDataCleaning(contacts: any[], config: CRMConfig): { cleaned: any[], changes: number } {
  let changes = 0;
  const changeDetails: string[] = [];

  const cleaned = contacts.map(contact => {
    const cleanedContact = { ...contact };

    // Limpiar teléfonos - quitar caracteres no numéricos
    config.fields.filter(f => f.type === 'phone').forEach(field => {
      if (cleanedContact[field.name]) {
        const original = cleanedContact[field.name];
        const cleaned = cleanPhone(original);
        if (original !== cleaned && cleaned.length >= 8) {
          cleanedContact[field.name] = cleaned;
          changes++;
          console.log(`Limpieza: Teléfono "${original}" -> "${cleaned}"`);
        }
      }
    });

    // Normalizar textos - quitar espacios extra y capitalizar
    config.fields.filter(f => f.type === 'text').forEach(field => {
      if (cleanedContact[field.name] && typeof cleanedContact[field.name] === 'string') {
        const original = cleanedContact[field.name];
        let normalized = normalizeText(original);

        // Detectar si tiene espacios extra o está sin trim
        if (original !== normalized) {
          cleanedContact[field.name] = normalized;
          changes++;
          console.log(`Limpieza: Texto "${original}" -> "${normalized}"`);
        }
      }
    });

    // Normalizar emails - minúsculas y trim
    config.fields.filter(f => f.type === 'email').forEach(field => {
      if (cleanedContact[field.name] && typeof cleanedContact[field.name] === 'string') {
        const original = cleanedContact[field.name];
        const normalized = original.toLowerCase().trim();
        if (original !== normalized) {
          cleanedContact[field.name] = normalized;
          changes++;
          console.log(`Limpieza: Email "${original}" -> "${normalized}"`);
        }
      }
    });

    return cleanedContact;
  });

  console.log(`Total de cambios aplicados: ${changes}`);
  return { cleaned, changes };
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'vcard';
  contacts: any[];
  config: CRMConfig;
  selectedFields?: string[]; // If empty, export all visible fields
}

/**
 * Export contacts to CSV format
 */
export function exportToCSV(options: ExportOptions): void {
  const { contacts, config, selectedFields } = options;

  // Determine which fields to export
  const fieldsToExport = selectedFields && selectedFields.length > 0
    ? config.fields.filter(f => selectedFields.includes(f.name))
    : config.fields.filter(f => f.visible);

  // Create CSV header
  const headers = fieldsToExport.map(f => f.label).join(',');

  // Create CSV rows
  const rows = contacts.map(contact => {
    return fieldsToExport.map(field => {
      const value = contact[field.name];

      // Handle different field types
      if (value === null || value === undefined) return '';

      // Escape commas and quotes in CSV
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `contactos_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export contacts to Excel format
 */
export async function exportToExcel(options: ExportOptions): Promise<void> {
  const { contacts, config, selectedFields } = options;

  // Dynamic import of xlsx to reduce bundle size
  const XLSX = await import('xlsx');

  // Determine which fields to export
  const fieldsToExport = selectedFields && selectedFields.length > 0
    ? config.fields.filter(f => selectedFields.includes(f.name))
    : config.fields.filter(f => f.visible);

  // Create worksheet data
  const data = contacts.map(contact => {
    const row: any = {};
    fieldsToExport.forEach(field => {
      row[field.label] = contact[field.name] ?? '';
    });
    return row;
  });

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = fieldsToExport.map(field => ({
    wch: Math.min(field.label.length + 2, maxWidth)
  }));
  worksheet['!cols'] = colWidths;

  // Download file
  XLSX.writeFile(workbook, `contactos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export contacts to vCard format (.vcf)
 */
export function exportToVCard(options: ExportOptions): void {
  const { contacts, config } = options;

  // Find relevant fields
  const nameField = config.fields.find(f =>
    f.name.toLowerCase().includes('nombre') ||
    f.name.toLowerCase().includes('name')
  );

  const phoneFields = config.fields.filter(f => f.type === 'phone');
  const emailFields = config.fields.filter(f => f.type === 'email');
  const companyField = config.fields.find(f =>
    f.name.toLowerCase().includes('empresa') ||
    f.name.toLowerCase().includes('company')
  );

  // Generate vCard for each contact
  const vcards = contacts.map(contact => {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

    // Name
    if (nameField && contact[nameField.name]) {
      const name = contact[nameField.name];
      lines.push(`FN:${name}`);
      lines.push(`N:${name};;;;`);
    }

    // Phone numbers
    phoneFields.forEach((field, index) => {
      if (contact[field.name]) {
        const type = index === 0 ? 'CELL' : 'WORK';
        lines.push(`TEL;TYPE=${type}:${contact[field.name]}`);
      }
    });

    // Email addresses
    emailFields.forEach((field, index) => {
      if (contact[field.name]) {
        const type = index === 0 ? 'INTERNET' : 'WORK';
        lines.push(`EMAIL;TYPE=${type}:${contact[field.name]}`);
      }
    });

    // Company/Organization
    if (companyField && contact[companyField.name]) {
      lines.push(`ORG:${contact[companyField.name]}`);
    }

    // Notes - add contact ID for reference
    lines.push(`NOTE:ID: ${contact.id}`);

    lines.push('END:VCARD');
    return lines.join('\r\n');
  });

  // Combine all vCards
  const vcard = vcards.join('\r\n');

  // Create and download file
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `contactos_${new Date().toISOString().split('T')[0]}.vcf`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Main export function that delegates to specific format handlers
 */
export async function exportContacts(options: ExportOptions): Promise<void> {
  switch (options.format) {
    case 'csv':
      exportToCSV(options);
      break;
    case 'excel':
      await exportToExcel(options);
      break;
    case 'vcard':
      exportToVCard(options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

// ============================================================================
// MESSAGE HISTORY FUNCTIONS
// ============================================================================

const MESSAGE_HISTORY_KEY = 'chatflow_message_history';

/**
 * Load all message history from localStorage
 */
export function loadMessageHistory(): MessageHistory[] {
  try {
    const stored = localStorage.getItem(MESSAGE_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading message history:', error);
  }
  return [];
}

/**
 * Save message history to localStorage
 */
export function saveMessageHistory(messages: MessageHistory[]): void {
  try {
    localStorage.setItem(MESSAGE_HISTORY_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving message history:', error);
  }
}

/**
 * Get message history for a specific contact
 */
export function getContactMessageHistory(contactId: string): MessageHistory[] {
  const allMessages = loadMessageHistory();
  return allMessages
    .filter(msg => msg.contactId === contactId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

/**
 * Add a new message to history
 */
export function addMessageToHistory(message: Omit<MessageHistory, 'id'>): MessageHistory {
  const messages = loadMessageHistory();
  const newMessage: MessageHistory = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  messages.push(newMessage);
  saveMessageHistory(messages);
  return newMessage;
}

/**
 * Update message status (for delivery/read receipts)
 */
export function updateMessageStatus(
  messageId: string,
  status: MessageHistory['status'],
  errorMessage?: string
): void {
  const messages = loadMessageHistory();
  const messageIndex = messages.findIndex(m => m.id === messageId);

  if (messageIndex !== -1) {
    messages[messageIndex].status = status;
    if (errorMessage) {
      messages[messageIndex].errorMessage = errorMessage;
    }
    saveMessageHistory(messages);
  }
}

/**
 * Get message statistics for a contact
 */
export function getContactMessageStats(contactId: string): MessageStats {
  const messages = getContactMessageHistory(contactId);

  if (messages.length === 0) {
    return {
      totalSent: 0,
      topTemplates: [],
      statusBreakdown: {
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      }
    };
  }

  // Count templates
  const templateCounts = new Map<string, number>();
  messages.forEach(msg => {
    const count = templateCounts.get(msg.templateName) || 0;
    templateCounts.set(msg.templateName, count + 1);
  });

  // Get top templates
  const topTemplates = Array.from(templateCounts.entries())
    .map(([templateName, count]) => ({ templateName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Count by status
  const statusBreakdown = {
    sent: messages.filter(m => m.status === 'sent').length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    read: messages.filter(m => m.status === 'read').length,
    failed: messages.filter(m => m.status === 'failed').length
  };

  // Get last contacted
  const lastContactedAt = messages.length > 0 ? messages[0].sentAt : undefined;

  return {
    totalSent: messages.length,
    lastContactedAt,
    topTemplates,
    statusBreakdown
  };
}

/**
 * Filter message history
 */
export interface MessageFilter {
  templateName?: string;
  status?: MessageHistory['status'];
  dateFrom?: string;
  dateTo?: string;
  campaignId?: string;
}

export function filterMessageHistory(
  messages: MessageHistory[],
  filter: MessageFilter
): MessageHistory[] {
  return messages.filter(msg => {
    if (filter.templateName && msg.templateName !== filter.templateName) {
      return false;
    }
    if (filter.status && msg.status !== filter.status) {
      return false;
    }
    if (filter.campaignId && msg.campaignId !== filter.campaignId) {
      return false;
    }
    if (filter.dateFrom) {
      const msgDate = new Date(msg.sentAt);
      const fromDate = new Date(filter.dateFrom);
      if (msgDate < fromDate) {
        return false;
      }
    }
    if (filter.dateTo) {
      const msgDate = new Date(msg.sentAt);
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      if (msgDate > toDate) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Delete all messages for a contact
 */
export function deleteContactMessageHistory(contactId: string): void {
  const allMessages = loadMessageHistory();
  const filtered = allMessages.filter(msg => msg.contactId !== contactId);
  saveMessageHistory(filtered);
}

/**
 * Get message count by template for a contact
 */
export function getTemplateUsageByContact(contactId: string): Map<string, number> {
  const messages = getContactMessageHistory(contactId);
  const templateCounts = new Map<string, number>();

  messages.forEach(msg => {
    const count = templateCounts.get(msg.templateName) || 0;
    templateCounts.set(msg.templateName, count + 1);
  });

  return templateCounts;
}

// ============================================================================
// ANALYTICS AND INSIGHTS FUNCTIONS
// ============================================================================

export interface DashboardAnalytics {
  kpis: {
    totalContacts: number;
    contactsGrowth: number; // % change from previous period
    messagesSentToday: number;
    messagesSentWeek: number;
    messagesSentMonth: number;
    activeContacts: number; // Contacted in last 30 days
    inactiveContacts: number;
    averageResponseRate: number;
  };
  contactGrowth: Array<{ date: string; count: number }>;
  messagesByDay: Array<{ date: string; sent: number; delivered: number; failed: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  templatePerformance: Array<{ name: string; sent: number; delivered: number; read: number; failed: number }>;
  bestHours: Array<{ hour: number; count: number }>;
  bestDays: Array<{ day: string; count: number }>;
  topContacts: Array<{ id: string; name: string; messageCount: number }>;
}

/**
 * Get comprehensive dashboard analytics
 */
export function getDashboardAnalytics(config: CRMConfig): DashboardAnalytics {
  const contacts = loadCRMData();
  const messages = loadMessageHistory();
  const now = new Date();

  // Helper functions
  const getDateDaysAgo = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  };

  const isWithinDays = (date: Date, days: number) => {
    return date >= getDateDaysAgo(days);
  };

  // KPIs
  const totalContacts = contacts.length;

  // Contact growth (last 30 days vs previous 30 days)
  const last30Days = contacts.filter(c => new Date(c.createdAt) >= getDateDaysAgo(30)).length;
  const previous30Days = contacts.filter(c => {
    const created = new Date(c.createdAt);
    return created >= getDateDaysAgo(60) && created < getDateDaysAgo(30);
  }).length;
  const contactsGrowth = previous30Days > 0 ? ((last30Days - previous30Days) / previous30Days) * 100 : 0;

  // Messages by period
  const messagesSentToday = messages.filter(m => {
    const sentDate = new Date(m.sentAt);
    return sentDate.toDateString() === now.toDateString();
  }).length;

  const messagesSentWeek = messages.filter(m => isWithinDays(new Date(m.sentAt), 7)).length;
  const messagesSentMonth = messages.filter(m => isWithinDays(new Date(m.sentAt), 30)).length;

  // Active/Inactive contacts
  const contactMessagesMap = new Map<string, Date>();
  messages.forEach(msg => {
    const existing = contactMessagesMap.get(msg.contactId);
    const msgDate = new Date(msg.sentAt);
    if (!existing || msgDate > existing) {
      contactMessagesMap.set(msg.contactId, msgDate);
    }
  });

  const activeContacts = Array.from(contactMessagesMap.values())
    .filter(lastContact => isWithinDays(lastContact, 30)).length;
  const inactiveContacts = totalContacts - activeContacts;

  // Response rate (read messages / total messages)
  const totalSent = messages.length;
  const totalRead = messages.filter(m => m.status === 'read').length;
  const averageResponseRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

  // Contact growth over time (last 30 days)
  const contactGrowth: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const date = getDateDaysAgo(i);
    const count = contacts.filter(c => new Date(c.createdAt) <= date).length;
    contactGrowth.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }

  // Messages by day (last 14 days)
  const messagesByDay: Array<{ date: string; sent: number; delivered: number; failed: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const date = getDateDaysAgo(i);
    const dateStr = date.toISOString().split('T')[0];
    const dayMessages = messages.filter(m => {
      const msgDate = new Date(m.sentAt);
      return msgDate.toISOString().split('T')[0] === dateStr;
    });

    messagesByDay.push({
      date: dateStr,
      sent: dayMessages.filter(m => m.status === 'sent').length,
      delivered: dayMessages.filter(m => m.status === 'delivered').length,
      failed: dayMessages.filter(m => m.status === 'failed').length
    });
  }

  // Status distribution
  const statusCounts = new Map<string, number>();
  contacts.forEach(c => {
    const count = statusCounts.get(c.status) || 0;
    statusCounts.set(c.status, count + 1);
  });

  const statusColors: Record<string, string> = {
    lead: '#F59E0B',
    contacted: '#3B82F6',
    qualified: '#8B5CF6',
    proposal: '#EC4899',
    negotiation: '#F97316',
    won: '#10B981',
    lost: '#EF4444'
  };

  const statusDistribution = Array.from(statusCounts.entries()).map(([name, value]) => ({
    name: config.statuses.find(s => s.name === name)?.label || name,
    value,
    color: statusColors[name] || '#6B7280'
  }));

  // Template performance
  const templateStats = new Map<string, { sent: number; delivered: number; read: number; failed: number }>();
  messages.forEach(msg => {
    const stats = templateStats.get(msg.templateName) || { sent: 0, delivered: 0, read: 0, failed: 0 };
    stats[msg.status]++;
    templateStats.set(msg.templateName, stats);
  });

  const templatePerformance = Array.from(templateStats.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => (b.sent + b.delivered + b.read) - (a.sent + a.delivered + a.read))
    .slice(0, 10);

  // Best hours (0-23)
  const hourCounts = new Array(24).fill(0);
  messages.forEach(msg => {
    const hour = new Date(msg.sentAt).getHours();
    hourCounts[hour]++;
  });
  const bestHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Best days (0=Sunday, 6=Saturday)
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayCounts = new Array(7).fill(0);
  messages.forEach(msg => {
    const day = new Date(msg.sentAt).getDay();
    dayCounts[day]++;
  });
  const bestDays = dayCounts
    .map((count, day) => ({ day: dayNames[day], count }))
    .sort((a, b) => b.count - a.count);

  // Top contacts by message count
  const contactMessageCounts = new Map<string, number>();
  messages.forEach(msg => {
    const count = contactMessageCounts.get(msg.contactId) || 0;
    contactMessageCounts.set(msg.contactId, count + 1);
  });

  const topContacts = Array.from(contactMessageCounts.entries())
    .map(([id, messageCount]) => {
      const contact = contacts.find(c => c.id === id);
      const nameField = config.fields.find(f =>
        f.name.toLowerCase().includes('nombre') ||
        f.name.toLowerCase().includes('name')
      );
      const name = contact && nameField ? contact[nameField.name] : 'Desconocido';
      return { id, name, messageCount };
    })
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 10);

  return {
    kpis: {
      totalContacts,
      contactsGrowth,
      messagesSentToday,
      messagesSentWeek,
      messagesSentMonth,
      activeContacts,
      inactiveContacts,
      averageResponseRate
    },
    contactGrowth,
    messagesByDay,
    statusDistribution,
    templatePerformance,
    bestHours,
    bestDays,
    topContacts
  };
}

// ==========================================
// FASE 9: Exportación de Reportes
// ==========================================

/**
 * Export analytics data to Excel format
 */
export function exportAnalyticsToExcel(analytics: DashboardAnalytics, config: CRMConfig): void {
  // Dynamic import to avoid bundling XLSX if not used
  import('xlsx').then(XLSX => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: KPIs Summary
    const kpisData = [
      ['REPORTE DE ANALÍTICAS - CHATFLOW PRO'],
      ['Fecha de generación:', new Date().toLocaleString('es-ES')],
      [],
      ['INDICADORES CLAVE (KPIs)'],
      ['Total Contactos', analytics.kpis.totalContacts],
      ['Crecimiento vs. 30 días anteriores', `${analytics.kpis.contactsGrowth.toFixed(1)}%`],
      ['Mensajes Enviados Hoy', analytics.kpis.messagesSentToday],
      ['Mensajes Enviados (7 días)', analytics.kpis.messagesSentWeek],
      ['Mensajes Enviados (30 días)', analytics.kpis.messagesSentMonth],
      ['Contactos Activos', analytics.kpis.activeContacts],
      ['Contactos Inactivos', analytics.kpis.inactiveContacts],
      ['Tasa de Respuesta', `${analytics.kpis.averageResponseRate.toFixed(1)}%`]
    ];
    const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
    XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');

    // Sheet 2: Contact Growth
    const contactGrowthData = [
      ['CRECIMIENTO DE CONTACTOS (30 DÍAS)'],
      ['Fecha', 'Cantidad de Contactos'],
      ...analytics.contactGrowth.map(item => [
        new Date(item.date).toLocaleDateString('es-ES'),
        item.count
      ])
    ];
    const wsContactGrowth = XLSX.utils.aoa_to_sheet(contactGrowthData);
    XLSX.utils.book_append_sheet(wb, wsContactGrowth, 'Crecimiento Contactos');

    // Sheet 3: Messages by Day
    const messagesByDayData = [
      ['MENSAJES POR DÍA (14 DÍAS)'],
      ['Fecha', 'Enviados', 'Entregados', 'Fallidos'],
      ...analytics.messagesByDay.map(item => [
        new Date(item.date).toLocaleDateString('es-ES'),
        item.sent,
        item.delivered,
        item.failed
      ])
    ];
    const wsMessagesByDay = XLSX.utils.aoa_to_sheet(messagesByDayData);
    XLSX.utils.book_append_sheet(wb, wsMessagesByDay, 'Mensajes por Día');

    // Sheet 4: Status Distribution
    const statusData = [
      ['DISTRIBUCIÓN POR ESTADO'],
      ['Estado', 'Cantidad', 'Porcentaje'],
      ...analytics.statusDistribution.map(item => {
        const total = analytics.statusDistribution.reduce((sum, s) => sum + s.value, 0);
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
        return [item.name, item.value, `${percentage}%`];
      })
    ];
    const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Distribución Estados');

    // Sheet 5: Template Performance
    const templateData = [
      ['RENDIMIENTO DE PLANTILLAS (TOP 10)'],
      ['Plantilla', 'Enviados', 'Entregados', 'Leídos', 'Fallidos', 'Tasa de Éxito'],
      ...analytics.templatePerformance.map(item => {
        const successRate = item.sent > 0 ? ((item.delivered / item.sent) * 100).toFixed(1) : '0';
        return [
          item.name,
          item.sent,
          item.delivered,
          item.read,
          item.failed,
          `${successRate}%`
        ];
      })
    ];
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Rendimiento Plantillas');

    // Sheet 6: Best Hours
    const hoursData = [
      ['MEJORES HORARIOS DE ENVÍO'],
      ['Hora', 'Cantidad de Mensajes'],
      ...analytics.bestHours.map(item => [
        `${item.hour}:00`,
        item.count
      ])
    ];
    const wsHours = XLSX.utils.aoa_to_sheet(hoursData);
    XLSX.utils.book_append_sheet(wb, wsHours, 'Mejores Horarios');

    // Sheet 7: Best Days
    const daysData = [
      ['MEJORES DÍAS DE LA SEMANA'],
      ['Día', 'Cantidad de Mensajes'],
      ...analytics.bestDays.map(item => [item.day, item.count])
    ];
    const wsDays = XLSX.utils.aoa_to_sheet(daysData);
    XLSX.utils.book_append_sheet(wb, wsDays, 'Mejores Días');

    // Sheet 8: Top Contacts
    const contactsData = [
      ['TOP CONTACTOS (TOP 10)'],
      ['Nombre', 'ID', 'Cantidad de Mensajes'],
      ...analytics.topContacts.map(item => [
        item.name,
        item.id,
        item.messageCount
      ])
    ];
    const wsContacts = XLSX.utils.aoa_to_sheet(contactsData);
    XLSX.utils.book_append_sheet(wb, wsContacts, 'Top Contactos');

    // Generate Excel file
    const fileName = `analytics_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }).catch(error => {
    console.error('Error exporting to Excel:', error);
    throw new Error('Error al exportar a Excel');
  });
}

/**
 * Export complete backup of all data
 */
export function exportCompleteBackup(): void {
  try {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        config: loadConfig(),
        crmConfig: loadCRMConfig(),
        contacts: loadCRMData(),
        messageHistory: loadMessageHistory(),
        contactLists: JSON.parse(localStorage.getItem('chatflow_contact_lists') || '[]'),
        templates: JSON.parse(localStorage.getItem('chatflow_cached_templates') || '[]'),
        calendarEvents: JSON.parse(localStorage.getItem('chatflow_calendar_events') || '[]')
      }
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chatflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Error al crear backup');
  }
}

/**
 * Import backup data
 */
export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);

        if (!backup.data) {
          throw new Error('Formato de backup inválido');
        }

        // Restore all data
        if (backup.data.config) {
          saveConfig(backup.data.config);
        }
        if (backup.data.crmConfig) {
          saveCRMConfig(backup.data.crmConfig);
        }
        if (backup.data.contacts) {
          saveCRMData(backup.data.contacts);
        }
        if (backup.data.messageHistory) {
          saveMessageHistory(backup.data.messageHistory);
        }
        if (backup.data.contactLists) {
          localStorage.setItem('chatflow_contact_lists', JSON.stringify(backup.data.contactLists));
        }
        if (backup.data.templates) {
          localStorage.setItem('chatflow_cached_templates', JSON.stringify(backup.data.templates));
        }
        if (backup.data.calendarEvents) {
          localStorage.setItem('chatflow_calendar_events', JSON.stringify(backup.data.calendarEvents));
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsText(file);
  });
}

/**
 * Get analytics for custom date range
 */
export function getAnalyticsForDateRange(
  config: CRMConfig,
  startDate: Date,
  endDate: Date
): DashboardAnalytics {
  const contacts = loadCRMData();
  const allMessages = loadMessageHistory();

  // Filter messages by date range
  const messages = allMessages.filter(msg => {
    const msgDate = new Date(msg.sentAt);
    return msgDate >= startDate && msgDate <= endDate;
  });

  // Filter contacts by date range
  const filteredContacts = contacts.filter(c => {
    if (!c.createdAt) return false;
    const contactDate = new Date(c.createdAt);
    return contactDate >= startDate && contactDate <= endDate;
  });

  const now = endDate;
  const totalContacts = filteredContacts.length;

  // Calculate date range duration in days
  const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // For growth comparison, use same duration before start date
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - rangeDays);

  const previousPeriodContacts = contacts.filter(c => {
    if (!c.createdAt) return false;
    const contactDate = new Date(c.createdAt);
    return contactDate >= previousStart && contactDate < startDate;
  }).length;

  const contactsGrowth = previousPeriodContacts > 0
    ? ((totalContacts - previousPeriodContacts) / previousPeriodContacts) * 100
    : 0;

  // Messages counts
  const messagesSentToday = messages.filter(m => {
    const sentDate = new Date(m.sentAt);
    return sentDate.toDateString() === now.toDateString();
  }).length;

  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const messagesSentWeek = messages.filter(m => new Date(m.sentAt) >= last7Days).length;

  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);
  const messagesSentMonth = messages.filter(m => new Date(m.sentAt) >= last30Days).length;

  // Active contacts in range
  const contactMessagesMap = new Map<string, Date>();
  messages.forEach(msg => {
    const existing = contactMessagesMap.get(msg.contactId);
    const msgDate = new Date(msg.sentAt);
    if (!existing || msgDate > existing) {
      contactMessagesMap.set(msg.contactId, msgDate);
    }
  });

  const activeContacts = contactMessagesMap.size;
  const inactiveContacts = Math.max(0, totalContacts - activeContacts);

  // Response rate
  const totalSent = messages.length;
  const totalRead = messages.filter(m => m.status === 'read').length;
  const averageResponseRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

  // Contact growth chart (daily for range)
  const contactGrowth: Array<{ date: string; count: number }> = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const count = contacts.filter(c => {
      if (!c.createdAt) return false;
      const contactDate = new Date(c.createdAt);
      return contactDate <= d;
    }).length;
    contactGrowth.push({ date: dateStr, count });
  }

  // Messages by day
  const messagesByDay: Array<{ date: string; sent: number; delivered: number; failed: number }> = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayMessages = messages.filter(m => {
      const msgDate = new Date(m.sentAt);
      return msgDate.toISOString().split('T')[0] === dateStr;
    });

    messagesByDay.push({
      date: dateStr,
      sent: dayMessages.length,
      delivered: dayMessages.filter(m => m.status === 'delivered' || m.status === 'read').length,
      failed: dayMessages.filter(m => m.status === 'failed').length
    });
  }

  // Status distribution
  const statusCounts: Record<string, number> = {};
  filteredContacts.forEach(contact => {
    const status = contact.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const statusConfig = config.statuses.reduce((acc, s) => {
    acc[s.name] = { label: s.label, color: s.color };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const colorMap: Record<string, string> = {
    green: '#10b981',
    blue: '#3b82f6',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#7c3aed',
    orange: '#f97316',
    pink: '#ec4899',
    gray: '#6b7280'
  };

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusConfig[status]?.label || status,
    value: count,
    color: colorMap[statusConfig[status]?.color] || '#6b7280'
  }));

  // Template performance
  const templateCounts = new Map<string, { sent: number; delivered: number; read: number; failed: number }>();
  messages.forEach(msg => {
    const template = msg.templateName || 'unknown';
    const current = templateCounts.get(template) || { sent: 0, delivered: 0, read: 0, failed: 0 };

    current.sent++;
    if (msg.status === 'delivered' || msg.status === 'read') current.delivered++;
    if (msg.status === 'read') current.read++;
    if (msg.status === 'failed') current.failed++;

    templateCounts.set(template, current);
  });

  const templatePerformance = Array.from(templateCounts.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.sent - a.sent)
    .slice(0, 10);

  // Best hours
  const hourCounts = new Array(24).fill(0);
  messages.forEach(msg => {
    const hour = new Date(msg.sentAt).getHours();
    hourCounts[hour]++;
  });
  const bestHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Best days
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayCounts = new Array(7).fill(0);
  messages.forEach(msg => {
    const day = new Date(msg.sentAt).getDay();
    dayCounts[day]++;
  });
  const bestDays = dayCounts
    .map((count, day) => ({ day: dayNames[day], count }))
    .sort((a, b) => b.count - a.count);

  // Top contacts
  const contactMessageCounts = new Map<string, number>();
  messages.forEach(msg => {
    const count = contactMessageCounts.get(msg.contactId) || 0;
    contactMessageCounts.set(msg.contactId, count + 1);
  });

  const topContacts = Array.from(contactMessageCounts.entries())
    .map(([id, messageCount]) => {
      const contact = contacts.find(c => c.id === id);
      const nameField = config.fields.find(f =>
        f.name.toLowerCase().includes('nombre') ||
        f.name.toLowerCase().includes('name')
      );
      const name = contact && nameField ? contact[nameField.name] : 'Desconocido';
      return { id, name, messageCount };
    })
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 10);

  return {
    kpis: {
      totalContacts,
      contactsGrowth,
      messagesSentToday,
      messagesSentWeek,
      messagesSentMonth,
      activeContacts,
      inactiveContacts,
      averageResponseRate
    },
    contactGrowth,
    messagesByDay,
    statusDistribution,
    templatePerformance,
    bestHours,
    bestDays,
    topContacts
  };
}
