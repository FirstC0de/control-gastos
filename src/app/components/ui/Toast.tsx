'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const styles: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-800 ring-green-200',
  error:   'bg-red-50 text-red-800 ring-red-200',
  warning: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
};

const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ring-1 shadow-lg text-sm font-medium ${styles[type]}`}>
      <span className="text-base">{icons[type]}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// Hook para usar toasts fácilmente
export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return { toasts, show, remove };
}

// Contenedor posicionado en pantalla
export function ToastContainer({ toasts, onRemove }: {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}