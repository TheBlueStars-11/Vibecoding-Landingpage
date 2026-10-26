import { useState, useEffect, useRef } from 'react';
import styles from './Countdown.module.css';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Countdown({ targetDatetime }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDatetime) - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(intervalRef.current);
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft({ d, h, m, s });
      }
    };

    calc();
    intervalRef.current = setInterval(calc, 1000);
    return () => clearInterval(intervalRef.current);
  }, [targetDatetime]);

  if (!timeLeft) {
    return (
      <div className={styles.past}>
        <span>📅 Sự kiện đã diễn ra</span>
      </div>
    );
  }

  return (
    <div className={styles.countdown}>
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

