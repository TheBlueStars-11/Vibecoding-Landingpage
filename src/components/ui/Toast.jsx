import React, { useEffect } from 'react';
import styles from './Toast.module.css';
import { CheckIcon, AlertCircleIcon, CloseIcon } from './Icons.jsx';

export function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className={`${styles.toast} ${styles[type] || styles.success}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.iconWrapper}>
        {type === 'error' ? (
          <AlertCircleIcon size={18} />
        ) : (
          <CheckIcon size={18} />
        )}
      </div>
      <p className={styles.message}>{message}</p>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}

