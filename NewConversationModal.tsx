import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, User, Users } from 'lucide-react';
import type { Conversation } from '@/shared/types';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export default function NewConversationModal({ 
  isOpen, 
  onClose, 
  onConversationCreated 
}: NewConversationModalProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phoneNumber.trim() || undefined,
          is_group: isGroup,
        }),
      });

      if (response.ok) {
        const conversation = await response.json();
        onConversationCreated(conversation);
        
        // Reset form
        setName('');
        setPhoneNumber('');
        setIsGroup(false);
        onClose();
      } else {
        throw new Error('Error al crear la conversación');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Error al crear la conversación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Nueva Conversación
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Conversation Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Tipo de conversación:</label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsGroup(false)}
                  className={`flex-1 flex items-center justify-center space-x-2 p-3 border-2 rounded-lg transition-colors ${
                    !isGroup
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGroup(true)}
                  className={`flex-1 flex items-center justify-center space-x-2 p-3 border-2 rounded-lg transition-colors ${
                    isGroup
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Grupo</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {isGroup ? 'Nombre del grupo' : 'Nombre del contacto'} *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isGroup ? "Ej: Equipo de trabajo" : "Ej: Juan Pérez"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                required
                disabled={loading}
              />
            </div>

            {/* Phone Number */}
            {!isGroup && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato internacional recomendado
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}