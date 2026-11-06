/**
 * @file calendar.js
 * Sinh file iCalendar (.ics) trực tiếp phía client để người tham dự thêm vào lịch.
 */

function formatIcsDate(dateObj) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    dateObj.getUTCFullYear() +
    pad(dateObj.getUTCMonth() + 1) +
    pad(dateObj.getUTCDate()) +
    'T' +
    pad(dateObj.getUTCHours()) +
    pad(dateObj.getUTCMinutes()) +
    pad(dateObj.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Tải xuống file .ics cho sự kiện
 */
export function downloadIcsFile(eventData) {
  const { name, startAt, datetime, location, content } = eventData;
  const startDate = new Date(startAt || datetime);
  if (isNaN(startDate.getTime())) return;

  // Thời gian kết thúc mặc định sau 2 giờ
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const title = (name || 'Sự kiện').replace(/[,\n;]/g, ' ');
  const desc = (content?.description || name || '').replace(/\n/g, '\\n');
  const loc = (location || '').replace(/[,\n;]/g, ' ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Page Builder//Vibe Coding 2026//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:epb-${Date.now()}@vibecoding.vn`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${loc}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `su-kien-${(name || 'event').slice(0, 30).replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

