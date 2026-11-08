/**
 * @file api/tunnel/start.js
 * Serverless handler (Vercel) xử lý yêu cầu bật tunnel
 */

import { ensureMethod, sendSuccess } from '../_lib/http.js';

export default function handler(req, res) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  return sendSuccess(res, {
    isVercel: true,
    tunnelUrl: origin,
    message: 'Bạn đang triển khai trên Vercel. Tên miền này đã là domain công khai trực tiếp có HTTPS!',
  });
}

