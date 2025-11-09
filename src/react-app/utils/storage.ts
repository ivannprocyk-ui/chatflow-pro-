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
    const stored = localStorage.getItem('chatflow_templates');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

export function saveTemplates(templates: any[]): void {
  try {
    localStorage.setItem('chatflow_templates', JSON.stringify(templates));
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

  const cleaned = contacts.map(contact => {
    const cleanedContact = { ...contact };

    // Limpiar teléfonos
    config.fields.filter(f => f.type === 'phone').forEach(field => {
      if (cleanedContact[field.name]) {
        const original = cleanedContact[field.name];
        const cleaned = cleanPhone(original);
        if (original !== cleaned) {
          cleanedContact[field.name] = cleaned;
          changes++;
        }
      }
    });

    // Normalizar textos
    config.fields.filter(f => f.type === 'text').forEach(field => {
      if (cleanedContact[field.name] && typeof cleanedContact[field.name] === 'string') {
        const original = cleanedContact[field.name];
        const normalized = normalizeText(original);
        if (original !== normalized) {
          cleanedContact[field.name] = normalized;
          changes++;
        }
      }
    });

    // Normalizar emails
    config.fields.filter(f => f.type === 'email').forEach(field => {
      if (cleanedContact[field.name]) {
        const original = cleanedContact[field.name];
        const normalized = original.toLowerCase().trim();
        if (original !== normalized) {
          cleanedContact[field.name] = normalized;
          changes++;
        }
      }
    });

    return cleanedContact;
  });

  return { cleaned, changes };
}
