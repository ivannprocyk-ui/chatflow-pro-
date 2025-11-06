import { AppSection } from "@/react-app/App";
import { AppConfig } from "@/react-app/utils/storage";

interface SidebarProps {
  isOpen: boolean;
  currentSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  onToggle: () => void;
  config: AppConfig;
}

const menuItems = [
  { id: 'dashboard', icon: 'fas fa-chart-pie', label: 'Dashboard' },
  { id: 'chat', icon: 'fas fa-comments', label: 'Chat' },
  { id: 'bulk-messaging', icon: 'fas fa-paper-plane', label: 'Envío Masivo' },
  { id: 'contact-lists', icon: 'fas fa-address-book', label: 'Listas de Contactos' },
  { id: 'crm-panel', icon: 'fas fa-chart-line', label: 'Panel CRM' },
  { id: 'campaign-history', icon: 'fas fa-bullhorn', label: 'Historial de Campañas' },
  { id: 'message-scheduler', icon: 'fas fa-clock', label: 'Programador de Mensajes' },
  { id: 'templates', icon: 'fas fa-file-alt', label: 'Plantillas' },
  { id: 'configuration', icon: 'fas fa-cog', label: 'Configuración' },
] as const;

export default function Sidebar({ isOpen, currentSection, onSectionChange, config }: SidebarProps) {
  return (
    <div
      className={`
        fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-72 bg-gradient-to-b from-green-600 to-green-700 text-white shadow-xl
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-green-500/30">
        <div className="flex items-center space-x-3">
          {config.branding.logoUrl ? (
            <img 
              src={config.branding.logoUrl} 
              alt="Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <i className="fas fa-comments text-white text-lg"></i>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{config.branding.appName}</h1>
            <p className="text-green-100 text-sm">WhatsApp Business Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id as AppSection)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                  transition-all duration-200 text-left
                  ${currentSection === item.id
                    ? 'bg-white/20 text-white font-semibold shadow-lg'
                    : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <i className={`${item.icon} text-lg w-5`}></i>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-green-500/30">
        <div className="text-center text-green-100 text-sm">
          <p>ChatFlow Pro v2.0</p>
          <p>WhatsApp Business Solution</p>
        </div>
      </div>
    </div>
  );
}
