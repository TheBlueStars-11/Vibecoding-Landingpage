import { useState, useEffect, useRef } from 'react';
import { calculateCountdown } from '../domain/time.js';
import { CalendarIcon, FlameIcon } from './ui/Icons.jsx';
import styles from './Countdown.module.css';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Countdown({ targetDatetime, regCount = null }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateCountdown(targetDatetime));
  const intervalRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const res = calculateCountdown(targetDatetime);
      setTimeLeft(res);
      if (res.isPast && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [targetDatetime]);

  if (timeLeft.isPast) {
    return (
      <div className={styles.past}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CalendarIcon size={16} />
          <span>Sự kiện đã diễn ra</span>
        </span>
      </div>
    );
  }

  return (
    <div className={styles.countdown}>
      {regCount != null && regCount > 0 && (
        <div className={styles.cinematicRegBanner}>
          <span className={styles.pulseDot} />
          <span className={styles.regBannerText} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <FlameIcon size={14} />
            <span><strong>{regCount.toLocaleString('vi-VN')}</strong> người đã đăng ký giữ chỗ</span>
          </span>
        </div>
      )}
      <p className={styles.label}>Sự kiện bắt đầu sau</p>
      <div className={styles.boxes}>
        {[
          { value: timeLeft.d, unit: 'Ngày' },
          { value: timeLeft.h, unit: 'Giờ' },
          { value: timeLeft.m, unit: 'Phút' },
          { value: timeLeft.s, unit: 'Giây' },
        ].map(({ value, unit }) => (
          <div key={unit} className={styles.box}>
            <span className={styles.number}>{pad(value)}</span>
            <span className={styles.unit}>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
