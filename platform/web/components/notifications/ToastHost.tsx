'use client';

import { useNotificationStore } from '@/lib/notifications';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_STYLES = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  error: 'bg-red-50 border-red-200 text-red-900'
};

const SEVERITY_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

export function ToastHost() {
  const { toasts, removeToast } = useNotificationStore();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      {toasts.map((toast) => {
        const Icon = SEVERITY_ICONS[toast.severity];
        
        return (
          <div
            key={toast.id}
            className={cn(
              'rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
              'animate-in slide-in-from-right-full',
              SEVERITY_STYLES[toast.severity]
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 rounded-md p-1.5 hover:bg-black/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}