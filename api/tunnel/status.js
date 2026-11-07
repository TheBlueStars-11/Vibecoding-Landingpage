/**
 * @file api/tunnel/status.js
 * Serverless handler (Vercel) lấy trạng thái tunnel
 */

export default function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    isRunning: proto === 'https',
    isVercel: true,
    tunnelUrl: proto === 'https' ? origin : null,
    isStarting: false,
  });
}

