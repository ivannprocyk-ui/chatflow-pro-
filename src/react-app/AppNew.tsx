import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer, useToast } from './components/Toast';
import { useEffect, useState } from 'react';
import { loadConfig, AppConfig } from './utils/storage';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Main app pages
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import BulkMessaging from './pages/BulkMessaging';
import ContactLists from './pages/ContactLists';
import CRMPanel from './pages/CRMPanel';
import CampaignHistory from './pages/CampaignHistory';
import MessageScheduler from './pages/MessageScheduler';
import Templates from './pages/Templates';
import Configuration from './pages/Configuration';
import CRMSettings from './pages/CRMSettings';
import Calendar from './pages/Calendar';
import AISettings from './pages/AISettings';

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
  | 'ai-settings';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main App Layout
function AppLayout({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast();
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      return loadConfig();
    } catch (error) {
      console.error('Error loading config:', error);
      return {
        api: { phoneNumberId: '', wabaId: '', accessToken: '', apiVersion: 'v21.0' },
        branding: { appName: 'ChatFlow Pro', logoUrl: '', primaryColor: '#25D366', secondaryColor: '#128C7E', accentColor: '#8B5CF6' }
      };
    }
  });

  useEffect(() => {
    // Apply dark mode from localStorage
    const darkMode = localStorage.getItem('dark_mode') === 'true';
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }

    // Apply custom colors to CSS variables
    try {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', config?.branding?.primaryColor || '#25D366');
      root.style.setProperty('--secondary-color', config?.branding?.secondaryColor || '#128C7E');
      root.style.setProperty('--accent-color', config?.branding?.accentColor || '#8B5CF6');
    } catch (error) {
      console.error('Error applying CSS variables:', error);
    }
  }, [config]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        config={config}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// App Router
function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/bulk-messaging" element={<BulkMessaging />} />
                    <Route path="/contact-lists" element={<ContactLists />} />
                    <Route path="/crm-panel" element={<CRMPanel />} />
                    <Route path="/crm-settings" element={<CRMSettings />} />
                    <Route path="/campaign-history" element={<CampaignHistory />} />
                    <Route path="/message-scheduler" element={<MessageScheduler />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/configuration" element={<Configuration />} />
                    <Route path="/ai-settings" element={<AISettings />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
