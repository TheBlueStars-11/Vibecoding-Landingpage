import { useState, useEffect } from 'react';
import { TicketIcon } from '../ui/Icons.jsx';
import styles from './StickyCta.module.css';

export default function StickyCta({ eventName }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById('register-section');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Ẩn thanh dính đáy khi form đăng ký đã lọt vào tầm mắt
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleScrollToRegister = () => {
    const target = document.getElementById('register-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.stickyBar}>
      <span className={styles.title}>{eventName || 'Sự kiện'}</span>
      <button
        type="button"
        className={styles.ctaBtn}
        onClick={handleScrollToRegister}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <TicketIcon size={14} />
        <span>Đăng ký ngay</span>
      </button>
    </div>
  );
}

