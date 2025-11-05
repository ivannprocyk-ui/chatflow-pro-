# 📋 GUÍA DE IMPLEMENTACIÓN PASO A PASO

## 🎯 Objetivo
Implementar todas las mejoras en tu proyecto ChatFlow Pro de Mocha

---

## ⚡ OPCIÓN 1: IMPLEMENTACIÓN RÁPIDA (Recomendada)

### Paso 1: Descargar Archivos Mejorados
Los archivos mejorados están en `/mnt/user-data/outputs/src/`

### Paso 2: Reemplazar en Mocha
1. Abre tu proyecto en Mocha (getmocha.com)
2. Reemplaza estos archivos:
   - `src/react-app/utils/storage.ts`
   - `src/react-app/pages/BulkMessaging.tsx`
3. Agrega este archivo nuevo:
   - `src/react-app/components/Toast.tsx`

### Paso 3: Actualizar App.tsx
Agrega el import y el componente de Toast:

```typescript
// Al inicio del archivo
import { useState } from 'react';
import { useToast, ToastContainer } from '@/react-app/components/Toast';

// Dentro del componente App
export default function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState(loadConfig());
  const toast = useToast(); // ⭐ AGREGAR ESTA LÍNEA

  // ... resto del código ...

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ⭐ AGREGAR ESTE COMPONENTE */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      <Sidebar 
        isOpen={sidebarOpen}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        config={config}
      />
      
      {/* ... resto del código ... */}
    </div>
  );
}
```

### Paso 4: Actualizar BulkMessaging
En el archivo `src/react-app/pages/BulkMessaging.tsx`, asegúrate de importar useToast:

```typescript
import { useToast } from '@/react-app/components/Toast';

export default function BulkMessaging() {
  const toast = useToast(); // ⭐ AGREGAR
  
  // Reemplazar todos los alert() con:
  // toast.showSuccess('mensaje')
  // toast.showError('mensaje')
  // toast.showWarning('mensaje')
  // toast.showInfo('mensaje')
}
```

### Paso 5: Deploy
1. Guarda todos los cambios
2. Haz click en "Deploy" en Mocha
3. Espera a que compile
4. ¡Listo! 🎉

---

## 🔧 OPCIÓN 2: IMPLEMENTACIÓN MANUAL (Más Control)

### 1. Crear el Componente Toast

Crea el archivo `src/react-app/components/Toast.tsx` con el siguiente contenido:

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

### 2. Actualizar storage.ts

Agrega estas funciones al final de `src/react-app/utils/storage.ts`:

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

### 3. Mejorar BulkMessaging.tsx

Agrega la función de sincronización de plantillas:

```typescript
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
  }
};
```

Agrega la función de envío de mensajes:

```typescript
const sendMessage = async (phone: string, templateName: string, config: any) => {
  const template = templates.find(t => t.name === templateName);
  if (!template) {
    return {
      phone,
      status: 'error',
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

  // Add image if required
  if (templateRequiresImage() && imageUrl) {
    payload.template.components = [
      {
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: { link: imageUrl }
          }
        ]
      }
    ];
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
        status: 'success',
        details: `ID: ${data.messages[0].id}`,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        phone,
        status: 'error',
        details: data.error?.message || 'Error desconocido',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error: any) {
    return {
      phone,
      status: 'error',
      details: error.message || 'Error de conexión',
      timestamp: new Date().toISOString()
    };
  }
};
```

---

## 🧪 TESTING

### 1. Probar Sincronización de Plantillas
1. Ve a Configuración
2. Ingresa credenciales de Meta API
3. Ve a Envío Masivo
4. Haz clic en "Sincronizar Plantillas"
5. Deberías ver notificación de éxito

### 2. Probar Envío de Prueba
1. Usa el tab "Manual"
2. Ingresa tu propio número
3. Selecciona una plantilla
4. Envía
5. Verifica que llegue el mensaje

### 3. Probar Validaciones
1. Intenta enviar sin configurar API → Error
2. Intenta enviar sin plantilla → Warning
3. Intenta enviar número inválido → Detectado y filtrado

---

## ❓ TROUBLESHOOTING

### Problema: "Cannot find module '@/react-app/components/Toast'"
**Solución:** Verifica que el archivo Toast.tsx esté en la ruta correcta

### Problema: Plantillas no se sincronizan
**Soluciones:**
- Verifica Access Token en Meta
- Verifica WABA ID
- Revisa permisos del token
- Verifica que haya plantillas aprobadas

### Problema: Mensajes no se envían
**Soluciones:**
- Verifica Phone Number ID
- Verifica formato de número (código país obligatorio)
- Revisa límites de Meta API
- Verifica que plantilla esté aprobada

### Problema: Toast no aparece
**Soluciones:**
- Verifica que ToastContainer esté en App.tsx
- Verifica z-index (debe ser 50 o mayor)
- Revisa consola por errores de TypeScript

---

## 📚 RECURSOS ADICIONALES

- **Meta WhatsApp API Docs:** https://developers.facebook.com/docs/whatsapp
- **Obtener Access Token:** https://developers.facebook.com/apps
- **Crear Plantillas:** https://business.facebook.com/wa/manage/message-templates/
- **Límites de API:** https://developers.facebook.com/docs/whatsapp/overview/rate-limits

---

## ✅ CHECKLIST FINAL

Antes de considerarlo completo, verifica:

- [ ] Toast.tsx creado y funcionando
- [ ] storage.ts actualizado con nuevas funciones
- [ ] BulkMessaging.tsx con sincronización de plantillas
- [ ] BulkMessaging.tsx con función de envío
- [ ] BulkMessaging.tsx con validaciones
- [ ] BulkMessaging.tsx con progreso en tiempo real
- [ ] BulkMessaging.tsx con exportación CSV
- [ ] App.tsx con ToastContainer
- [ ] Configuración de API guardándose
- [ ] Plantillas sincronizándose
- [ ] Mensajes enviándose correctamente
- [ ] Notificaciones Toast apareciendo
- [ ] Sin errores en consola

---

## 🎉 ¡ÉXITO!

Si completaste todos los pasos, tu ChatFlow Pro ahora es una aplicación **completamente funcional** para envío masivo de mensajes de WhatsApp.

**¿Necesitas ayuda?** Revisa el README-MEJORAS.md para más detalles técnicos.
