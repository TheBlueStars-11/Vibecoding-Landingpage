import { useState } from 'react';
import { getRegistrations, eventRepo } from '../lib/storage.js';
import { STORAGE_KEYS } from '../domain/schema.js';
import { maskEmail } from '../domain/normalize.js';
import { FileTextIcon, LockIcon, CloseIcon, LightbulbIcon, FlameIcon, EyeIcon, DownloadIcon, TrashIcon } from './ui/Icons.jsx';
import styles from './RegistrationList.module.css';

function getAllEventEntries() {
  const map = new Map();

  // 1. Lấy từ danh sách events đã lưu
  const savedEvents = eventRepo.list();
  savedEvents.forEach((ev) => {
    map.set(ev.id, ev.name || ev.id);
  });

  // 2. Quét thêm từ localStorage (epb:v1:regs:* và event_lp_*)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith(STORAGE_KEYS.REG_PREFIX)) {
      const eventId = key.replace(STORAGE_KEYS.REG_PREFIX, '');
      if (!map.has(eventId)) {
        map.set(eventId, eventId.split('-').slice(0, 3).join(' '));
      }
    } else if (key.startsWith('event_lp_') && key.endsWith('_registrations')) {
      const legacyId = key.replace('event_lp_', '').replace('_registrations', '');
      if (!map.has(legacyId)) {
        map.set(legacyId, legacyId.split('-').slice(0, 3).join(' '));
      }
    }
  }

  return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
}

/**
 * Xuất file CSV:
 * - Thêm BOM UTF-8 (\uFEFF) hiển thị tiếng Việt chuẩn trên Excel
 * - Chống CSV Formula Injection bằng cách prefix dấu ' nếu ô bắt đầu bằng =, +, -, @
 */
function exportCSV(eventId, rows) {
  const sanitizeCell = (val) => {
    let str = String(val || '');
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`; // Chống injection
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const header = ['Họ tên', 'Email', 'Số điện thoại', 'Thời gian đăng ký'].map(sanitizeCell).join(',');
  const body = rows
    .map((r) => {
      const name = r.fullName || r.name || '';
      const email = r.email || '';
      const phone = r.phone || '';
      const dateStr = r.createdAt || r.registeredAt || '';
      const formattedDate = dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '';
      return [name, email, phone, formattedDate].map(sanitizeCell).join(',');
    })
    .join('\n');

  const blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dang-ky-${eventId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RegistrationList({ onClose }) {
  const [eventEntries] = useState(() => getAllEventEntries());
  const [selected, setSelected] = useState(() => (eventEntries.length > 0 ? eventEntries[0].id : null));
  const [rows, setRows] = useState(() => (eventEntries.length > 0 ? getRegistrations(eventEntries[0].id) : []));
  const [showFullEmail, setShowFullEmail] = useState(false);

  const handleSelect = (id) => {
    setSelected(id);
    setRows(getRegistrations(id));
  };

  const handleClearRegistrations = () => {
    if (!selected) return;
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách đăng ký của sự kiện này? Thao tác này không thể hoàn tác.');
    if (confirmDelete) {
      try {
        localStorage.removeItem(`${STORAGE_KEYS.REG_PREFIX}${selected}`);
        setRows([]);
      } catch (err) {
        console.error('Lỗi khi xóa đăng ký:', err);
      }
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Quản lý danh sách đăng ký">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FileTextIcon size={20} />
              <span>Quản Lý Danh Sách Đăng Ký</span>
            </h2>
            <span className={styles.privacyBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <LockIcon size={12} />
              <span>Chế độ nhà tổ chức</span>
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng bảng quản lý" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={16} />
          </button>
        </div>

        <div className={styles.privacyNotice} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LightbulbIcon size={16} style={{ flexShrink: 0 }} />
          <em>Dữ liệu người đăng ký được lưu trữ an toàn trên trình duyệt của bạn. Email mặc định được che để bảo vệ quyền riêng tư.</em>
        </div>

        {eventEntries.length === 0 ? (
          <div className={styles.empty}>
            <p>Chưa có ai đăng ký sự kiện nào.</p>
          </div>
        ) : (
          <>
            {/* Chọn sự kiện */}
            <div className={styles.eventTabs}>
              {eventEntries.map(({ id, title }) => (
                <button
                  key={id}
                  className={`${styles.tab} ${selected === id ? styles.activeTab : ''}`}
                  onClick={() => handleSelect(id)}
                >
                  {title}
                </button>
              ))}
            </div>

            {/* Thanh công cụ quản lý */}
            <div className={styles.toolbar}>
              <span className={styles.count} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FlameIcon size={14} />
                <span><strong>{rows.length}</strong> người đã đăng ký</span>
              </span>

              <div className={styles.toolbarActions}>
                <button
                  type="button"
                  className={styles.toggleEmailBtn}
                  onClick={() => setShowFullEmail(!showFullEmail)}
                  title={showFullEmail ? 'Ẩn bớt email' : 'Hiện đầy đủ email'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  {showFullEmail ? (
                    <>
                      <LockIcon size={13} />
                      <span>Ẩn bớt email</span>
                    </>
                  ) : (
                    <>
                      <EyeIcon size={13} />
                      <span>Hiện đầy đủ email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={() => exportCSV(selected, rows)}
                  disabled={rows.length === 0}
                  title="Xuất file CSV chuẩn UTF-8 BOM xem tiếng Việt trên Excel"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <DownloadIcon size={14} />
                  <span>Xuất CSV</span>
                </button>

                {rows.length > 0 && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={handleClearRegistrations}
                    title="Xóa toàn bộ danh sách đăng ký của sự kiện này"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <TrashIcon size={14} />
                    <span>Xóa danh sách</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bảng dữ liệu */}
            {rows.length === 0 ? (
              <p className={styles.empty}>Sự kiện này chưa có người đăng ký.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Thời gian đăng ký</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td><strong>{r.fullName || r.name}</strong></td>
                        <td>
                          <span className={styles.emailText}>
                            {showFullEmail ? r.email : maskEmail(r.email)}
                          </span>
                        </td>
                        <td>{r.phone || '—'}</td>
                        <td>
                          {r.createdAt || r.registeredAt
                            ? new Date(r.createdAt || r.registeredAt).toLocaleString('vi-VN')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
