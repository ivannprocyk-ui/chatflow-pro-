import { useState, useEffect } from 'react';
import { loadContactLists, saveContactLists, formatArgentinaPhone } from '@/react-app/utils/storage';
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
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [viewingList, setViewingList] = useState<ContactList | null>(null);
  const [editingContact, setEditingContact] = useState<Contact & { index: number } | null>(null);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [contactForm, setContactForm] = useState<Contact>({
    phone_number: '',
    first_name: '',
    last_name: '',
    email: ''
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

  const handleViewContacts = (list: ContactList) => {
    setViewingList(list);
    setShowContactsModal(true);
  };

  const handleEditContact = (contact: Contact, index: number, listId: string) => {
    setEditingContact({ ...contact, index });
    setContactForm(contact);
    setShowEditContactModal(true);
  };

  const handleSaveContact = () => {
    if (!contactForm.phone_number.trim()) {
      showError('El número de teléfono es requerido');
      return;
    }

    if (!viewingList || !editingContact) return;

    // Auto-format phone number
    const formattedPhone = formatArgentinaPhone(contactForm.phone_number);
    const updatedContact = {
      ...contactForm,
      phone_number: formattedPhone
    };

    // Update contact in the list
    const updatedContacts = [...viewingList.contacts];
    updatedContacts[editingContact.index] = updatedContact;

    const updatedList = {
      ...viewingList,
      contacts: updatedContacts
    };

    // Update in storage
    const updatedLists = contactLists.map(l =>
      l.id === viewingList.id ? updatedList : l
    );
    saveToStorage(updatedLists);
    setViewingList(updatedList);

    if (formattedPhone !== contactForm.phone_number) {
      showSuccess(`Contacto actualizado y teléfono formateado: ${formattedPhone}`);
    } else {
      showSuccess('Contacto actualizado exitosamente');
    }

    setShowEditContactModal(false);
    setEditingContact(null);
    setContactForm({ phone_number: '', first_name: '', last_name: '', email: '' });
  };

  const handleDeleteContact = (index: number) => {
    if (!viewingList) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este contacto?')) return;

    const updatedContacts = viewingList.contacts.filter((_, i) => i !== index);
    const updatedList = {
      ...viewingList,
      contacts: updatedContacts
    };

    const updatedLists = contactLists.map(l =>
      l.id === viewingList.id ? updatedList : l
    );
    saveToStorage(updatedLists);
    setViewingList(updatedList);
    showSuccess('Contacto eliminado exitosamente');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Listas de Contactos</h1>
          <p className="text-gray-600 dark:text-gray-300">Organiza tus contactos en listas para campañas dirigidas</p>
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{list.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{list.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUseList(list)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Usar
                  </button>
                  <button
                    onClick={() => handleViewContacts(list)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 transition-all"
                  >
                    <i className="fas fa-eye mr-2"></i>
                    Ver
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditList(list)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 transition-all"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600">
            <i className="fas fa-address-book text-8xl"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No hay listas de contactos</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Crea tu primera lista para organizar tus contactos</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingList ? 'Editar Lista' : 'Nueva Lista de Contactos'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la lista <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="Ejemplo: Clientes Premium"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="Breve descripción de la lista"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contactos (uno por línea)
                </label>
                <textarea
                  value={newList.contactsText}
                  onChange={(e) => setNewList({ ...newList, contactsText: e.target.value })}
                  placeholder="Formato: teléfono, nombre, apellido, email (separados por comas)&#10;Ejemplo:&#10;+5491234567890, Juan, Pérez, juan@email.com&#10;+5491234567891, María, García&#10;+5491234567892"
                  rows={8}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Puedes usar solo el número de teléfono o agregar más datos separados por comas.
                  Solo el teléfono es obligatorio.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
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

      {/* View Contacts Modal */}
      {showContactsModal && viewingList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{viewingList.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {viewingList.contacts.length} contacto(s)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowContactsModal(false);
                  setViewingList(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              {viewingList.contacts.length > 0 ? (
                <div className="space-y-3">
                  {viewingList.contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <i className="fas fa-phone text-blue-600 dark:text-blue-400"></i>
                          <span className="font-mono text-gray-900 dark:text-gray-100 font-medium">
                            {contact.phone_number}
                          </span>
                        </div>
                        {(contact.first_name || contact.last_name) && (
                          <div className="flex items-center space-x-3 mb-1">
                            <i className="fas fa-user text-gray-400 text-sm"></i>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">
                              {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center space-x-3">
                            <i className="fas fa-envelope text-gray-400 text-sm"></i>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{contact.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditContact(contact, index, viewingList.id)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar contacto"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteContact(index)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar contacto"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-gray-300 dark:text-gray-600 text-6xl mb-4"></i>
                  <p className="text-gray-600 dark:text-gray-400">No hay contactos en esta lista</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditContactModal && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar Contacto</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactForm.phone_number}
                  onChange={(e) => setContactForm({ ...contactForm, phone_number: e.target.value })}
                  placeholder="11xxxxxxxx o 5491xxxxxxxx"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300 font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Se formateará automáticamente al formato argentino (549...)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={contactForm.first_name || ''}
                  onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                  placeholder="Juan"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  value={contactForm.last_name || ''}
                  onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                  placeholder="Pérez"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={contactForm.email || ''}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="juan@example.com"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-4">
              <button
                onClick={() => {
                  setShowEditContactModal(false);
                  setEditingContact(null);
                  setContactForm({ phone_number: '', first_name: '', last_name: '', email: '' });
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveContact}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
