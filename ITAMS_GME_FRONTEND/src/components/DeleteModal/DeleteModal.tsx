import { useState } from 'react';
import './DeleteModal.css';

interface Props {
  userName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteModal({ userName, onConfirm, onCancel }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="del-overlay" onClick={onCancel}>
      <div className="del-box" onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div className="del-icon-wrap">
          🗑️
          <div className="del-spark del-spark-1" />
          <div className="del-spark del-spark-2" />
          <div className="del-spark del-spark-3" />
        </div>

        {/* Text */}
        <div className="del-title">Delete User?</div>
        <div className="del-sub">
          <strong>{userName}</strong> will be permanently deleted
          and cannot be recovered.
        </div>

        {/* Buttons */}
        <div className="del-btns">
          <button className="del-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="del-btn-delete"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>

      </div>
    </div>
  );
}