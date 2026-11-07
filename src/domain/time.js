/**
 * @file time.js
 * Quản lý định dạng thời gian chuẩn GMT+7 (Asia/Ho_Chi_Minh) và thuật toán đếm ngược.
 */

export const TIMEZONE = 'Asia/Ho_Chi_Minh';
export const TIMEZONE_OFFSET_STR = '+07:00';

/**
 * Ghép date (YYYY-MM-DD) và time (HH:mm) thành chuỗi ISO 8601 kèm offset +07:00 cố định.
 * Tránh lỗi lệch múi giờ khi người dùng ở nước ngoài hoặc máy khách đặt múi giờ khác.
 */
export function formatToISOWithOffset(dateStr, timeStr) {
  if (!dateStr) return '';
  const cleanTime = timeStr && timeStr.trim() ? timeStr.trim() : '08:00';
  const fullTime = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
  return `${dateStr}T${fullTime}${TIMEZONE_OFFSET_STR}`;
}

/**
 * Tách chuỗi ISO hoặc datetime-local về { date: 'YYYY-MM-DD', time: 'HH:mm' }
 */
export function parseISODateTime(isoStr) {
  if (!isoStr) return { date: '', time: '08:00' };
  try {
    const [dPart, tPart] = isoStr.split('T');
    const date = dPart || '';
    let time = '08:00';
    if (tPart) {
      time = tPart.slice(0, 5);
    }
    return { date, time };
  } catch {
    return { date: '', time: '08:00' };
  }
}

/**
 * Kiểm tra xem ngày giờ có phải ở tương lai không (tối thiểu minMinutes phút tính từ hiện tại theo giờ GMT+7)
 */
export function isFutureDateTime(dateStr, timeStr, minMinutes = 0) {
  const iso = formatToISOWithOffset(dateStr, timeStr);
  if (!iso) return false;
  const targetMs = new Date(iso).getTime();
  if (isNaN(targetMs)) return false;
  const nowMs = Date.now();
  return targetMs - nowMs >= minMinutes * 60 * 1000;
}

/**
 * Phân định chi tiết trạng thái quá khứ: ngày đã qua hay cùng ngày nhưng giờ đã qua (SYS-08)
 */
export function checkPastDateTime(dateStr, timeStr) {
  if (!dateStr) return { isPast: false, isPastDate: false, isPastHourToday: false };
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const todayStr = `${map.year}-${map.month}-${map.day}`;
  const nowTime = `${map.hour}:${map.minute}`;

  if (dateStr < todayStr) {
    return { isPast: true, isPastDate: true, isPastHourToday: false };
  }
  if (dateStr === todayStr) {
    const cleanTime = (timeStr || '00:00').trim().slice(0, 5);
    if (cleanTime <= nowTime) {
      return { isPast: true, isPastDate: false, isPastHourToday: true };
    }
  }
  return { isPast: false, isPastDate: false, isPastHourToday: false };
}

/**
 * Định dạng ngày giờ thân thiện theo tiếng Việt và múi giờ GMT+7
 */
export function formatVietnameseDateTime(isoOrDate) {
  if (!isoOrDate) return '';
  const dateObj = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj) + ' (GMT+7)';
}

/**
 * Tính toán thời gian đếm ngược còn lại
 * @param {string|Date} targetDatetime - Thời điểm sự kiện
 * @returns {{ d: number, h: number, m: number, s: number, isPast: boolean, totalMs: number }}
 */
export function calculateCountdown(targetDatetime) {
  if (!targetDatetime) {
    return { d: 0, h: 0, m: 0, s: 0, isPast: true, totalMs: 0 };
  }
  const targetMs = new Date(targetDatetime).getTime();
  if (isNaN(targetMs)) {
    return { d: 0, h: 0, m: 0, s: 0, isPast: true, totalMs: 0 };
  }

  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { d: 0, h: 0, m: 0, s: 0, isPast: true, totalMs: 0 };
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return { d, h, m, s, isPast: false, totalMs: diff };
}

