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
