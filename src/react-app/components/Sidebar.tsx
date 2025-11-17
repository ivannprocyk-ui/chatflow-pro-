import { AppSection } from "@/react-app/App";
import { AppConfig } from "@/react-app/utils/storage";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  currentSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  onToggle: () => void;
  onToggleCollapse?: () => void;
  config: AppConfig;
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
}

const menuItems = [
  { id: 'dashboard', icon: 'fas fa-chart-pie', label: 'Dashboard' },
  { id: 'bulk-messaging', icon: 'fas fa-paper-plane', label: 'Envío Masivo' },
  { id: 'contact-lists', icon: 'fas fa-address-book', label: 'Listas de Contactos' },
  { id: 'crm-panel', icon: 'fas fa-chart-line', label: 'Contactos' },
  { id: 'crm-settings', icon: 'fas fa-sliders-h', label: 'Configurar CRM' },
  { id: 'calendar', icon: 'fas fa-calendar-alt', label: 'Agenda' },
  { id: 'campaign-history', icon: 'fas fa-bullhorn', label: 'Historial de Campañas' },
  { id: 'analytics', icon: 'fas fa-chart-bar', label: 'Analytics' },
  { id: 'automations', icon: 'fas fa-magic', label: 'Automatizaciones' },
  { id: 'follow-ups', icon: 'fas fa-comment-dots', label: 'Seguimientos' },
  { id: 'message-scheduler', icon: 'fas fa-clock', label: 'Programar Envíos' },
  { id: 'templates', icon: 'fas fa-file-alt', label: 'Plantillas' },
  { id: 'bot-config', icon: 'fas fa-robot', label: 'Bot IA' },
  { id: 'bot-analytics', icon: 'fas fa-brain', label: 'Analytics Bot' },
  { id: 'admin-panel', icon: 'fas fa-user-shield', label: 'Panel Admin' },
  { id: 'configuration', icon: 'fas fa-cog', label: 'Configuración' },
] as const;

export default function Sidebar({ isOpen, isCollapsed = false, currentSection, onSectionChange, onToggleCollapse, config, darkMode = false, onDarkModeToggle }: SidebarProps) {
  const handleDarkModeToggle = () => {
    if (onDarkModeToggle) {
      onDarkModeToggle();
    }
  };

  return (
    <div
      className={`
        fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'w-72'}
        bg-white dark:bg-gray-800 shadow-xl
        border-r border-gray-200 dark:border-gray-700
        transition-colors
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          {config.branding.logoUrl ? (
            <img
              src={config.branding.logoUrl}
              alt="Logo"
              className="w-10 h-10 rounded-lg object-cover ring-2 ring-gray-300 dark:ring-gray-600 transition-colors duration-300"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors duration-300">
              <i className="fas fa-comments text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300"></i>
            </div>
          )}
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">{config.branding.appName}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">WhatsApp Business Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id as AppSection)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl
                  transition-all duration-300
                  ${currentSection === item.id
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white font-semibold shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <i className={`${item.icon} text-lg ${isCollapsed ? '' : 'w-5'} transition-colors duration-300`}></i>
                {!isCollapsed && <span className="transition-colors duration-300">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3 transition-colors duration-300">
        {/* Dark Mode Toggle */}
        <button
          onClick={handleDarkModeToggle}
          className={`
            w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2 rounded-lg
            bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
            transition-all duration-300 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
          `}
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {!isCollapsed && <span className="text-sm font-medium">{darkMode ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}</span>}
          {isCollapsed && <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'} text-lg`}></i>}
          {!isCollapsed && (
            <div className="relative inline-block w-10 h-5">
              <div className={`block w-10 h-5 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-300'} transition-colors`}></div>
              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          )}
        </button>

        {/* Collapse Button - Hidden on mobile */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <i className={`fas ${isCollapsed ? 'fa-angle-right' : 'fa-angle-left'} transition-colors duration-300`}></i>
            {!isCollapsed && <span className="text-sm transition-colors duration-300">Colapsar</span>}
          </button>
        )}

        {!isCollapsed && (
          <div className="text-center text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
            <p className="transition-colors duration-300">ChatFlow Pro v2.0</p>
            <p className="transition-colors duration-300">WhatsApp Business Solution</p>
          </div>
        )}
      </div>
    </div>
  );
}
