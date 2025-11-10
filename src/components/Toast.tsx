import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
  bottomOffset?: number; // Offset from bottom (e.g., for story banner)
}

/**
 * Toast notification component with auto-dismiss
 * Displays a temporary message with configurable type and duration
 */
export function Toast({ message, type = 'success', onClose, duration = 3000, bottomOffset = 0 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const bottomPosition = bottomOffset > 0 ? `${bottomOffset + 16}px` : '1rem';

  return (
    <div
      className={`fixed right-4 px-4 py-3 rounded-lg border shadow-lg ${colors[type]} animate-slide-up z-50 max-w-md`}
      style={{ bottom: bottomPosition }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium whitespace-pre-line flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
