import { useEffect } from 'react';
import './Toast.css';

interface Props {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number; // auto close duration in ms, default 3000
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: Props) {
  // Auto close after duration
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast toast--${type}`}>
      <span className="toast-icon">
        {type === 'success' ? '✅' : '❌'}
      </span>
      <span className="toast-msg">{message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}