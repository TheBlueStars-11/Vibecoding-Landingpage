import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import os from 'node:os';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Lấy danh sách IP mạng cục bộ (LAN / Wi-Fi) để chia sẻ cho các thiết bị khác quét QR
 */
function getLocalNetworkIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ name, ip: net.address });
      }
    }
  }
  return ips;
}

// Lưu trữ dữ liệu đồng bộ tạm thời (bộ nhớ + file cache để không bị mất khi reload dev server)
const CACHE_FILE = path.resolve(process.cwd(), '.sync-cache.json');
let devSyncProjects = new Map(); // key: id hoặc slug -> { project, assets, updatedAt }
let devSyncRegistrations = new Map(); // key: projectId -> array of registrations
const sseClients = new Set(); // Set các client SSE đang kết nối để nhận realtime updates

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (Array.isArray(data.projects)) {
        devSyncProjects = new Map(data.projects);
      }
      if (Array.isArray(data.registrations)) {
        devSyncRegistrations = new Map(data.registrations);
      }
    }
  } catch (err) {
    console.warn('[Sync] Không thể tải sync cache:', err.message);
  }
}

function saveCache() {
  try {
    const data = {
      projects: Array.from(devSyncProjects.entries()),
      registrations: Array.from(devSyncRegistrations.entries()),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

loadCache();

// Quản lý tiến trình Cloudflare Tunnel tự động
let tunnelProcess = null;
let activeTunnelUrl = null;
let isStartingTunnel = false;

function stopTunnelProcess() {
  if (tunnelProcess) {
    try {
      if (process.platform === 'win32' && tunnelProcess.pid) {
        spawn('taskkill', ['/pid', String(tunnelProcess.pid), '/T', '/F']);
      } else {
        tunnelProcess.kill('SIGTERM');
      }
    } catch {}
    tunnelProcess = null;
    activeTunnelUrl = null;
    isStartingTunnel = false;
  }
}

function startCloudflareTunnel(port = 5173) {
  if (activeTunnelUrl && tunnelProcess) {
    return Promise.resolve(activeTunnelUrl);
  }
  if (isStartingTunnel) {
    return new Promise((resolve, reject) => {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if (activeTunnelUrl) {
          clearInterval(interval);
          resolve(activeTunnelUrl);
        } else if (count > 60) {
          clearInterval(interval);
          reject(new Error('Cloudflare Tunnel khởi động quá 30 giây.'));
        }
      }, 500);
    });
  }

  isStartingTunnel = true;
  return new Promise((resolve, reject) => {
    try {
      // Dùng 127.0.0.1 thay cho localhost để tránh lỗi phân giải IPv6 trên Windows
      tunnelProcess = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', `http://127.0.0.1:${port}`, '--no-autoupdate'], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        isStartingTunnel = false;
        if (!activeTunnelUrl) {
          reject(new Error('Cloudflare Tunnel phản hồi chậm, bạn có thể dán link thủ công.'));
        }
      }, 30000);

      const onOutput = (buf) => {
        const text = buf.toString();
        const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
        if (match && !activeTunnelUrl) {
          activeTunnelUrl = match[0];
          isStartingTunnel = false;
          clearTimeout(timer);
          console.log('\n[Cloudflare Tunnel] Sẵn sàng truy cập từ mọi thiết bị:', activeTunnelUrl);
          resolve(activeTunnelUrl);
        }
      };

      tunnelProcess.stdout?.on('data', onOutput);
      tunnelProcess.stderr?.on('data', onOutput);

      tunnelProcess.on('error', (err) => {
        isStartingTunnel = false;
        clearTimeout(timer);
        reject(err);
      });

      tunnelProcess.on('exit', () => {
        tunnelProcess = null;
        activeTunnelUrl = null;
        isStartingTunnel = false;
      });
    } catch (e) {
      isStartingTunnel = false;
      reject(e);
    }
  });
}

process.on('exit', stopTunnelProcess);
process.on('SIGINT', () => {
  stopTunnelProcess();
  process.exit();
});
process.on('SIGTERM', () => {
  stopTunnelProcess();
  process.exit();
});

/**
 * Plugin dev server hỗ trợ:
 * 1. Giả lập /api/generate và /api/save-review
 * 2. API Đồng bộ dữ liệu sự kiện thời gian thực qua mạng LAN / Tunnel
 * 3. Server-Sent Events (SSE) để phát tín hiệu đăng ký tức thì tới màn hình Studio
 * 4. Tự động quản lý Cloudflare Tunnel
 */
function devApiProxyPlugin() {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        // Bật CORS cho tất cả API đồng bộ để hỗ trợ truy cập đa thiết bị và qua Tunnel
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // 1. Endpoint trả về thông tin mạng LAN và Cloudflare Tunnel của máy chủ
        if (pathname === '/api/network-info' && req.method === 'GET') {
          const ips = getLocalNetworkIps();
          const preferred = ips.find((i) => i.name.toLowerCase().includes('wi-fi') || i.name.toLowerCase().includes('wlan') || i.name.toLowerCase().includes('ethernet')) || ips[0];
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            lanIps: ips,
            primaryIp: preferred ? preferred.ip : 'localhost',
            port: 5173,
            tunnelUrl: activeTunnelUrl,
            isTunnelRunning: Boolean(tunnelProcess && activeTunnelUrl),
            isStartingTunnel,
          }));
          return;
        }

        // 2. Endpoint khởi động Cloudflare Tunnel tự động
        if (pathname === '/api/tunnel/start' && req.method === 'POST') {
          try {
            const url = await startCloudflareTunnel(5173);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, tunnelUrl: url }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
          return;
        }

        // 3. Endpoint lấy trạng thái Cloudflare Tunnel
        if (pathname === '/api/tunnel/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            isRunning: Boolean(tunnelProcess && activeTunnelUrl),
            tunnelUrl: activeTunnelUrl,
            isStarting: isStartingTunnel,
          }));
          return;
        }

        // 4. Endpoint dừng Cloudflare Tunnel
        if (pathname === '/api/tunnel/stop' && req.method === 'POST') {
          stopTunnelProcess();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // 5. Endpoint Server-Sent Events (SSE) để truyền dữ liệu thời gian thực
        if (pathname === '/api/sync/stream' && req.method === 'GET') {
          const projectId = urlObj.searchParams.get('projectId');
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });

          const client = { res, projectId };
          sseClients.add(client);

          // Gửi tín hiệu khởi tạo
          res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: Date.now() })}\n\n`);

          // Heartbeat giữ kết nối mỗi 20s
          const keepAlive = setInterval(() => {
            try {
              res.write(': keepalive\n\n');
            } catch {
              clearInterval(keepAlive);
            }
          }, 20000);

          req.on('close', () => {
            clearInterval(keepAlive);
            sseClients.delete(client);
          });
          return;
        }

        // 6. Endpoint xuất bản / đồng bộ dự án lên dev server
        if (pathname === '/api/sync/publish' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (c) => { bodyStr += c; });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { project, assets } = body;
              if (project && project.id) {
                devSyncProjects.set(project.id, { project, assets, updatedAt: Date.now() });
                if (project.slug) {
                  devSyncProjects.set(project.slug, { project, assets, updatedAt: Date.now() });
                }
                saveCache();
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, count: devSyncProjects.size }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        // 7. Endpoint lấy dự án theo slug hoặc id cho thiết bị khách truy cập
        if (pathname === '/api/sync/project' && req.method === 'GET') {
          const slug = urlObj.searchParams.get('slug');
          const id = urlObj.searchParams.get('id');
          const item = devSyncProjects.get(slug) || devSyncProjects.get(id);

          res.setHeader('Content-Type', 'application/json');
          if (item) {
            res.end(JSON.stringify({ ok: true, project: item.project, assets: item.assets }));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ ok: false, error: 'Sự kiện chưa được đồng bộ lên máy chủ.' }));
          }
          return;
        }

        // 8. Endpoint nộp đơn đăng ký từ thiết bị khách và phát SSE cho Admin Studio
        if (pathname === '/api/sync/register' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (c) => { bodyStr += c; });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { projectId, registration } = body;
              if (!projectId || !registration) {
                throw new Error('Thiếu projectId hoặc thông tin đăng ký.');
              }

              const list = devSyncRegistrations.get(projectId) || [];
              const exists = list.some((r) => r.id === registration.id || (r.code && r.code === registration.code));
              if (!exists) {
                list.unshift(registration);
                devSyncRegistrations.set(projectId, list);
                saveCache();
              }

              // Phát tín hiệu tức thì qua SSE cho các client đang mở Studio
              const broadcastPayload = JSON.stringify({
                type: 'registration_added',
                projectId,
                registration,
                totalCount: list.length,
              });

              for (const c of sseClients) {
                if (!c.projectId || c.projectId === projectId) {
                  try {
                    c.res.write(`event: registration_added\ndata: ${broadcastPayload}\n\n`);
                  } catch {
                    sseClients.delete(c);
                  }
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, registration, totalCount: list.length }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        // 9. Endpoint lấy danh sách đơn đăng ký đã đồng bộ
        if (pathname === '/api/sync/registrations' && req.method === 'GET') {
          const projectId = urlObj.searchParams.get('projectId');
          const list = devSyncRegistrations.get(projectId) || [];
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, registrations: list }));
          return;
        }

        // Giữ nguyên các handler cũ: /api/generate và /api/save-review
        if ((pathname === '/api/generate' || pathname === '/api/save-review') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const fakeReq = { method: 'POST', body };
              const fakeRes = {
                status(code) {
                  res.statusCode = code;
                  return this;
                },
                json(obj) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(obj));
                },
              };
              if (pathname === '/api/save-review') {
                const handler = (await import('./api/save-review.js')).default;
                await handler(fakeReq, fakeRes);
              } else {
                const handler = (await import('./api/generate.js')).default;
                await handler(fakeReq, fakeRes);
              }
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: e.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Nạp biến môi trường cho tiến trình server Vite
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  return {
    server: {
      host: true, // Lắng nghe trên tất cả card mạng (0.0.0.0) để thiết bị LAN truy cập được
      port: 5173,
      allowedHosts: true, // Cho phép Cloudflare Tunnel, ngrok và mọi host truy cập không bị lỗi 403 Blocked request
      cors: true,
    },
    plugins: [react(), devApiProxyPlugin()],
  };
});
