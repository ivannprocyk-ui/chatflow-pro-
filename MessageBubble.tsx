import { useState } from 'react';
import { MoreVertical, Smile } from 'lucide-react';
import type { Message, MessageReaction } from '@/shared/types';
import clsx from 'clsx';

interface MessageBubbleProps {
  message: Message & { reactions?: MessageReaction[] };
  isOwnMessage: boolean;
  onAddReaction: (messageId: number, emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ message, isOwnMessage, onAddReaction }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '✗';
      default:
        return '';
    }
  };

  const getReactionCounts = () => {
    if (!message.reactions || message.reactions.length === 0) return {};
    
    const counts: Record<string, number> = {};
    message.reactions.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    
    return counts;
  };

  const reactionCounts = getReactionCounts();

  const renderAttachment = () => {
    if (!message.attachment_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <img
            src={message.attachment_url}
            alt="Imagen"
            className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachment_url, '_blank')}
          />
        );
      case 'video':
        return (
          <video
            src={message.attachment_url}
            controls
            className="max-w-sm rounded-lg"
          />
        );
      case 'audio':
        return (
          <audio
            src={message.attachment_url}
            controls
            className="max-w-sm"
          />
        );
      case 'document':
        return (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-sm font-medium">📄</span>
            </div>
            <span className="text-sm text-gray-700">Documento</span>
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={clsx(
        'flex mb-4 relative group',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div
        className={clsx(
          'max-w-xs lg:max-w-md xl:max-w-lg relative',
          isOwnMessage ? 'order-1' : 'order-2'
        )}
      >
        {/* Message Bubble */}
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 shadow-sm relative',
            isOwnMessage
              ? 'bg-green-500 text-white rounded-br-sm'
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
          )}
        >
          {/* Attachment */}
          {message.attachment_url && (
            <div className="mb-2">
              {renderAttachment()}
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Time and Status */}
          <div
            className={clsx(
              'flex items-center justify-end mt-2 space-x-1 text-xs',
              isOwnMessage ? 'text-green-100' : 'text-gray-500'
            )}
          >
            <span>{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              <span
                className={clsx(
                  'ml-1',
                  message.status === 'read' && 'text-blue-200',
                  message.status === 'failed' && 'text-red-200'
                )}
              >
                {getStatusIcon(message.status)}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onAddReaction(message.id, emoji)}
                className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-xs transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {showActions && (
          <div
            className={clsx(
              'absolute top-0 flex items-center space-x-1',
              isOwnMessage ? '-left-20' : '-right-20'
            )}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-2 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            >
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Reaction Picker */}
        {showReactions && (
          <div
            className={clsx(
              'absolute top-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1',
              isOwnMessage ? '-left-32' : '-right-32'
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onAddReaction(message.id, emoji);
                  setShowReactions(false);
                }}
                className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}