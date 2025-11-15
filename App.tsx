import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Chat from "./Chat";
import BulkMessaging from "./BulkMessaging";
import ContactLists from "./ContactLists";
import CRMPanel from "./CRMPanel";
import CampaignHistory from "./CampaignHistory";
import MessageScheduler from "./MessageScheduler";
import Templates from "./Templates";
import Configuration from "./Configuration";
import BotConfiguration from "./BotConfiguration";
import BotAnalytics from "./BotAnalytics";
import { loadConfig } from "./storage";
import { useToast, ToastContainer } from "./Toast";

export type AppSection =
  | 'dashboard'
  | 'chat'
  | 'bulk-messaging'
  | 'contact-lists'
  | 'crm-panel'
  | 'campaign-history'
  | 'message-scheduler'
  | 'templates'
  | 'configuration'
  | 'bot-configuration'
  | 'bot-analytics';

export default function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState(loadConfig());
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    // Apply custom colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.branding.primaryColor);
    root.style.setProperty('--secondary-color', config.branding.secondaryColor);
    root.style.setProperty('--accent-color', config.branding.accentColor);
  }, [config]);

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <Chat />;
      case 'bulk-messaging':
        return <BulkMessaging />;
      case 'contact-lists':
        return <ContactLists />;
      case 'crm-panel':
        return <CRMPanel />;
      case 'campaign-history':
        return <CampaignHistory />;
      case 'message-scheduler':
        return <MessageScheduler />;
      case 'templates':
        return <Templates />;
      case 'configuration':
        return <Configuration onConfigUpdate={setConfig} />;
      case 'bot-configuration':
        return <BotConfiguration />;
      case 'bot-analytics':
        return <BotAnalytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Sidebar
        isOpen={sidebarOpen}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
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
    </div>
  );
}
