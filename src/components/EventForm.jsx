import { useState, useEffect } from 'react';
import styles from './EventForm.module.css';

const DEFAULT_FORM = {
  name: '',
  date: '',
  time: '08:00',
  location: '',
  speakers: '',
  earlyBird: '',
  agenda: '',
};

export default function EventForm({ onGenerate, isLoading }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ghép date + time thành định dạng datetime-local chuẩn
    const datetime = form.date && form.time ? `${form.date}T${form.time}` : '';
    onGenerate({ ...form, datetime });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.formTitle}>✨ Tạo Landing Page Sự Kiện</h2>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label>Tên sự kiện *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="VD: Workshop AI cho Marketer 2024"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Ngày *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.field}>
          <label>Giờ *</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.field}>
          <label>Địa điểm *</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="VD: Tòa nhà Landmark 81, TP.HCM"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Diễn giả *</label>
          <input
            name="speakers"
            value={form.speakers}
            onChange={handleChange}
            placeholder="VD: Nguyễn Văn A (CEO TechVN), Trần Thị B (AI Lead)"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Ưu đãi đăng ký sớm</label>
          <input
            name="earlyBird"
            value={form.earlyBird}
            onChange={handleChange}
            placeholder="VD: Giảm 30% học phí, tặng tài liệu trị giá 500k"
          />
        </div>

        <div className={styles.field}>
          <label>Chương trình (Agenda)</label>
          <textarea
            name="agenda"
            value={form.agenda}
            onChange={handleChange}
            rows={4}
            placeholder={`VD:\n09:00 - Khai mạc & Networking\n09:30 - Workshop: AI trong Marketing\n11:00 - Q&A với diễn giả`}
          />
        </div>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={isLoading}>
        {isLoading ? (
          <>
            <span className={styles.spinner} /> Đang tạo với AI...
          </>
        ) : (
          '🚀 Tạo Landing Page'
        )}
      </button>
    </form>
  );
}

