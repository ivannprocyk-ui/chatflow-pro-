import { useState, useEffect } from "react";
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
import { loadConfig, initializeDemoData } from "@/react-app/utils/storage";
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
  | 'configuration';

export default function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
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

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Apply dark mode
  useEffect(() => {
    localStorage.setItem('dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
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

    // Listen for theme change events
    const handleThemeChange = (e: any) => {
      if (e.detail && e.detail.darkMode !== undefined) {
        setDarkMode(e.detail.darkMode);
      }
    };

    window.addEventListener('navigate-to', handleNavigate as EventListener);
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('navigate-to', handleNavigate as EventListener);
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
    };
  }, [config]);

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
        return <Configuration onConfigUpdate={setConfig} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        config={config}
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
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-bars text-gray-600"></i>
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">
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
