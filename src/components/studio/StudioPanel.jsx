import { useState } from 'react';
import { THEMES, TONES } from '../../domain/schema.js';
import styles from './StudioPanel.module.css';

export default function StudioPanel({
  currentTheme,
  onThemeChange,
  currentTone,
  onToneChange,
  aiContent,
  onUpdateContent,
  onRegenerate,
  isRegenerating,
  onOpenAdmin,
  onNewEvent,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    headline: aiContent?.headline || '',
    description: aiContent?.description || '',
    bullet1: aiContent?.bullets?.[0] || '',
    bullet2: aiContent?.bullets?.[1] || '',
    bullet3: aiContent?.bullets?.[2] || '',
  });

  const handleSaveEdit = (e) => {
    e.preventDefault();
    onUpdateContent({
      ...aiContent,
      headline: editForm.headline,
      description: editForm.description,
      bullets: [editForm.bullet1, editForm.bullet2, editForm.bullet3],
    });
    setIsEditing(false);
  };

  return (
    <aside className={styles.panel} aria-label="Bảng điều khiển Studio">
      <div className={styles.container}>
        {/* Nguồn nội dung */}
        <div className={styles.badgeWrap}>
          {aiContent?.source === 'mock' ? (
            <span className={styles.mockBadge} title="Chế độ chạy an toàn không cần khóa API">
              ⚠️ Bản demo vòng loại - Dữ liệu mô phỏng AI
            </span>
          ) : (
            <span className={styles.aiBadge}>
              ✨ Nội dung do AI biên soạn
            </span>
          )}
        </div>

        {/* Nhóm điều khiển: Theme + Tone + Hành động */}
        <div className={styles.controls}>
          {/* Bộ chọn Theme */}
          <div className={styles.controlGroup}>
            <span className={styles.label}>Giao diện:</span>
            <div className={styles.buttonGroup}>
              {[
                { id: THEMES.CLASSIC, label: 'Classic' },
                { id: THEMES.MIDNIGHT, label: 'Midnight' },
                { id: THEMES.SUNRISE, label: 'Sunrise' },
                { id: THEMES.MINIMAL, label: 'Minimal' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.pillBtn} ${currentTheme === id ? styles.activePill : ''}`}
                  onClick={() => onThemeChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bộ chọn Giọng văn Tone */}
          <div className={styles.controlGroup}>
            <span className={styles.label}>Giọng văn:</span>
            <div className={styles.buttonGroup}>
              {[
                { id: TONES.PROFESSIONAL, label: 'Chuyên nghiệp' },
                { id: TONES.FRIENDLY, label: 'Thân thiện' },
                { id: TONES.PREMIUM, label: 'Cao cấp' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.pillBtn} ${currentTone === id ? styles.activePill : ''}`}
                  onClick={() => onToneChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Nhóm nút tác vụ */}
          <div className={styles.actionGroup}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? '⏳ Đang tạo lại...' : '🔄 Tạo lại AI'}
            </button>

            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Đóng sửa' : '✏️ Sửa nội dung'}
            </button>

            <button
              type="button"
              className={styles.actionBtnPrimary}
              onClick={onOpenAdmin}
            >
              📋 Quản lý đăng ký
            </button>

            <button
              type="button"
              className={styles.actionBtnOutline}
              onClick={onNewEvent}
            >
              ➕ Tạo mới
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Form chỉnh sửa nhanh nội dung AI */}
      {isEditing && (
        <div className={styles.editModal}>
          <form onSubmit={handleSaveEdit} className={styles.editForm}>
            <h4>✏️ Chỉnh sửa nhanh nội dung Landing Page</h4>
            <div className={styles.editField}>
              <label>Tiêu đề chính:</label>
              <input
                value={editForm.headline}
                onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                required
              />
            </div>

            <div className={styles.editField}>
              <label>Mô tả:</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className={styles.editField}>
              <label>Lợi ích 1:</label>
              <input
                value={editForm.bullet1}
                onChange={(e) => setEditForm({ ...editForm, bullet1: e.target.value })}
                required
              />
            </div>
            <div className={styles.editField}>
              <label>Lợi ích 2:</label>
              <input
                value={editForm.bullet2}
                onChange={(e) => setEditForm({ ...editForm, bullet2: e.target.value })}
                required
              />
            </div>
            <div className={styles.editField}>
              <label>Lợi ích 3:</label>
              <input
                value={editForm.bullet3}
                onChange={(e) => setEditForm({ ...editForm, bullet3: e.target.value })}
                required
              />
            </div>

            <div className={styles.editButtons}>
              <button type="submit" className={styles.saveBtn}>Lưu thay đổi</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setIsEditing(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}

