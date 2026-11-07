/**
 * @file api/tunnel/start.js
 * Serverless handler (Vercel) xử lý yêu cầu bật tunnel
 */

export default function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    ok: true,
    isVercel: true,
    tunnelUrl: origin,
    message: 'Bạn đang triển khai trên Vercel. Tên miền này đã là domain công khai trực tiếp có HTTPS!',
  });
}

