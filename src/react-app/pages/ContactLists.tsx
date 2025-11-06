import { useState, useEffect } from 'react';
import { loadContactLists, saveContactLists } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';

interface ContactList {
  id: string;
  name: string;
  description: string;
  contacts: Contact[];
  createdAt: string;
}

interface Contact {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function ContactLists() {
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [newList, setNewList] = useState({
    name: '',
    description: '',
    contactsText: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setContactLists(loadContactLists());
  }, []);

  const saveToStorage = (lists: ContactList[]) => {
    setContactLists(lists);
    saveContactLists(lists);
  };

  const handleUseList = (list: ContactList) => {
    // Pre-select this list for bulk messaging
    localStorage.setItem('selected_contact_list', list.id);
    showSuccess(`Lista "${list.name}" seleccionada. Ve a Envío Masivo para usarla.`);
    window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'bulk-messaging' }));
  };

  const handleCreateList = () => {
    if (!newList.name.trim()) {
      showError('El nombre de la lista es requerido');
      return;
    }

    const contacts: Contact[] = newList.contactsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          phone_number: parts[0] || '',
          first_name: parts[1] || '',
          last_name: parts[2] || '',
          email: parts[3] || ''
        };
      })
      .filter(contact => contact.phone_number.length > 0);

    const list: ContactList = {
      id: Date.now().toString(),
      name: newList.name,
      description: newList.description,
      contacts,
      createdAt: new Date().toISOString()
    };

    if (editingList) {
      const updatedLists = contactLists.map(l => 
        l.id === editingList.id ? { ...list, id: editingList.id } : l
      );
      saveToStorage(updatedLists);
    } else {
      saveToStorage([...contactLists, list]);
    }

    setShowModal(false);
    setEditingList(null);
    setNewList({ name: '', description: '', contactsText: '' });
  };

  const handleEditList = (list: ContactList) => {
    setEditingList(list);
    setNewList({
      name: list.name,
      description: list.description,
      contactsText: list.contacts
        .map(c => [c.phone_number, c.first_name, c.last_name, c.email].filter(Boolean).join(', '))
        .join('\n')
    });
    setShowModal(true);
  };

  const handleDeleteList = (listId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta lista?')) {
      const updatedLists = contactLists.filter(l => l.id !== listId);
      saveToStorage(updatedLists);
    }
  };

  const openModal = () => {
    setEditingList(null);
    setNewList({ name: '', description: '', contactsText: '' });
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Listas de Contactos</h1>
          <p className="text-gray-600">Organiza tus contactos en listas para campañas dirigidas</p>
        </div>
        <button
          onClick={openModal}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>Nueva Lista</span>
        </button>
      </div>

      {/* Lists Grid */}
      {contactLists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactLists.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{list.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{list.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <i className="fas fa-users"></i>
                      <span>{list.contacts.length} contactos</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <i className="fas fa-calendar"></i>
                      <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseList(list)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all"
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Usar
                </button>
                <button
                  onClick={() => handleEditList(list)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteList(list.id)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
            <i className="fas fa-address-book text-8xl"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No hay listas de contactos</h3>
          <p className="text-gray-600 mb-6">Crea tu primera lista para organizar tus contactos</p>
          <button
            onClick={openModal}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Crear Primera Lista
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingList ? 'Editar Lista' : 'Nueva Lista de Contactos'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la lista <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="Ejemplo: Clientes Premium"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="Breve descripción de la lista"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contactos (uno por línea)
                </label>
                <textarea
                  value={newList.contactsText}
                  onChange={(e) => setNewList({ ...newList, contactsText: e.target.value })}
                  placeholder="Formato: teléfono, nombre, apellido, email (separados por comas)&#10;Ejemplo:&#10;+5491234567890, Juan, Pérez, juan@email.com&#10;+5491234567891, María, García&#10;+5491234567892"
                  rows={8}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Puedes usar solo el número de teléfono o agregar más datos separados por comas.
                  Solo el teléfono es obligatorio.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateList}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                {editingList ? 'Actualizar Lista' : 'Crear Lista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
