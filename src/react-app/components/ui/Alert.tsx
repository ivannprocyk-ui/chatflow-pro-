import React from 'react';

interface AlertProps {
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info';
  title?: string;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const alertVariants = {
  default: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
  destructive: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
};

const iconColors = {
  default: 'text-gray-600 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-400',
  destructive: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export function Alert({
  variant = 'default',
  title,
  description,
  icon,
  className = '',
  onClose
}: AlertProps) {
  const defaultIcons = {
    default: <i className="fas fa-info-circle" />,
    success: <i className="fas fa-check-circle" />,
    destructive: <i className="fas fa-exclamation-circle" />,
    warning: <i className="fas fa-exclamation-triangle" />,
    info: <i className="fas fa-info-circle" />,
  };

  return (
    <div
      className={`
        relative border rounded-lg p-4
        ${alertVariants[variant]}
        ${className}
        animate-fadeIn
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconColors[variant]}`}>
          {icon || defaultIcons[variant]}
        </div>

        {/* Content */}
        <div className="flex-1">
          {title && (
            <h5 className="font-semibold mb-1">
              {title}
            </h5>
          )}
          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <i className="fas fa-times" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AlertTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h5 className={`font-semibold mb-1 ${className}`}>{children}</h5>;
}

export function AlertDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm opacity-90 ${className}`}>{children}</div>;
}
