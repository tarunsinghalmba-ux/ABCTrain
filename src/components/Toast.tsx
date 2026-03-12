import React, { useEffect } from 'react';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const toastConfig: Record<ToastType, { icon: React.ReactNode; color: string }> = {
  success: {
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'bg-red-50 border-red-200 text-red-800'
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  }
};

export function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  const config = toastConfig[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${config.color}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
