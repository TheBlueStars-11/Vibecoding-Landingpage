import { useState, useEffect, useRef } from 'react';
import styles from './EventForm.module.css';
import { validateEventInput } from '../domain/validators.js';
import { formatToISOWithOffset } from '../domain/time.js';
import { DEFAULT_FORM_DATA } from '../domain/schema.js';
import { eventRepo } from '../services/repository.js';
import { SparklesIcon, RocketIcon } from './ui/Icons.jsx';

export default function EventForm({ onGenerate, isLoading, initialData = null }) {
  const [form, setForm] = useState(() => {
    if (initialData) return { ...DEFAULT_FORM_DATA, ...initialData };
    const savedDraft = eventRepo.getDraft();
    return savedDraft ? { ...DEFAULT_FORM_DATA, ...savedDraft } : DEFAULT_FORM_DATA;
  });

  const [errors, setErrors] = useState({});

  // Khóa chống gửi lặp bằng Ref (Mục 7.3 - TC-06A)
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      inFlightRef.current = false;
    }
  }, [isLoading]);

  const nameInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const speakersInputRef = useRef(null);
  const earlyBirdInputRef = useRef(null);
  const agendaInputRef = useRef(null);

  // Tự động lưu bản nháp form mỗi khi có thay đổi
  useEffect(() => {
    eventRepo.saveDraft(form);
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFillSample = () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const sample = {
      name: 'Workshop "AI cho Marketer" — Làm landing page trong 5 phút',
      date: dateStr,
      time: '14:00',
      location: 'Tầng 5, Tòa nhà Sáng Tạo, Cầu Giấy, Hà Nội (Dữ liệu mẫu)',
      speakers: 'Nguyễn Minh Anh (Marketing Director), Trần Quốc Bảo (AI Lead)',
      earlyBird: 'Giảm 30% vé tham dự cho 50 người đăng ký đầu tiên',
      agenda: `14:00 - Check-in, đón tiếp khách mời & Tiệc nhẹ
14:30 - Khai mạc & Giới thiệu ứng dụng AI trong Marketing
15:15 - Thực hành: Xây dựng Landing Page chuyển đổi cao
16:15 - Tọa đàm Q&A cùng diễn giả & Trao chứng nhận`,
    };

    setForm(sample);
    setErrors({});
  };

  const focusField = (fieldName) => {
    const map = {
      name: nameInputRef,
      date: dateInputRef,
      time: timeInputRef,
      location: locationInputRef,
      speakers: speakersInputRef,
      earlyBird: earlyBirdInputRef,
      agenda: agendaInputRef,
    };
    if (map[fieldName]?.current) {
      map[fieldName].current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Chặn click đúp/click ba
    if (inFlightRef.current || isLoading) return;

    const validation = validateEventInput(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.firstErrorField) {
        focusField(validation.firstErrorField);
      }
      return;
    }

    inFlightRef.current = true;
    setErrors({});
    const startAt = formatToISOWithOffset(form.date, form.time);
    const datetime = form.date && form.time ? `${form.date}T${form.time}` : '';

    onGenerate({
      ...form,
      startAt,
      datetime,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Thanh tiến trình 3 bước trực quan */}
      <div className={styles.stepIndicator} aria-label="Tiến trình thực hiện">
        <div className={`${styles.stepItem} ${styles.stepActive}`}>
          <span className={`${styles.stepDot} ${styles.stepDotActive}`}>1</span>
          <span>Nhập thông tin</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.stepItem}>
          <span className={styles.stepDot}>2</span>
          <span>AI sáng tạo</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.stepItem}>
          <span className={styles.stepDot}>3</span>
          <span>Xem trang & Đăng ký</span>
        </div>
      </div>

      <div className={styles.headerRow}>
        <h2 className={styles.formTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SparklesIcon size={20} />
          <span>Tạo Landing Page Sự Kiện</span>
        </h2>
        <button
          type="button"
          className={styles.sampleBtn}
          onClick={handleFillSample}
          title="Điền nhanh dữ liệu mẫu để thử nghiệm tính năng"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <SparklesIcon size={14} />
          <span>Điền dữ liệu mẫu</span>
        </button>
      </div>

      <div className={styles.grid}>
        {/* Tên sự kiện */}
        <div className={styles.field}>
          <label htmlFor="field-name">
            Tên sự kiện *
            {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
          </label>
          <input
            id="field-name"
            ref={nameInputRef}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="VD: Workshop AI cho Marketer 2026"
            className={errors.name ? styles.inputError : ''}
            aria-invalid={!!errors.name}
            required
          />
        </div>

        {/* Ngày */}
        <div className={styles.field}>
          <label htmlFor="field-date">
            Ngày diễn ra *
            {errors.date && <span className={styles.errorMessage}>{errors.date}</span>}
          </label>
          <input
            id="field-date"
            ref={dateInputRef}
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className={errors.date ? styles.inputError : ''}
            aria-invalid={!!errors.date}
            required
          />
        </div>

        {/* Giờ */}
        <div className={styles.field}>
          <label htmlFor="field-time">
            Giờ bắt đầu (GMT+7) *
            {errors.time && <span className={styles.errorMessage}>{errors.time}</span>}
          </label>
          <input
            id="field-time"
            ref={timeInputRef}
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className={errors.time ? styles.inputError : ''}
            aria-invalid={!!errors.time}
            required
          />
        </div>

        {/* Địa điểm */}
        <div className={styles.field}>
          <label htmlFor="field-location">
            Địa điểm *
            {errors.location && <span className={styles.errorMessage}>{errors.location}</span>}
          </label>
          <input
            id="field-location"
            ref={locationInputRef}
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="VD: Tầng 5, Tòa nhà Landmark 81, TP.HCM hoặc Link Zoom"
            className={errors.location ? styles.inputError : ''}
            aria-invalid={!!errors.location}
            required
          />
        </div>

        {/* Diễn giả */}
        <div className={styles.field}>
          <label htmlFor="field-speakers">
            Diễn giả *
            {errors.speakers && <span className={styles.errorMessage}>{errors.speakers}</span>}
          </label>
          <input
            id="field-speakers"
            ref={speakersInputRef}
            name="speakers"
            value={form.speakers}
            onChange={handleChange}
            placeholder="VD: Nguyễn Văn A (CEO TechVN), Trần Thị B (AI Lead)"
            className={errors.speakers ? styles.inputError : ''}
            aria-invalid={!!errors.speakers}
            required
          />
        </div>

        {/* Ưu đãi đăng ký sớm */}
        <div className={styles.field}>
          <label htmlFor="field-earlyBird">
            Ưu đãi đăng ký sớm
            {errors.earlyBird && <span className={styles.errorMessage}>{errors.earlyBird}</span>}
          </label>
          <input
            id="field-earlyBird"
            ref={earlyBirdInputRef}
            name="earlyBird"
            value={form.earlyBird}
            onChange={handleChange}
            placeholder="VD: Giảm 30% vé tham dự cho 50 người đăng ký đầu tiên"
            className={errors.earlyBird ? styles.inputError : ''}
          />
        </div>

        {/* Chương trình (Agenda) */}
        <div className={styles.field}>
          <label htmlFor="field-agenda">
            Chương trình (Agenda) — <em>Để trống sẽ tự sinh chương trình mẫu</em>
          </label>
          <textarea
            id="field-agenda"
            ref={agendaInputRef}
            name="agenda"
            value={form.agenda}
            onChange={handleChange}
            rows={4}
            placeholder={`VD:\n09:00 - Khai mạc & Networking\n09:30 - Workshop: AI trong Marketing\n11:00 - Q&A với diễn giả`}
          />
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} /> Đang xử lý cùng AI...
          </>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <RocketIcon size={16} />
            <span>Tạo Landing Page</span>
          </span>
        )}
      </button>
    </form>
  );
}
