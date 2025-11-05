import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import type { Conversation, Message, MessageReaction } from '@/shared/types';
import MessageBubble from './MessageBubble';
import clsx from 'clsx';

interface ChatAreaProps {
  conversation: Conversation;
  onBack?: () => void;
}

export default function ChatArea({ conversation, onBack }: ChatAreaProps) {
  const [messages, setMessages] = useState<(Message & { reactions?: MessageReaction[] })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          message_type: 'text',
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, { ...message, reactions: [] }]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      const response = await fetch('/api/messages/react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          emoji,
        }),
      });

      if (response.ok) {
        // Refresh messages to get updated reactions
        fetchMessages();
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          {/* Back button for mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="mr-3 md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar */}
          <div className="flex-shrink-0 mr-3">
            {conversation.avatar_url ? (
              <img
                src={conversation.avatar_url}
                alt={conversation.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                {getAvatarInitials(conversation.name)}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="font-semibold text-gray-900">{conversation.name}</h2>
            {conversation.phone_number && (
              <p className="text-sm text-gray-500">{conversation.phone_number}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl mb-4">
              {getAvatarInitials(conversation.name)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{conversation.name}</h3>
            {conversation.phone_number && (
              <p className="text-sm text-gray-500 mb-4">{conversation.phone_number}</p>
            )}
            <p className="text-center text-gray-500">
              Este es el inicio de tu conversación con {conversation.name}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_type === 'user'}
                onAddReaction={handleAddReaction}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              rows={1}
              style={{ maxHeight: '120px' }}
              disabled={sending}
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={clsx(
              'flex-shrink-0 p-3 rounded-full transition-colors',
              newMessage.trim() && !sending
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}