/**
 * Hàm sao chép văn bản vào clipboard an toàn và tương thích 100%
 * Hoạt động trên mọi môi trường: HTTPS, localhost và cả HTTP qua IP mạng LAN (192.168.x.x)
 */
export async function copyToClipboard(text) {
  if (!text && text !== 0) return false;
  const str = String(text);

  // 1. Thử dùng Clipboard API chuẩn nếu khả dụng (HTTPS / localhost)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch {
      // Bị chặn quyền hoặc không ở secure context, chuyển sang fallback
    }
  }

  // 2. Fallback đáng tin cậy: textarea ẩn + document.execCommand('copy')
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = str;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return Boolean(success);
    } catch (err) {
      console.warn('Fallback copy error:', err);
    }
  }

  return false;
}
