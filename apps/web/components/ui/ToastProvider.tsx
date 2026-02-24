'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

type ToastTone = 'info' | 'success' | 'warning' | 'danger';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((item) => (
          <div key={item.id} className={cn('ui-toast', `ui-toast-${item.tone}`)}>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return value;
}
