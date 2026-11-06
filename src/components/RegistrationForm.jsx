import { useState, useEffect } from 'react';
import { addRegistration, countRegistrations } from '../lib/storage.js';
import { downloadIcsFile } from '../domain/calendar.js';
import { FlameIcon, CheckIcon, CalendarIcon, AlertCircleIcon, TicketIcon, LockIcon } from './ui/Icons.jsx';
import styles from './RegistrationForm.module.css';

export default function RegistrationForm({ eventId, eventData, onCountChange }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [message, setMessage] = useState(null);
  const [count, setCount] = useState(() => countRegistrations(eventId));
  const [submitting, setSubmitting] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);

  // Lắng nghe sự kiện storage để đồng bộ số lượng realtime đa tab (Mục 8.1 - TC-08)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.includes(eventId)) {
        const updatedCount = countRegistrations(eventId);
        setCount(updatedCount);
        onCountChange?.(updatedCount);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [eventId, onCountChange]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = addRegistration(eventId, form);
    if (result.success) {
      const newCount = countRegistrations(eventId);
      setCount(newCount);
      onCountChange?.(newCount);
      setConfirmedData({
        ...form,
        registeredAt: new Date().toISOString(),
      });
      setForm({ name: '', email: '', phone: '' });
    } else {
      setMessage(result);
    }
    setSubmitting(false);
  };

  const handleDownloadCalendar = () => {
    if (eventData) {
      downloadIcsFile(eventData);
    }
  };

  return (
    <div className={styles.wrapper} id="register-section">
      <div className={styles.counter} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <FlameIcon size={16} />
        <span><strong>{count}</strong> người đã đăng ký tham dự</span>
      </div>

      {confirmedData ? (
        <div className={styles.confirmedCard}>
          <div className={styles.successIcon}><CheckIcon size={32} /></div>
          <h3 className={styles.confirmedTitle}>Đăng Ký Thành Công!</h3>
          <p className={styles.confirmedDesc}>
            Cảm ơn <strong>{confirmedData.name}</strong>, chúng tôi đã ghi nhận thông tin đăng ký của bạn.
          </p>

          <div className={styles.confirmedDetails}>
            <p><strong>Email:</strong> {confirmedData.email}</p>
            {confirmedData.phone && <p><strong>SĐT:</strong> {confirmedData.phone}</p>}
          </div>

          {eventData && (
            <button
              type="button"
              className={styles.calendarBtn}
              onClick={handleDownloadCalendar}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <CalendarIcon size={16} />
              <span>Thêm vào lịch (.ics)</span>
            </button>
          )}

          <button
            type="button"
            className={styles.registerMoreBtn}
            onClick={() => setConfirmedData(null)}
          >
            Đăng ký thêm người khác
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h3 className={styles.title}>Đăng Ký Tham Dự</h3>

          <div className={styles.fieldGroup}>
            <label htmlFor="reg-name" className={styles.label}>Họ và tên *</label>
            <input
              id="reg-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="reg-email" className={styles.label}>Email *</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="reg-phone" className={styles.label}>Số điện thoại</label>
            <input
              id="reg-phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="0912345678"
              className={styles.input}
            />
          </div>

          {message && !message.success && (
            <div className={styles.error} role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircleIcon size={16} />
              <span>{message.message}</span>
            </div>
          )}

          <button
            type="submit"
            className={styles.btn}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              'Đang xử lý...'
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <TicketIcon size={16} />
                <span>Đăng Ký Ngay</span>
              </span>
            )}
          </button>

          <p className={styles.privacyNote} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <LockIcon size={14} />
            <span>Chúng tôi cam kết bảo mật thông tin. Dữ liệu chỉ dùng để xác nhận tham dự sự kiện.</span>
          </p>
        </form>
      )}
    </div>
  );
}
