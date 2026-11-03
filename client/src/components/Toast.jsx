import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

export default function Toast({ id, message, type = 'info', onClose }) {
  const Icon = icons[type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => onClose?.(id), 3500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => onClose?.(id)} aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}
