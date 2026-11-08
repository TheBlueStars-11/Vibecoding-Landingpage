/**
 * @file api/_lib/http.js
 * Tiện ích chuẩn hóa HTTP response, kiểm tra phương thức và khử trùng thông tin nhạy cảm cho API Serverless.
 */

/**
 * Khử trùng URL của endpoint trước khi trả về client hoặc ghi log (loại bỏ ?key=... và tokens)
 */
export function sanitizeEndpointUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const u = new URL(rawUrl);
    if (u.searchParams.has('key')) {
      u.searchParams.set('key', '***MASKED***');
    }
    if (u.searchParams.has('apiKey')) {
      u.searchParams.set('apiKey', '***MASKED***');
    }
    if (u.searchParams.has('token')) {
      u.searchParams.set('token', '***MASKED***');
    }
    return u.toString();
  } catch (err) {
    console.warn('[HTTP] URL không hợp lệ khi khử trùng:', err.message);
    return rawUrl.replace(/([?&](?:key|apiKey|token)=)[^&]+/gi, '$1***MASKED***');
  }
}

/**
 * Kiểm tra phương thức HTTP hợp lệ
 */
export function ensureMethod(req, res, allowedMethods = ['POST']) {
  const allowed = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    res.status(405).json({
      ok: false,
      error: `Phương thức ${req.method} không được hỗ trợ. Chỉ chấp nhận ${allowed.join(', ')}.`,
    });
    return false;
  }
  return true;
}

/**
 * Kiểm tra kích thước payload (mặc định giới hạn 16KB)
 */
export function ensurePayloadSize(req, res, maxBytes = 16384) {
  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > maxBytes) {
    res.status(413).json({
      ok: false,
      error: `Dung lượng yêu cầu vượt quá giới hạn cho phép (${Math.round(maxBytes / 1024)}KB).`,
    });
    return false;
  }

  // Dự phòng kiểm tra chuỗi body khi content-length bị thiếu
  if (req.body) {
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(bodyStr, 'utf8') > maxBytes) {
      res.status(413).json({
        ok: false,
        error: `Dung lượng yêu cầu vượt quá giới hạn cho phép (${Math.round(maxBytes / 1024)}KB).`,
      });
      return false;
    }
  }

  return true;
}

/**
 * Trả về response thành công chuẩn
 */
export function sendSuccess(res, data = {}, statusCode = 200) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json({
    ok: true,
    ...data,
  });
}

/**
 * Trả về response lỗi chuẩn
 */
export function sendError(res, message, statusCode = 500, extra = {}) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json({
    ok: false,
    error: message || 'Đã xảy ra lỗi trên máy chủ.',
    ...extra,
  });
}
