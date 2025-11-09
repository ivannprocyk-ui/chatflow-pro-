import { useState, useEffect } from 'react';
import { MessageCircle, Search, Plus, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Conversation } from '@/react-app/types';
import clsx from 'clsx';

interface ConversationListProps {
  selectedConversationId?: number;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export default function ConversationList({ 
  selectedConversationId, 
  onSelectConversation, 
  onNewConversation 
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.phone_number?.includes(searchQuery)
  );

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewConversation}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
            <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-center">
              {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones aún'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewConversation}
                className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Iniciar nueva conversación
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={clsx(
                  'flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100',
                  selectedConversationId === conversation.id && 'bg-green-50 border-r-4 border-r-green-500'
                )}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mr-3">
                  {conversation.avatar_url ? (
                    <img
                      src={conversation.avatar_url}
                      alt={conversation.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                      {getAvatarInitials(conversation.name)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                    {conversation.last_message_at && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  
                  {conversation.phone_number && (
                    <p className="text-xs text-gray-500 mb-1">
                      {conversation.phone_number}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message || 'No hay mensajes'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] flex items-center justify-center ml-2">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}