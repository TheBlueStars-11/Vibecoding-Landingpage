/**
 * @file api/network-info.js
 * Serverless handler (Vercel) trả về thông tin tên miền máy chủ công khai
 */

import { ensureMethod, sendSuccess } from './_lib/http.js';

export default function handler(req, res) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  return sendSuccess(res, {
    lanIps: [{ name: 'Vercel / Cloud Domain', ip: host }],
    primaryIp: host,
    port: proto === 'https' ? 443 : 80,
    isVercel: true,
    origin,
    tunnelUrl: proto === 'https' ? origin : null,
    isTunnelRunning: false,
    isStartingTunnel: false,
  });
}

