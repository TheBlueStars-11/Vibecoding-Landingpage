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

/**
 * Phân tích chuỗi mốc thời gian của timeline / agenda (dạng '09:00', '08:30 - 09:30', '9h30', '9:30')
 * @param {string} timeStr
 * @returns {{ startMinutes: number, endMinutes: number, raw: string } | null}
 */
export function parseTimelineTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim();
  if (!clean) return null;

  const parts = clean.split(/\s*[-–—>]\s*|\s+to\s+/i).filter(Boolean);

  const toMinutes = (s) => {
    if (!s) return null;
    const trimmed = s.trim();
    const match = trimmed.match(/^(\d{1,2})(?:[:hH](\d{2}))?(?::\d{2})?$/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = match[2] ? parseInt(match[2], 10) : 0;
      if (h >= 0 && h <= 24 && m >= 0 && m <= 59) {
        return h * 60 + m;
      }
    }
    return null;
  };

  const startMin = toMinutes(parts[0]);
  if (startMin === null) return null;
  const endMin = parts.length > 1 ? toMinutes(parts[1]) : startMin;

  return {
    startMinutes: startMin,
    endMinutes: endMin !== null ? endMin : startMin,
    raw: clean,
  };
}

/**
 * Kiểm tra tính tuần tự tăng dần của các mốc thời gian trong Timeline / Agenda.
 * Mốc thời gian bắt đầu của mục sau bắt buộc phải lớn hơn hoặc bằng thời gian bắt đầu/kết thúc của mục liền trước.
 * 
 * @param {Array<{ time?: string }>} agenda
 * @returns {{ isValid: boolean, invalidIndices: number[], error: string | null }}
 */
export function validateTimelineOrder(agenda = []) {
  if (!Array.isArray(agenda) || agenda.length <= 1) {
    return {
      isValid: true,
      invalidIndices: [],
      error: null,
    };
  }

  const invalidIndicesSet = new Set();
  let maxSeenThreshold = -1;

  for (let i = 0; i < agenda.length; i++) {
    const curr = agenda[i];
    const currParsed = parseTimelineTime(curr?.time);
    if (!currParsed) continue;

    // Kiểm tra đảo ngược nội bộ (ví dụ 10:00 - 09:00)
    if (currParsed.endMinutes < currParsed.startMinutes) {
      invalidIndicesSet.add(i);
    }

    if (i > 0) {
      const prev = agenda[i - 1];
      const prevParsed = parseTimelineTime(prev?.time);
      if (prevParsed) {
        const prevThreshold = Math.max(prevParsed.startMinutes, prevParsed.endMinutes);
        // Mốc thời gian bắt đầu của mục sau bắt buộc phải lớn hơn hoặc bằng thời gian bắt đầu/kết thúc của mục liền trước
        if (currParsed.startMinutes < prevThreshold) {
          invalidIndicesSet.add(i);
        }
      }
      if (maxSeenThreshold >= 0 && currParsed.startMinutes < maxSeenThreshold) {
        invalidIndicesSet.add(i);
      }
    }

    const currThreshold = Math.max(currParsed.startMinutes, currParsed.endMinutes);
    if (currThreshold > maxSeenThreshold) {
      maxSeenThreshold = currThreshold;
    }
  }

  const invalidIndices = Array.from(invalidIndicesSet).sort((a, b) => a - b);
  const isValid = invalidIndices.length === 0;

  return {
    isValid,
    invalidIndices,
    error: isValid ? null : 'Thời gian diễn ra các mục phải theo thứ tự tăng dần. Vui lòng điều chỉnh lại.',
  };
}

// Bí danh tương thích
export const validateAgendaChronology = validateTimelineOrder;


