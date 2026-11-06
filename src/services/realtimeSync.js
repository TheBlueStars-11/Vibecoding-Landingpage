/**
 * @file realtimeSync.js
 * Dịch vụ đồng bộ dữ liệu thời gian thực giữa máy chủ dev Vite và các thiết bị khách (điện thoại, tablet).
 * Cho phép thiết bị khác quét QR, truy cập Landing Page và gửi đơn đăng ký về máy chủ Admin ngay lập tức.
 */

/**
 * Lấy thông tin mạng LAN của máy chủ để hiển thị URL cho mã QR
 */
export async function getNetworkInfo() {
  try {
    const res = await fetch('/api/network-info', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Không có server dev hoặc đang chạy build tĩnh
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const port = typeof window !== 'undefined' ? window.location.port || '5173' : '5173';
  return {
    lanIps: [{ name: 'Host hiện tại', ip: hostname }],
    primaryIp: hostname,
    port: Number(port),
  };
}

/**
 * Xuất bản dự án hiện tại lên bộ nhớ dev server để thiết bị khác có thể tải về khi quét QR
 */
export async function publishProjectToSync(project, assets = []) {
  if (!project || !project.id) return false;
  try {
    const res = await fetch('/api/sync/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, assets }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Không thể xuất bản dự án lên máy chủ đồng bộ:', err.message);
    return false;
  }
}

/**
 * Tải dự án từ máy chủ đồng bộ theo slug hoặc id (dành cho thiết bị di động mới quét QR)
 */
export async function fetchProjectFromSync(slugOrId) {
  if (!slugOrId) return null;
  try {
    const query = slugOrId.startsWith('prj_') ? `id=${encodeURIComponent(slugOrId)}` : `slug=${encodeURIComponent(slugOrId)}`;
    const res = await fetch(`/api/sync/project?${query}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.project) {
        return { project: data.project, assets: data.assets || [] };
      }
    }
  } catch (err) {
    console.warn('[Sync] Lỗi khi lấy dự án từ máy chủ đồng bộ:', err.message);
  }
  return null;
}

/**
 * Gửi đơn đăng ký mới từ thiết bị khách lên máy chủ để phát tín hiệu realtime
 */
export async function submitRegistrationToSync(projectId, registration) {
  if (!projectId || !registration) return false;
  try {
    const res = await fetch('/api/sync/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, registration }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.ok;
    }
  } catch (err) {
    console.warn('[Sync] Không thể gửi đơn tới máy chủ đồng bộ:', err.message);
  }
  return false;
}

/**
 * Lấy danh sách đơn đăng ký đã đồng bộ trên máy chủ
 */
export async function getRemoteRegistrations(projectId) {
  if (!projectId) return [];
  try {
    const res = await fetch(`/api/sync/registrations?projectId=${encodeURIComponent(projectId)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.registrations || [];
    }
  } catch {
    // Dự phòng khi offline
  }
  return [];
}

/**
 * Kết nối luồng Server-Sent Events (SSE) để nhận các đơn đăng ký mới tức thì
 * @param {string} projectId ID của dự án cần lắng nghe
 * @param {function} onEvent Callback khi có dữ liệu mới { type, registration, totalCount }
 * @returns {function} cleanup function để ngắt kết nối
 */
export function connectRealtimeStream(projectId, onEvent) {
  if (typeof window === 'undefined' || !window.EventSource) {
    return () => {};
  }

  let es = null;
  let active = true;

  function init() {
    if (!active) return;
    try {
      const url = `/api/sync/stream${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`;
      es = new EventSource(url);

      es.addEventListener('registration_added', (e) => {
        try {
          const payload = JSON.parse(e.data);
          onEvent(payload);
        } catch (err) {
          console.error('[Sync] Lỗi bóc tách dữ liệu SSE:', err);
        }
      });

      es.onerror = () => {
        if (es) {
          es.close();
          es = null;
        }
        // Tự động thử kết nối lại sau 4 giây nếu mất kết nối
        if (active) {
          setTimeout(init, 4000);
        }
      };
    } catch (err) {
      console.warn('[Sync] Lỗi khởi tạo EventSource:', err);
    }
  }

  init();

  return () => {
    active = false;
    if (es) {
      es.close();
      es = null;
    }
  };
}

/**
 * Khởi động Cloudflare Tunnel tự động từ máy chủ dev
 */
export async function startTunnel() {
  try {
    const res = await fetch('/api/tunnel/start', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      return await res.json();
    }
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || 'Không thể khởi động tunnel' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Kiểm tra trạng thái Cloudflare Tunnel hiện tại
 */
export async function getTunnelStatus() {
  try {
    const res = await fetch('/api/tunnel/status', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline
  }
  return { isRunning: false, tunnelUrl: null, isStarting: false };
}

/**
 * Dừng Cloudflare Tunnel
 */
export async function stopTunnel() {
  try {
    const res = await fetch('/api/tunnel/stop', { method: 'POST', signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { ok: false };
}

/**
 * Kiểm tra chuyên sâu trạng thái hoạt động của Cloudflare Tunnel và đo độ trễ mạng
 * @param {string} customTunnelUrl URL tunnel tùy chọn người dùng cấu hình
 * @returns {Promise<{ ok: boolean, isRunning: boolean, tunnelUrl: string | null, latency: number, message: string, checkedAt: string }>}
 */
export async function checkCloudflareHealth(customTunnelUrl = '') {
  const startTime = performance.now();
  const checkedAt = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  try {
    // 1. Kiểm tra trạng thái tiến trình từ dev server
    const statusRes = await fetch('/api/tunnel/status', {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });

    const statusData = statusRes.ok ? await statusRes.json().catch(() => ({})) : {};
    const activeUrl = statusData.tunnelUrl || customTunnelUrl;

    if (!statusData.isRunning && !activeUrl) {
      const latency = Math.round(performance.now() - startTime);
      return {
        ok: false,
        isRunning: false,
        tunnelUrl: null,
        latency,
        checkedAt,
        message: 'Cloudflare Tunnel chưa được bật. Bạn có thể nhấn "Khởi động Cloudflare Tunnel" để kích hoạt.',
      };
    }

    // 2. Nếu có tunnel URL, kiểm tra xem thiết bị hiện tại có thực sự truy cập được không
    if (activeUrl) {
      try {
        const pingTarget = `${activeUrl.replace(/\/+$/, '')}/api/network-info`;
        const pingRes = await fetch(pingTarget, {
          signal: AbortSignal.timeout(6000),
          cache: 'no-store',
          mode: 'cors',
        });
        const latency = Math.round(performance.now() - startTime);

        if (pingRes.ok) {
          return {
            ok: true,
            isRunning: true,
            tunnelUrl: activeUrl,
            latency,
            checkedAt,
            message: `Cloudflare đang hoạt động rất tốt! (Độ trễ phản hồi: ${latency}ms)`,
          };
        }
      } catch {
        // Thiết bị không thể chạm tới trycloudflare.com
        const latency = Math.round(performance.now() - startTime);
        return {
          ok: false,
          isRunning: Boolean(statusData.isRunning),
          tunnelUrl: activeUrl,
          latency,
          checkedAt,
          message: `Không thể truy cập tên miền Cloudflare "${activeUrl}" từ mạng của bạn (bị chặn DNS hoặc nhà mạng). Vui lòng chuyển sang tab "Mạng Cục bộ (Wi-Fi)" hoặc "Tên miền Sự kiện" để quét QR thành công 100%!`,
        };
      }
    }

    const latency = Math.round(performance.now() - startTime);
    if (statusData.isRunning) {
      return {
        ok: true,
        isRunning: true,
        tunnelUrl: activeUrl,
        latency,
        checkedAt,
        message: `Tiến trình Cloudflare đang hoạt động (${activeUrl || 'Đang cấp phát domain...'}). Độ trễ: ${latency}ms`,
      };
    }

    return {
      ok: false,
      isRunning: false,
      tunnelUrl: activeUrl,
      latency,
      checkedAt,
      message: 'Cloudflare Tunnel không phản hồi. Hãy thử bấm Khởi động lại hoặc dán URL mới.',
    };
  } catch (err) {
    const latency = Math.round(performance.now() - startTime);
    return {
      ok: false,
      isRunning: false,
      tunnelUrl: customTunnelUrl || null,
      latency,
      checkedAt,
      message: `Không thể kết nối với Cloudflare: ${err.message || 'Mất kết nối máy chủ'}`,
    };
  }
}



