import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3
      px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 duration-300
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      <CheckCircle size={16} className="shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors">
        <X size={13} />
      </button>
    </div>
  );
}