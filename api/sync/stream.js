/**
 * @file api/sync/stream.js
 * Serverless handler (Vercel) cho luồng SSE hoặc ping kết nối
 */

export default function handler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: Date.now() })}\n\n`);

  // Giữ kết nối ngắn cho serverless
  const timer = setTimeout(() => {
    res.end();
  }, 9000);

  req.on('close', () => {
    clearTimeout(timer);
  });
}

