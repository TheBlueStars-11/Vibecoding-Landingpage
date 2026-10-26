import { useState, useEffect } from 'react';
import { addRegistration, countRegistrations } from '../lib/storage';
import styles from './RegistrationForm.module.css';

export default function RegistrationForm({ eventId, onCountChange }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [message, setMessage] = useState(null);
  const [count, setCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCount(countRegistrations(eventId));
  }, [eventId]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = addRegistration(eventId, form);
    setMessage(result);
    if (result.success) {
      const newCount = countRegistrations(eventId);
      setCount(newCount);
      onCountChange?.(newCount);
      setForm({ name: '', email: '', phone: '' });
    }
    setSubmitting(false);
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.counter}>
        🔥 <strong>{count}</strong> người đã đăng ký
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={styles.title}>Đăng Ký Tham Dự</h3>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Họ và tên *"
          required
          className={styles.input}
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email *"
          required
          className={styles.input}
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Số điện thoại"
          className={styles.input}
        />

        {message && (
          <div className={`${styles.message} ${message.success ? styles.success : styles.error}`}>
            {message.message}
          </div>
        )}

        <button type="submit" className={styles.btn} disabled={submitting}>
          {submitting ? 'Đang xử lý...' : '🎟️ Đăng Ký Ngay'}
        </button>
      </form>
    </div>
  );
}

