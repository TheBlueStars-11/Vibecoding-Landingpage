import { normalizeText } from './normalize.js';

/**
 * Phân tích chuỗi text agenda thành danh sách các mục { time, title }
 */
export function parseAgenda(agendaText) {
  if (!agendaText || typeof agendaText !== 'string') return [];
  return agendaText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const dashIdx = line.indexOf('-');
      if (dashIdx > -1) {
        return {
          time: normalizeText(line.slice(0, dashIdx)),
          title: normalizeText(line.slice(dashIdx + 1)),
        };
      }
      return { time: '', title: normalizeText(line) };
    });
}

/**
 * Chuyển danh sách agenda thành dạng text xuống dòng
 */
export function agendaToText(agendaItems) {
  if (!Array.isArray(agendaItems)) return '';
  return agendaItems
    .map((item) => (item.time ? `${item.time} - ${item.title}` : item.title))
    .join('\n');
}

/**
 * Sinh lịch trình dự kiến mẫu nếu người dùng để trống.
 * Dựa trên giờ bắt đầu (HH:mm) của sự kiện.
 */
export function generateSampleAgenda(startTime = '08:00', speakers = []) {
  const [hStr, mStr] = (startTime || '08:00').split(':');
  let hour = parseInt(hStr, 10) || 8;
  let minute = parseInt(mStr, 10) || 0;

  const pad = (n) => String(n).padStart(2, '0');
  const formatTime = (h, m) => `${pad(h % 24)}:${pad(m % 60)}`;

  const speakerName = speakers && speakers.length > 0 ? speakers[0] : 'Diễn giả';

  const t0 = formatTime(hour, minute);
  const t1 = formatTime(hour, minute + 30);
  const t2 = formatTime(hour + 1, minute);
  const t3 = formatTime(hour + 2, minute);
  const t4 = formatTime(hour + 2, minute + 30);

  return [
    { time: t0, title: 'Check-in, đón tiếp khách mời & Tiệc nhẹ' },
    { time: t1, title: 'Khai mạc sự kiện & Giới thiệu tổng quan' },
    { time: t2, title: `Phiên chia sẻ chuyên sâu cùng ${speakerName}` },
    { time: t3, title: 'Tọa đàm, Hỏi đáp trực tiếp (Q&A) & Thảo luận' },
    { time: t4, title: 'Tổng kết, Bế mạc & Giao lưu kết nối (Networking)' },
  ];
}
