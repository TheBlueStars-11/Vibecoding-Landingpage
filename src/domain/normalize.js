/**
 * @file normalize.js
 * Các hàm thuần chuẩn hóa chuỗi, Unicode NFC, email, số điện thoại Việt Nam.
 */

/**
 * Chuẩn hóa chuỗi văn bản:
 * - Chuyển sang chuẩn Unicode NFC (tránh lỗi font dấu tiếng Việt tổ hợp)
 * - Xóa khoảng trắng thừa đầu đuôi và gộp khoảng trắng liên tiếp
 */
export function normalizeText(str) {
  if (typeof str !== 'string') return '';
  return str.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * Chuẩn hóa email:
 * - trim, chuyển về chữ thường
 */
export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.normalize('NFC').trim().toLowerCase();
}

/**
 * Chuẩn hóa số điện thoại Việt Nam:
 * - Xóa dấu cách, dấu gạch nối, dấu chấm, dấu ngoặc
 * - Chuyển đổi các định dạng đầu số: +84, 84 -> 0
 * - Trả về chuỗi 10 số dạng 0xxxxxxxxx hoặc chuỗi rỗng nếu không hợp lệ
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/[\s\-.()]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Kiểm tra số điện thoại Việt Nam có hợp lệ không (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)
 */
export function isValidVietnamesePhone(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return true; // Phone là tùy chọn
  return /^0[35789]\d{8}$/.test(norm);
}

/**
 * Chuẩn hóa danh sách diễn giả:
 * Tách từ chuỗi (dấu phẩy hoặc xuống dòng), trim, lọc rỗng, tối đa 6 người.
 */
export function normalizeSpeakers(input) {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : input.split(/[,;\n]/);

  return rawList
    .map((s) => normalizeText(s))
    .filter(Boolean)
    .slice(0, 6);
}

/**
 * Che mờ email để bảo vệ quyền riêng tư:
 * VD: "nguyenminhanh@gmail.com" -> "n***@gmail.com"
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0] || '*'}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}
