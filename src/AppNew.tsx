import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from '../Dashboard';
import Chat from '../Chat';
import BulkMessaging from '../BulkMessaging';
import ContactLists from '../ContactLists';
import CRMPanel from '../CRMPanel';
import CampaignHistory from '../CampaignHistory';
import MessageScheduler from '../MessageScheduler';
import Templates from '../Templates';
import Configuration from '../Configuration';
import Sidebar from '../Sidebar';
import { useToast, ToastContainer } from '../Toast';
import { useState, useEffect } from 'react';
import { loadConfig } from '../storage';

type AppSection =
  | 'dashboard'
  | 'chat'
  | 'bulk-messaging'
  | 'contact-lists'
  | 'crm-panel'
  | 'campaign-history'
  | 'message-scheduler'
  | 'templates'
  | 'configuration';

function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState(loadConfig());
  const { toasts, removeToast } = useToast();

  console.log('[ProtectedLayout] Rendering, user:', user);
  console.log('[ProtectedLayout] Current section:', currentSection);

  useEffect(() => {
    // Apply custom colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.branding.primaryColor);
    root.style.setProperty('--secondary-color', config.branding.secondaryColor);
    root.style.setProperty('--accent-color', config.branding.accentColor);
  }, [config]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedLayout] No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  const renderCurrentSection = () => {
    console.log('[ProtectedLayout] Rendering section:', currentSection);
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
        return <Configuration config={config} onConfigUpdate={setConfig} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          config={config}
        />
        <main className="flex-1 overflow-auto">
          {renderCurrentSection()}
        </main>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </ErrorBoundary>
  );
}

export default function AppNew() {
  console.log('[AppNew] Rendering');
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedLayout />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
