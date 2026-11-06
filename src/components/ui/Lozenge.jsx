import React from 'react';
import styles from './Lozenge.module.css';
import { DraftIcon, PublishedIcon } from './Icons.jsx';
import { PROJECT_STATUS } from '../../domain/elsSchema.js';

export function Lozenge({ status = PROJECT_STATUS.DRAFT, className = '' }) {
  const isPublished = status === PROJECT_STATUS.PUBLISHED;

  return (
    <span
      className={`${styles.lozenge} ${isPublished ? styles.published : styles.draft} ${className}`}
      role="status"
      aria-label={`Trạng thái: ${isPublished ? 'Đã xuất bản' : 'Bản nháp'}`}
    >
      {isPublished ? (
        <>
          <PublishedIcon size={14} className={styles.icon} />
          <span>Đã xuất bản</span>
        </>
      ) : (
        <>
          <DraftIcon size={14} className={styles.icon} />
          <span>Bản nháp</span>
        </>
      )}
    </span>
  );
}

