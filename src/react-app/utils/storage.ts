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

// Demo Data Initialization
const demoTemplates = [
  {
    id: 1,
    name: 'bienvenida_template',
    language: 'es',
    status: 'APPROVED',
    category: 'MARKETING',
    components: JSON.stringify([
      { type: 'HEADER', format: 'TEXT', text: 'Bienvenido a ChatFlow' },
      { type: 'BODY', text: 'Hola! Gracias por unirte a nuestra comunidad. Estamos aquí para ayudarte con cualquier consulta.' },
      { type: 'FOOTER', text: 'ChatFlow Pro' }
    ])
  },
  {
    id: 2,
    name: 'promocion_especial',
    language: 'es',
    status: 'APPROVED',
    category: 'MARKETING',
    components: JSON.stringify([
      { type: 'HEADER', format: 'IMAGE' },
      { type: 'BODY', text: '¡Oferta especial! Obtén un 20% de descuento en tu próxima compra. Válido hasta fin de mes.' },
      { type: 'FOOTER', text: 'ChatFlow Pro' }
    ])
  },
  {
    id: 3,
    name: 'recordatorio_cita',
    language: 'es',
    status: 'APPROVED',
    category: 'UTILITY',
    components: JSON.stringify([
      { type: 'BODY', text: 'Recordatorio: Tienes una cita programada. Te esperamos!' },
      { type: 'FOOTER', text: 'ChatFlow Pro' }
    ])
  }
];

const demoContactLists = [
  {
    id: '1',
    name: 'Clientes Premium',
    description: 'Lista de clientes premium con mayor engagement',
    contacts: [
      { phone_number: '+5491123456789', first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com' },
      { phone_number: '+5491198765432', first_name: 'María', last_name: 'González', email: 'maria@example.com' },
      { phone_number: '+5491155554444', first_name: 'Carlos', last_name: 'Rodríguez', email: 'carlos@example.com' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Lista de Contactos General',
    description: 'Todos los contactos activos',
    contacts: [
      { phone_number: '+5491111111111', first_name: 'Ana', last_name: 'López' },
      { phone_number: '+5491122222222', first_name: 'Pedro', last_name: 'Martínez' }
    ],
    createdAt: new Date().toISOString()
  }
];

const demoCRMData = [
  {
    id: '1',
    name: 'Juan Pérez',
    phone: '+5491123456789',
    email: 'juan@example.com',
    messagesSent: 15,
    lastInteraction: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: '2',
    name: 'María González',
    phone: '+5491198765432',
    email: 'maria@example.com',
    messagesSent: 22,
    lastInteraction: new Date(Date.now() - 86400000).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString()
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    phone: '+5491155554444',
    email: 'carlos@example.com',
    messagesSent: 8,
    lastInteraction: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'inactive',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
  }
];

export function initializeDemoData(): void {
  try {
    // Only initialize if data doesn't exist
    if (!localStorage.getItem('chatflow_templates')) {
      saveTemplates(demoTemplates);
    }
    if (!localStorage.getItem('chatflow_contact_lists')) {
      saveContactLists(demoContactLists);
    }
    if (!localStorage.getItem('chatflow_crm_data')) {
      saveCRMData(demoCRMData);
    }
  } catch (error) {
    console.error('Error initializing demo data:', error);
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
