# 💻 CÓDIGO COMPLETO - COPIAR Y PEGAR

## 📁 Estructura de Archivos a Modificar

```
src/react-app/
├── App.tsx (MODIFICAR)
├── components/
│   └── Toast.tsx (CREAR NUEVO)
├── pages/
│   └── BulkMessaging.tsx (MODIFICAR)
└── utils/
    └── storage.ts (MODIFICAR)
```

---

## 1️⃣ App.tsx - CÓDIGO COMPLETO

Reemplaza el contenido actual con:

```typescript
import { useState, useEffect } from "react";
import Sidebar from "@/react-app/components/Sidebar";
import Dashboard from "@/react-app/pages/Dashboard";
import Chat from "@/react-app/pages/Chat";
import BulkMessaging from "@/react-app/pages/BulkMessaging";
import ContactLists from "@/react-app/pages/ContactLists";
import CRMPanel from "@/react-app/pages/CRMPanel";
import CampaignHistory from "@/react-app/pages/CampaignHistory";
import MessageScheduler from "@/react-app/pages/MessageScheduler";
import Templates from "@/react-app/pages/Templates";
import Configuration from "@/react-app/pages/Configuration";
import { loadConfig } from "@/react-app/utils/storage";
import { useToast, ToastContainer } from "@/react-app/components/Toast";

export type AppSection = 
  | 'dashboard' 
  | 'chat' 
  | 'bulk-messaging' 
  | 'contact-lists' 
  | 'crm-panel' 
  | 'campaign-history' 
  | 'message-scheduler' 
  | 'templates' 
  | 'configuration';

export default function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState(loadConfig());
  const toast = useToast();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.branding.primaryColor);
    root.style.setProperty('--secondary-color', config.branding.secondaryColor);
    root.style.setProperty('--accent-color', config.branding.accentColor);
  }, [config]);

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <Chat />;
      case 'bulk-messaging':
        return <BulkMessaging />;
      case 'contact-lists':
        return <ContactLists />;
      case 'crm-panel':
        return <CRMPanel />;
      case 'campaign-history':
        return <CampaignHistory />;
      case 'message-scheduler':
        return <MessageScheduler />;
      case 'templates':
        return <Templates />;
      case 'configuration':
        return <Configuration onConfigUpdate={setConfig} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      <Sidebar 
        isOpen={sidebarOpen}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        config={config}
      />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-bars text-gray-600"></i>
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">
            {config.branding.appName}
          </h1>
        </div>
        
        <main className="flex-1 overflow-auto">
          {renderCurrentSection()}
        </main>
      </div>
    </div>
  );
}
```

---

## 2️⃣ Toast.tsx - ARCHIVO COMPLETO (NUEVO)

Crea el archivo `src/react-app/components/Toast.tsx`:

```typescript
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-2xl text-white transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      } ${colors[type]}`}
      style={{ minWidth: '320px' }}
    >
      <i className={`${icons[type]} text-xl`}></i>
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess: (message: string) => addToast(message, 'success'),
    showError: (message: string) => addToast(message, 'error'),
    showWarning: (message: string) => addToast(message, 'warning'),
    showInfo: (message: string) => addToast(message, 'info')
  };
}
```

---

## 3️⃣ storage.ts - AGREGAR AL FINAL

Agrega estas funciones al final del archivo `src/react-app/utils/storage.ts`:

```typescript
// Templates
export function loadTemplates(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_templates');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

export function saveTemplates(templates: any[]): void {
  try {
    localStorage.setItem('chatflow_templates', JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
}

// Send Log
export function loadSendLog(): any[] {
  try {
    const stored = localStorage.getItem('chatflow_send_log');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading send log:', error);
    return [];
  }
}

export function saveSendLog(log: any[]): void {
  try {
    localStorage.setItem('chatflow_send_log', JSON.stringify(log));
  } catch (error) {
    console.error('Error saving send log:', error);
  }
}

export function appendToSendLog(entry: any): void {
  try {
    const log = loadSendLog();
    log.push(entry);
    saveSendLog(log);
  } catch (error) {
    console.error('Error appending to send log:', error);
  }
}

// Utilities
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
```

---

## 4️⃣ BulkMessaging.tsx - IMPORTS NECESARIOS

Agrega estos imports al inicio del archivo:

```typescript
import { loadTemplates, saveTemplates, loadConfig, saveCampaigns, loadCampaigns, validatePhone, cleanPhone, appendToSendLog } from '@/react-app/utils/storage';
import { useToast } from '@/react-app/components/Toast';
```

---

## 5️⃣ BulkMessaging.tsx - FUNCIÓN SYNC TEMPLATES

Agrega esta función dentro del componente:

```typescript
const { showSuccess, showError, showWarning, showInfo } = useToast();

const syncTemplates = async () => {
  const config = loadConfig();
  
  if (!config.api.accessToken || !config.api.wabaId) {
    showError('Configura primero tu API de Meta en Configuración');
    return;
  }

  showInfo('Sincronizando plantillas con Meta...');

  try {
    const url = `https://graph.facebook.com/${config.api.apiVersion}/${config.api.wabaId}/message_templates`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.api.accessToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const approvedTemplates = data.data.filter((t: any) => t.status === 'APPROVED');
      setTemplates(approvedTemplates);
      saveTemplates(approvedTemplates);
      showSuccess(`${approvedTemplates.length} plantillas sincronizadas correctamente`);
    } else {
      const error = await response.json();
      showError(`Error al sincronizar: ${error.error?.message || 'Error desconocido'}`);
    }
  } catch (error) {
    showError('Error de conexión al sincronizar plantillas');
    console.error(error);
  }
};
```

---

## 6️⃣ BulkMessaging.tsx - FUNCIÓN SEND MESSAGE

Agrega esta función:

```typescript
const sendMessage = async (phone: string, templateName: string, config: any) => {
  const template = templates.find(t => t.name === templateName);
  if (!template) {
    return {
      phone,
      status: 'error' as const,
      details: 'Plantilla no encontrada',
      timestamp: new Date().toISOString()
    };
  }

  const url = `https://graph.facebook.com/${config.api.apiVersion}/${config.api.phoneNumberId}/messages`;
  
  const payload: any = {
    messaging_product: 'whatsapp',
    to: cleanPhone(phone),
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: template.language || 'es'
      }
    }
  };

  if (templateRequiresImage() && imageUrl) {
    payload.template.components = [{
      type: 'header',
      parameters: [{
        type: 'image',
        image: { link: imageUrl }
      }]
    }];
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      return {
        phone,
        status: 'success' as const,
        details: `ID: ${data.messages[0].id}`,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        phone,
        status: 'error' as const,
        details: data.error?.message || 'Error desconocido',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error: any) {
    return {
      phone,
      status: 'error' as const,
      details: error.message || 'Error de conexión',
      timestamp: new Date().toISOString()
    };
  }
};
```

---

## 7️⃣ BulkMessaging.tsx - BOTÓN SYNC EN UI

Agrega este botón en el header de la card:

```typescript
<div className="flex items-center justify-between mb-6">
  <h3 className="text-xl font-semibold text-gray-900">Configurar Campaña</h3>
  <button
    onClick={syncTemplates}
    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
  >
    <i className="fas fa-sync-alt"></i>
    <span>Sincronizar Plantillas</span>
  </button>
</div>
```

---

## 8️⃣ BulkMessaging.tsx - VALIDACIONES EN START SEND

Mejora la función startBulkSend con validaciones:

```typescript
const startBulkSend = async () => {
  const config = loadConfig();

  // Validaciones
  if (!config.api.phoneNumberId || !config.api.accessToken) {
    showError('Configura primero tu API de Meta en Configuración');
    return;
  }

  if (!selectedTemplate) {
    showWarning('Por favor selecciona una plantilla');
    return;
  }

  if (templateRequiresImage() && !imageUrl) {
    showWarning('Esta plantilla requiere una URL de imagen');
    return;
  }

  if (templateRequiresImage() && imageUrl && !imageUrl.startsWith('https://')) {
    showError('La URL de la imagen debe usar HTTPS');
    return;
  }

  const phoneNumbers = await getPhoneNumbers();

  if (phoneNumbers.length === 0) {
    showWarning('No hay números de teléfono para enviar');
    return;
  }

  // Validar números
  const validPhones = phoneNumbers.filter(p => validatePhone(p));
  const invalidPhones = phoneNumbers.filter(p => !validatePhone(p));

  if (invalidPhones.length > 0) {
    const confirm = window.confirm(
      `Se encontraron ${invalidPhones.length} números inválidos. ¿Continuar con ${validPhones.length} válidos?`
    );
    if (!confirm) return;
  }

  if (validPhones.length === 0) {
    showError('No hay números válidos');
    return;
  }

  const confirmSend = window.confirm(
    `¿Enviar "${selectedTemplate}" a ${validPhones.length} contactos?`
  );
  if (!confirmSend) return;

  // AQUÍ VA EL CÓDIGO DE ENVÍO...
  // (usa la lógica que ya tienes en startBulkSend)
};
```

---

## ✅ VERIFICACIÓN RÁPIDA

Después de copiar todo el código:

1. **Verifica imports** - No deben haber errores rojos
2. **Compila** - npm run build o Deploy en Mocha
3. **Prueba Toast** - Debería aparecer notificación al sincronizar
4. **Prueba Sync** - Debería cargar plantillas de Meta
5. **Prueba Envío** - Debería enviar mensaje real

---

## 🆘 SI ALGO NO FUNCIONA

### Error de TypeScript
- Verifica que todos los imports estén correctos
- Verifica tipos: `as const` en status
- Verifica que Toast.tsx esté en la carpeta correcta

### Toast no aparece
- Verifica que ToastContainer esté en App.tsx
- Verifica z-index en clases de Tailwind
- Abre DevTools y busca errores

### API no responde
- Verifica credenciales en Configuración
- Verifica CORS (Meta API permite requests desde el frontend)
- Revisa Network tab en DevTools

---

## 📚 NEXT STEPS

Una vez que todo funcione:

1. Crea listas de contactos de prueba
2. Crea plantillas en Meta Business Manager
3. Sincroniza y prueba envíos pequeños
4. Escala a envíos masivos

**¡Listo para producción! 🚀**
