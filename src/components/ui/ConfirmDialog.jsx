import React from 'react';
import styles from './ConfirmDialog.module.css';

export function ConfirmDialog({
  isOpen,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Tiếp tục',
  cancelLabel = 'Hủy',
  isDanger = false,
  onConfirm,
  onCancel,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className={styles.dialog}>
        <h3 id="confirm-dialog-title" className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}
        {children}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            autoFocus={!children}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${isDanger ? styles.dangerBtn : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
