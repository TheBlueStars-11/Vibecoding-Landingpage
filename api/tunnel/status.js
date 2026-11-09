/**
 * @file api/tunnel/status.js
 * Serverless handler (Vercel) lấy trạng thái tunnel
 */

import { ensureDevOnly, ensureMethod, sendSuccess } from '../_lib/http.js';

export default function handler(req, res) {
  if (!ensureDevOnly(req, res)) {
    return;
  }
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  return sendSuccess(res, {
    isRunning: proto === 'https',
    isVercel: true,
    tunnelUrl: proto === 'https' ? origin : null,
    isStarting: false,
  });
}

