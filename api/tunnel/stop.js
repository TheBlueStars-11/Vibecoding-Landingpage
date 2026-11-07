/**
 * @file api/tunnel/stop.js
 */

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ ok: true });
}

