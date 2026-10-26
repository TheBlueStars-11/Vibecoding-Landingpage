const STORAGE_PREFIX = 'event_lp_';

/**
 * Lấy key lưu trữ theo event id
 */
function getKey(eventId) {
  return `${STORAGE_PREFIX}${eventId}_registrations`;
}

/**
 * Lấy danh sách người đăng ký theo eventId
 */
export function getRegistrations(eventId) {
  try {
    const raw = localStorage.getItem(getKey(eventId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Thêm người đăng ký mới
 * @returns {{ success: boolean, message: string }}
 */
export function addRegistration(eventId, { name, email, phone }) {
  const list = getRegistrations(eventId);
  const isDuplicate = list.some((r) => r.email.toLowerCase() === email.toLowerCase());
  if (isDuplicate) {
    return { success: false, message: 'Email này đã đăng ký rồi!' };
  }
  list.push({ name, email, phone, registeredAt: new Date().toISOString() });
  localStorage.setItem(getKey(eventId), JSON.stringify(list));
  return { success: true, message: 'Đăng ký thành công! Hẹn gặp bạn tại sự kiện 🎉' };
}

/**
 * Đếm số người đăng ký
 */
export function countRegistrations(eventId) {
  return getRegistrations(eventId).length;
}

