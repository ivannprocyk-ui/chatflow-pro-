import { useState, useEffect } from 'react';
import { Send, Settings, Users, Menu } from 'lucide-react';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import BulkMessaging from './BulkMessaging';
import NewConversationModal from './NewConversationModal';
import type { Conversation } from '@/shared/types';
export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showBulkMessaging, setShowBulkMessaging] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  const handleBackToList = () => {
    if (isMobile) {
      setShowSidebar(true);
      setSelectedConversation(null);
    }
  };
  const handleConversationCreated = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  return <div className="h-screen bg-gray-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isMobile && !showSidebar && <button onClick={() => setShowSidebar(true)} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
              <Menu className="w-5 h-5" />
            </button>}
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Creo Argentina</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => setShowBulkMessaging(true)} className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Envío Masivo</span>
          </button>
          
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation List */}
        <div className={`${isMobile ? showSidebar ? 'w-full' : 'w-0 overflow-hidden' : 'w-80'} flex-shrink-0 transition-all duration-300`}>
          <ConversationList selectedConversationId={selectedConversation?.id} onSelectConversation={handleSelectConversation} onNewConversation={() => setShowNewConversation(true)} />
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 ${isMobile && showSidebar ? 'hidden' : 'flex'} flex-col`}>
          {selectedConversation ? <ChatArea conversation={selectedConversation} onBack={isMobile ? handleBackToList : undefined} /> : <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">VRUna Ai</div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Bienvenido a ChatFlow
              </h2>
              
              <p className="text-center mb-8 max-w-md">
                Plataforma moderna de mensajería WhatsApp Business con capacidades de envío masivo y gestión de campañas.
              </p>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button onClick={() => setShowNewConversation(true)} className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  <Users className="w-5 h-5" />
                  <span>Nueva Conversación</span>
                </button>
                
                <button onClick={() => setShowBulkMessaging(true)} className="flex items-center space-x-2 px-6 py-3 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                  <Send className="w-5 h-5" />
                  <span>Envío Masivo</span>
                </button>
              </div>

              <div className="mt-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Características Principales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💬</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Chat Moderno</h4>
                    <p className="text-sm text-gray-600">Interfaz intuitiva con reacciones y archivos adjuntos</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📱</span>
                    </div>
                    <h4 className="font-medium text-gray-900">WhatsApp API</h4>
                    <p className="text-sm text-gray-600">Integración directa con Meta Cloud API</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Envío Masivo</h4>
                    <p className="text-sm text-gray-600">Campañas con plantillas aprobadas</p>
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </div>

      {/* Modals */}
      <BulkMessaging isOpen={showBulkMessaging} onClose={() => setShowBulkMessaging(false)} />

      <NewConversationModal isOpen={showNewConversation} onClose={() => setShowNewConversation(false)} onConversationCreated={handleConversationCreated} />
    </div>;
}