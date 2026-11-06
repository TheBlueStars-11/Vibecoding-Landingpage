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
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className={styles.dialog}>
        <h3 id="confirm-dialog-title" className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            autoFocus
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
