import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore, type Toast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<Toast['variant'], string> = {
  success: 'bg-green-600 text-white border-green-700',
  error: 'bg-destructive text-white border-red-700',
  info: 'bg-card text-foreground border-border',
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm shadow-lg',
        'min-w-[260px] max-w-sm',
        VARIANT_STYLES[toast.variant]
      )}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
