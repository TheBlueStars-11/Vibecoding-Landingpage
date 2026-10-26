import { useState, useEffect } from 'react';
import { getRegistrations } from '../lib/storage';
import styles from './RegistrationList.module.css';

function getAllEvents() {
  const events = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('event_lp_') && key?.endsWith('_registrations')) {
      const eventId = key.replace('event_lp_', '').replace('_registrations', '');
      events.push(eventId);
    }
  }
  return events;
}

function exportCSV(eventId, rows) {
  const header = 'Họ tên,Email,Số điện thoại,Thời gian đăng ký';
  const body = rows
    .map((r) => `"${r.name}","${r.email}","${r.phone || ''}","${new Date(r.registeredAt).toLocaleString('vi-VN')}"`)
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
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const list = getAllEvents();
    setEvents(list);
    if (list.length > 0) {
      setSelected(list[0]);
      setRows(getRegistrations(list[0]));
    }
  }, []);

  const handleSelect = (id) => {
    setSelected(id);
    setRows(getRegistrations(id));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📋 Danh sách đăng ký</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {events.length === 0 ? (
          <div className={styles.empty}>
            <p>Chưa có ai đăng ký sự kiện nào.</p>
          </div>
        ) : (
          <>
            {/* Chọn sự kiện */}
            <div className={styles.eventTabs}>
              {events.map((id) => (
                <button
                  key={id}
                  className={`${styles.tab} ${selected === id ? styles.activeTab : ''}`}
                  onClick={() => handleSelect(id)}
                >
                  {id.split('-').slice(0, 3).join(' ')}
                </button>
              ))}
            </div>

            {/* Số lượng + nút xuất */}
            <div className={styles.toolbar}>
              <span className={styles.count}>🔥 {rows.length} người đã đăng ký</span>
              <button
                className={styles.exportBtn}
                onClick={() => exportCSV(selected, rows)}
                disabled={rows.length === 0}
              >
                ⬇️ Xuất CSV
              </button>
            </div>

            {/* Bảng dữ liệu */}
            {rows.length === 0 ? (
              <p className={styles.empty}>Sự kiện này chưa có đăng ký.</p>
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
                        <td>{r.name}</td>
                        <td>{r.email}</td>
                        <td>{r.phone || '—'}</td>
                        <td>{new Date(r.registeredAt).toLocaleString('vi-VN')}</td>
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

