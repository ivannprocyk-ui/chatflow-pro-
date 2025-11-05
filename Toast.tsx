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

// Toast Container Component
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

// Hook for using toasts
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
