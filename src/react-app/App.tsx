import { useState, useEffect } from "react";
import Sidebar from "@/react-app/components/Sidebar";
import Dashboard from "@/react-app/pages/Dashboard";
import Chat from "@/react-app/pages/Chat";
import BulkMessaging from "@/react-app/pages/BulkMessaging";
import ContactLists from "@/react-app/pages/ContactLists";
import CRMPanel from "@/react-app/pages/CRMPanel";
import CampaignHistory from "@/react-app/pages/CampaignHistory";
import MessageScheduler from "@/react-app/pages/MessageScheduler";
import Templates from "@/react-app/pages/Templates";
import Configuration from "@/react-app/pages/Configuration";
import { loadConfig, initializeDemoData } from "@/react-app/utils/storage";

export type AppSection = 
  | 'dashboard' 
  | 'chat' 
  | 'bulk-messaging' 
  | 'contact-lists' 
  | 'crm-panel' 
  | 'campaign-history' 
  | 'message-scheduler' 
  | 'templates' 
  | 'configuration';

export default function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState(loadConfig());

  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData();

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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
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
