import { useState, useEffect, useRef } from "react";
import Sidebar from "@/react-app/components/Sidebar";
import Dashboard from "@/react-app/pages/Dashboard";
import BulkMessaging from "@/react-app/pages/BulkMessaging";
import ContactLists from "@/react-app/pages/ContactLists";
import CRMPanel from "@/react-app/pages/CRMPanel";
import CampaignHistory from "@/react-app/pages/CampaignHistory";
import MessageScheduler from "@/react-app/pages/MessageScheduler";
import Templates from "@/react-app/pages/Templates";
import Configuration from "@/react-app/pages/Configuration";
import CRMSettings from "@/react-app/pages/CRMSettings";
import Calendar from "@/react-app/pages/Calendar";
import AISettings from "@/react-app/pages/AISettings";
import Analytics from "@/react-app/pages/Analytics";
import Automations from "@/react-app/pages/Automations";
import FlowBuilder from "@/react-app/pages/FlowBuilder";
import AdminPanel from "@/react-app/pages/AdminPanel";
import { loadConfig, initializeDemoData, loadScheduledMessages, saveScheduledMessages, loadContactLists, loadCRMData, saveCampaigns, loadCampaigns, addMessageToHistory } from "@/react-app/utils/storage";
import { ToastContainer, useToast } from "@/react-app/components/Toast";

export type AppSection =
  | 'dashboard'
  | 'bulk-messaging'
  | 'contact-lists'
  | 'crm-panel'
  | 'crm-settings'
  | 'campaign-history'
  | 'message-scheduler'
  | 'templates'
  | 'calendar'
  | 'configuration'
  | 'ai-settings'
  | 'analytics'
  | 'automations'
  | 'flow-builder'
  | 'admin-panel';

export default function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>(() => {
    // Load current section from localStorage
    const saved = localStorage.getItem('current_section');
    // Validate that saved value is a valid AppSection
    const validSections: AppSection[] = [
      'dashboard', 'bulk-messaging', 'contact-lists', 'crm-panel',
      'crm-settings', 'campaign-history', 'message-scheduler',
      'templates', 'calendar', 'configuration', 'ai-settings', 'analytics',
      'automations', 'flow-builder', 'admin-panel'
    ];
    return saved && validSections.includes(saved as AppSection)
      ? (saved as AppSection)
      : 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('dark_mode');
    return saved === 'true';
  });
  const [config, setConfig] = useState(loadConfig());
  const { toasts, removeToast } = useToast();
  const [flowBuilderAutomationId, setFlowBuilderAutomationId] = useState<string | null>(null);

  // Navigation handler that can accept data
  const handleNavigate = (section: AppSection, data?: any) => {
    if (section === 'flow-builder' && data?.automationId !== undefined) {
      setFlowBuilderAutomationId(data.automationId);
    }
    setCurrentSection(section);
  };

  // Save current section to localStorage
  useEffect(() => {
    localStorage.setItem('current_section', currentSection);
  }, [currentSection]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Apply dark mode
  useEffect(() => {
    localStorage.setItem('dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData();

    // Apply custom colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.branding.primaryColor);
    root.style.setProperty('--secondary-color', config.branding.secondaryColor);
    root.style.setProperty('--accent-color', config.branding.accentColor);

    // Listen for navigation events
    const handleNavigate = (e: any) => {
      if (e.detail) {
        setCurrentSection(e.detail as AppSection);
      }
    };

    window.addEventListener('navigate-to', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate-to', handleNavigate as EventListener);
    };
  }, [config]);

  // ==========================================
  // SCHEDULED MESSAGE EXECUTION SYSTEM
  // Runs in background regardless of current page
  // ==========================================
  const executionCheckRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingRef = useRef(false);

  // Helper function to get contacts for a message
  const getContactsForMessage = (message: any, contactLists: any[]) => {
    if (message.contactIds && message.contactIds.length > 0) {
      // Direct contact selection from CRM
      const crmContacts = loadCRMData();
      return message.contactIds.map((id: string) => crmContacts.find(c => c.id === id)).filter(Boolean);
    } else if (message.contactListId) {
      // Contact list selection
      const list = contactLists.find((l: any) => l.id === message.contactListId);
      return list?.contacts || [];
    }
    return [];
  };

  // Helper function to send message via WhatsApp API
  const sendMessageToAPI = async (contact: any, templateName: string, imageUrl?: string) => {
    if (!config.api.accessToken || !config.api.phoneNumberId) {
      throw new Error('API no configurada');
    }

    const phone = contact.phone || contact.telefono || contact.whatsapp;
    if (!phone) {
      throw new Error('Contacto sin número de teléfono');
    }

    // Load templates from cache
    const cachedTemplates = localStorage.getItem('chatflow_cached_templates');
    if (!cachedTemplates) {
      throw new Error('No hay plantillas disponibles');
    }

    const templates = JSON.parse(cachedTemplates);
    const template = templates.find((t: any) => t.name === templateName && t.status === 'APPROVED');

    if (!template) {
      throw new Error(`Plantilla "${templateName}" no encontrada o no aprobada`);
    }

    // Check if template has image header
    const hasImageHeader = template.components?.some((c: any) =>
      c.type === 'HEADER' && c.format === 'IMAGE'
    );

    // Build template components
    const templateComponents: any[] = [];

    // Add image header if template has it and URL is provided
    if (hasImageHeader && imageUrl) {
      templateComponents.push({
        type: 'header',
        parameters: [{
          type: 'image',
          image: {
            link: imageUrl
          }
        }]
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/${config.api.apiVersion}/${config.api.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: template.language
            },
            ...(templateComponents.length > 0 && { components: templateComponents })
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al enviar mensaje');
    }

    return await response.json();
  };

  // Function to execute a scheduled message
  const executeScheduledMessage = async (message: any) => {
    if (isExecutingRef.current) return;

    isExecutingRef.current = true;
    console.log(`[ScheduledExecution] Executing message: ${message.campaignName}`);

    try {
      // 1. Get contacts
      const contactLists = loadContactLists();
      const contacts = getContactsForMessage(message, contactLists);

      if (!contacts || contacts.length === 0) {
        throw new Error('No se encontraron contactos para enviar');
      }

      // 2. Send messages
      const results = {
        total: contacts.length,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const contact of contacts) {
        try {
          await sendMessageToAPI(contact, message.template, message.imageUrl);
          results.sent++;

          // Add to contact history
          if (contact.id) {
            addMessageToHistory(contact.id, {
              template: message.template,
              status: 'sent',
              timestamp: new Date().toISOString(),
              campaignName: message.campaignName
            });
          }

          // Delay between messages (2 seconds)
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${contact.phone || contact.telefono || 'Unknown'}: ${error.message}`);
        }
      }

      // 3. Update scheduled message status
      const allMessages = loadScheduledMessages();
      const updatedMessages = allMessages.map((msg: any) =>
        msg.id === message.id
          ? { ...msg, status: 'sent', executedAt: new Date().toISOString() }
          : msg
      );
      saveScheduledMessages(updatedMessages);

      // 4. Save to campaign history
      const campaign = {
        id: Date.now().toString(),
        name: message.campaignName,
        template: message.template,
        date: new Date().toISOString(),
        contacts: results.total,  // CampaignHistory expects 'contacts' not 'total'
        sent: results.sent,
        errors: results.failed,   // CampaignHistory expects 'errors' not 'failed'
        status: 'completed' as const,  // CampaignHistory expects 'status' field
        createdAt: message.createdAt || new Date().toISOString(),
        type: 'scheduled',
        source: 'auto_execution'
      };

      const campaigns = loadCampaigns();
      saveCampaigns([...campaigns, campaign]);

      console.log(`[ScheduledExecution] Campaign "${message.campaignName}" executed: ${results.sent}/${results.total} sent`);

      // Dispatch custom event to notify MessageScheduler page if it's open
      window.dispatchEvent(new CustomEvent('scheduled-message-executed', {
        detail: { messageId: message.id, results }
      }));

    } catch (error: any) {
      console.error('[ScheduledExecution] Error executing scheduled message:', error);
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Function to check and execute scheduled messages
  const checkAndExecuteScheduledMessages = async () => {
    if (isExecutingRef.current) {
      console.log('[ScheduledExecution] Already executing, skipping check');
      return;
    }

    const now = new Date();
    const allMessages = loadScheduledMessages();
    const pendingMessages = allMessages.filter((msg: any) => msg.status === 'pending');

    console.log(`[ScheduledExecution] Checking at ${now.toLocaleString('es-AR')} - ${pendingMessages.length} pending messages`);

    for (const message of pendingMessages) {
      const scheduledDateTime = new Date(`${message.scheduledDate}T${message.scheduledTime}`);

      console.log(`[ScheduledExecution] Message "${message.campaignName}": scheduled for ${scheduledDateTime.toLocaleString('es-AR')}, current time: ${now.toLocaleString('es-AR')}, should execute: ${now >= scheduledDateTime}`);

      // If scheduled time has passed, execute it
      if (now >= scheduledDateTime) {
        console.log(`[ScheduledExecution] ✓ Time to execute "${message.campaignName}" - scheduled for ${scheduledDateTime.toLocaleString('es-AR')}`);
        await executeScheduledMessage(message);
      } else {
        const minutesUntilExecution = Math.round((scheduledDateTime.getTime() - now.getTime()) / 60000);
        console.log(`[ScheduledExecution] ⏳ Not yet time for "${message.campaignName}" - ${minutesUntilExecution} minutes remaining`);
      }
    }
  };

  // Set up automatic scheduled message execution
  useEffect(() => {
    console.log('[ScheduledExecution] Setting up background execution check');

    // Check messages every 60 seconds
    executionCheckRef.current = setInterval(() => {
      checkAndExecuteScheduledMessages();
    }, 60000);

    // Check immediately on mount
    checkAndExecuteScheduledMessages();

    return () => {
      console.log('[ScheduledExecution] Cleaning up background execution check');
      if (executionCheckRef.current) {
        clearInterval(executionCheckRef.current);
      }
    };
  }, []); // Empty deps - runs once and stays active

  // ==========================================
  // END OF SCHEDULED MESSAGE EXECUTION SYSTEM
  // ==========================================

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'bulk-messaging':
        return <BulkMessaging />;
      case 'contact-lists':
        return <ContactLists />;
      case 'crm-panel':
        return <CRMPanel />;
      case 'crm-settings':
        return <CRMSettings />;
      case 'campaign-history':
        return <CampaignHistory />;
      case 'message-scheduler':
        return <MessageScheduler />;
      case 'templates':
        return <Templates />;
      case 'calendar':
        return <Calendar />;
      case 'configuration':
        return <Configuration onConfigUpdate={setConfig} darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />;
      case 'ai-settings':
        return <AISettings />;
      case 'analytics':
        return <Analytics />;
      case 'automations':
        return <Automations onNavigate={handleNavigate} />;
      case 'flow-builder':
        return <FlowBuilder onNavigate={setCurrentSection} automationId={flowBuilderAutomationId} />;
      case 'admin-panel':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        config={config}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center transition-colors duration-300">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-bars text-gray-600 dark:text-gray-300"></i>
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
            {config.branding.appName}
          </h1>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {renderCurrentSection()}
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
