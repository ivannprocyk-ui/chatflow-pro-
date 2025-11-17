import React from 'react';
import { AppSection } from "@/react-app/App";
import { AppConfig } from "@/react-app/utils/storage";
import {
  PieChart,
  Send,
  FileText,
  Clock,
  Megaphone,
  BarChart3,
  BookUser,
  Users,
  SlidersHorizontal,
  Calendar,
  Bot,
  Brain,
  ShieldCheck,
  Settings,
  MessageSquare,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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
  // Panel Principal
  { id: 'dashboard', Icon: PieChart, label: 'Dashboard', group: 'main' },

  // Mensajería
  { id: 'bulk-messaging', Icon: Send, label: 'Envío Masivo', group: 'messaging' },
  { id: 'templates', Icon: FileText, label: 'Plantillas', group: 'messaging' },
  { id: 'message-scheduler', Icon: Clock, label: 'Programar Envíos', group: 'messaging' },
  { id: 'campaign-history', Icon: Megaphone, label: 'Historial de Campañas', group: 'messaging' },
  { id: 'analytics', Icon: BarChart3, label: 'Analytics de Campañas', group: 'messaging' },

  // Contactos y CRM
  { id: 'contact-lists', Icon: BookUser, label: 'Listas de Contactos', group: 'crm' },
  { id: 'crm-panel', Icon: Users, label: 'Contactos', group: 'crm' },
  { id: 'crm-settings', Icon: SlidersHorizontal, label: 'Configurar CRM', group: 'crm' },
  { id: 'calendar', Icon: Calendar, label: 'Agenda', group: 'crm' },

  // Bot e IA
  { id: 'bot-config', Icon: Bot, label: 'Bot IA', group: 'bot' },
  { id: 'bot-analytics', Icon: Brain, label: 'Analytics Bot', group: 'bot' },

  // Administración
  { id: 'admin-panel', Icon: ShieldCheck, label: 'Panel Admin', group: 'admin' },
  { id: 'configuration', Icon: Settings, label: 'Configuración', group: 'admin' },
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
              <MessageSquare size={20} className="text-gray-600 dark:text-gray-300 transition-colors duration-300" />
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
        <ul className="space-y-1 px-4">
          {menuItems.map((item, index) => {
            const prevItem = index > 0 ? menuItems[index - 1] : null;
            const showGroupSeparator = prevItem && prevItem.group !== item.group;

            return (
              <React.Fragment key={item.id}>
                {/* Group Separator */}
                {showGroupSeparator && !isCollapsed && (
                  <li className="py-2">
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                  </li>
                )}

                <li>
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
                    <item.Icon size={18} className="transition-colors duration-300" />
                    {!isCollapsed && <span className="transition-colors duration-300">{item.label}</span>}
                  </button>
                </li>
              </React.Fragment>
            );
          })}
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
          {!isCollapsed && <span className="text-sm font-medium flex items-center gap-2">
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
            {darkMode ? 'Modo Oscuro' : 'Modo Claro'}
          </span>}
          {isCollapsed && (darkMode ? <Moon size={18} /> : <Sun size={18} />)}
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
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
