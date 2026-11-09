/**
 * @file aiLogger.js
 * Quản lý cấu hình AI, kiểm thử kết nối trực tiếp và ghi lại toàn bộ nhật ký
 * gọi API (thời điểm, latency, tên model, input và output đầy đủ).
 */

export const ELS_AI_CONFIG_KEY = 'els:ai:config';
export const ELS_AI_LOGS_KEY = 'els:ai:call_logs';
const MAX_LOGS_LIMIT = 50; // Giới hạn 50 nhật ký gần nhất để bảo vệ quota localStorage (ADR-3, Luồng 3)

/**
 * Khử trùng dữ liệu nhạy cảm (API key, Bearer token, header bí mật) trước khi lưu log hoặc xuất file JSON
 */
export function sanitizeForLog(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    return data
      .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'AIzaSy***MASKED***')
      .replace(/(Bearer\s+)[A-Za-z0-9_.-]+/gi, '$1***MASKED***');
  }
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeForLog);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (/apiKey|token|authorization|password|secret|auth/i.test(key) && typeof value === 'string') {
      if (/^bearer\s+/i.test(value)) {
        clean[key] = 'Bearer ***MASKED***';
      } else {
        clean[key] = '***MASKED***';
      }
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeForLog(value);
    } else if (typeof value === 'string') {
      clean[key] = sanitizeForLog(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Cấu hình mặc định lấy từ biến môi trường
 */
export function getDefaultAiConfig() {
  // Chỉ lấy khóa trên client trong môi trường DEV để test trực tiếp nếu cần.
  // Trong bản build Production, tuyệt đối không nhúng khóa vào bundle client (FIX-03).
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.DEV && import.meta.env?.VITE_GEMINI_API_KEY) || '';
  const envBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_BASE_URL) || 'https://generativelanguage.googleapis.com/v1beta';
  const envModel = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_MODEL) || 'gemini-1.5-flash';

  return {
    apiKey: envKey,
    baseUrl: envBaseUrl,
    model: envModel,
    temperature: 0.7,
    maxTokens: 2048,
    timeoutSec: 20,
    forceMock: false,
  };
}

/**
 * Lấy cấu hình AI hiện tại (kết hợp localStorage và biến môi trường)
 */
export function getAiConfig() {
  const defaults = getDefaultAiConfig();
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaults;
  }
  try {
    const raw = localStorage.getItem(ELS_AI_CONFIG_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      // Đảm bảo kiểu số hợp lệ
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : defaults.temperature,
      maxTokens: typeof parsed.maxTokens === 'number' ? parsed.maxTokens : defaults.maxTokens,
      timeoutSec: typeof parsed.timeoutSec === 'number' ? parsed.timeoutSec : defaults.timeoutSec,
      forceMock: Boolean(parsed.forceMock),
    };
  } catch {
    return defaults;
  }
}

/**
 * Lưu cấu hình AI mới vào localStorage và phát event
 */
export function saveAiConfig(newConfig) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const merged = { ...getAiConfig(), ...newConfig };
  try {
    localStorage.setItem(ELS_AI_CONFIG_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('els:ai_config_updated', { detail: merged }));
  } catch (e) {
    console.error('[aiLogger] Không thể lưu cấu hình:', e);
  }
}

/**
 * Đặt lại cấu hình về mặc định (.env)
 */
export function resetAiConfig() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(ELS_AI_CONFIG_KEY);
    const defaults = getDefaultAiConfig();
    window.dispatchEvent(new CustomEvent('els:ai_config_updated', { detail: defaults }));
  } catch (e) {
    console.error('[aiLogger] Không thể reset cấu hình:', e);
  }
}

/**
 * Lấy danh sách toàn bộ nhật ký cuộc gọi API đã lưu
 */
export function getAiLogs() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(ELS_AI_LOGS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Ghi lại 1 lần gọi API với đầy đủ thông số:
 * - timestamp: thời điểm chính xác
 * - latencyMs: độ trễ tính bằng mili-giây
 * - model: tên model thực tế được dùng
 * - input: toàn bộ câu lệnh prompt, config, payload gửi đi
 * - output: phản hồi text đầy đủ, json phân tích, lỗi (nếu có)
 */
export function recordAiLog(logData) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const logs = getAiLogs();
    const now = new Date();
    const entry = {
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      formattedDate: now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      model: logData.model || 'chưa xác định',
      endpoint: logData.endpoint || '/api/generate',
      status: logData.status || (logData.statusCode >= 200 && logData.statusCode < 300 ? 'success' : 'error'),
      statusCode: logData.statusCode || 200,
      latencyMs: typeof logData.latencyMs === 'number' ? Math.round(logData.latencyMs) : 0,
      purpose: logData.purpose || 'Gọi API AI',
      source: logData.source || 'client',
      input: {
        prompt: logData.input?.prompt ?? (typeof logData.input === 'string' ? logData.input : ''),
        payload: sanitizeForLog(logData.input?.payload ?? null),
        config: sanitizeForLog(logData.input?.config ?? null),
        meta: sanitizeForLog(logData.input?.meta ?? null),
      },
      output: {
        rawText: sanitizeForLog(logData.output?.rawText ?? (typeof logData.output === 'string' ? logData.output : '')),
        parsedJson: sanitizeForLog(logData.output?.parsedJson ?? null),
        error: logData.output?.error ?? null,
        usage: logData.output?.usage ?? null,
        rawResponse: sanitizeForLog(logData.output?.rawResponse ?? null),
      },
    };

    const updated = [entry, ...logs].slice(0, MAX_LOGS_LIMIT);
    localStorage.setItem(ELS_AI_LOGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('els:ai_log_added', { detail: entry }));
    return entry;
  } catch (e) {
    console.error('[aiLogger] Lỗi lưu nhật ký gọi API:', e);
    return null;
  }
}

/**
 * Xóa sạch toàn bộ lịch sử cuộc gọi
 */
export function clearAiLogs() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(ELS_AI_LOGS_KEY);
    window.dispatchEvent(new CustomEvent('els:ai_logs_cleared'));
  } catch (e) {
    console.error('[aiLogger] Lỗi xóa nhật ký:', e);
  }
}

/**
 * Xuất file JSON toàn bộ nhật ký để người dùng tải về (đã khử trùng 100% API key và dữ liệu nhạy cảm)
 */
export function exportAiLogsJson() {
  const logs = getAiLogs();
  const sanitizedLogs = sanitizeForLog(logs);
  const dataStr = JSON.stringify(sanitizedLogs, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `els-ai-api-logs-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Kiểm tra kết nối API xem có hoạt động không (Ping Health Check)
 * Gọi API trực tiếp hoặc qua proxy và ghi nhận đầy đủ vào nhật ký.
 */
export async function testAiConnection(overrideConfig = null) {
  const config = overrideConfig ? { ...getAiConfig(), ...overrideConfig } : getAiConfig();
  const testPrompt = 'Chào bạn! Vui lòng phản hồi ngắn gọn đúng 1 chữ: PONG';
  const t0 = performance.now();

  // Nếu đang bật chế độ Mock
  if (config.forceMock) {
    const latencyMs = Math.round(performance.now() - t0) + 15;
    const entry = recordAiLog({
      model: `${config.model} (Giả lập Mock)`,
      endpoint: 'mock://local-engine',
      status: 'mock',
      statusCode: 200,
      latencyMs,
      purpose: 'Kiểm tra API (Chế độ Mock)',
      source: 'test-ping',
      input: { prompt: testPrompt, config },
      output: { rawText: 'PONG (Phản hồi mô phỏng Mock Engine)', parsedJson: null, error: null },
    });
    return {
      ok: true,
      isMock: true,
      latencyMs,
      model: config.model,
      text: 'PONG (Phản hồi mô phỏng Mock Engine)',
      statusCode: 200,
      logId: entry?.id,
    };
  }

  // Thử gọi qua endpoint serverless /api/generate
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: testPrompt, config }),
    });

    const data = await res.json().catch(() => ({}));
    const latencyMs = Math.round(performance.now() - t0);

    if (res.ok && data.ok) {
      const entry = recordAiLog({
        model: data.model || config.model,
        endpoint: data.endpoint || '/api/generate',
        status: 'success',
        statusCode: 200,
        latencyMs: data.latencyMs || latencyMs,
        purpose: 'Kiểm tra kết nối API (Ping Health Check)',
        source: 'test-ping',
        input: { prompt: testPrompt, config },
        output: {
          rawText: data.text || '',
          usage: data.usage || null,
          rawResponse: data.rawResponse || data,
          error: null,
        },
      });

      return {
        ok: true,
        latencyMs: data.latencyMs || latencyMs,
        model: data.model || config.model,
        text: data.text || '',
        statusCode: 200,
        rawResponse: data,
        logId: entry?.id,
      };
    }

    // Nếu proxy trả về lỗi nghiệp vụ (401, 500, 503...)
    if (res.status !== 404) {
      const errMsg = data.error || `HTTP ${res.status}`;
      const entry = recordAiLog({
        model: config.model,
        endpoint: '/api/generate',
        status: 'error',
        statusCode: res.status,
        latencyMs,
        purpose: 'Kiểm tra kết nối API (Thất bại)',
        source: 'test-ping',
        input: { prompt: testPrompt, config },
        output: {
          rawText: '',
          error: errMsg,
          rawResponse: data,
        },
      });

      return {
        ok: false,
        error: errMsg,
        latencyMs,
        model: config.model,
        statusCode: res.status,
        logId: entry?.id,
      };
    }
  } catch (proxyErr) {
    // Nếu lỗi mạng tới proxy hoặc proxy 404, thử gọi trực tiếp từ client nếu có API Key
    console.warn('[aiLogger] Proxy /api/generate không phản hồi, thử gọi trực tiếp từ client...', proxyErr.message);
  }

  // Gọi trực tiếp từ Client (Fallback)
  return callApiDirect(testPrompt, config, 'Kiểm tra kết nối API (Client Direct)', 'test-ping');
}

/**
 * Thực thi một prompt tự do bất kỳ trong Playground và ghi nhật ký
 */
export async function executePlaygroundCall(prompt, overrideConfig = null, purpose = 'Thử nghiệm prompt tự do') {
  const config = overrideConfig ? { ...getAiConfig(), ...overrideConfig } : getAiConfig();
  const t0 = performance.now();

  if (config.forceMock) {
    const latencyMs = Math.round(performance.now() - t0) + 25;
    const mockReply = `[MOCK ENGINE] Đây là phản hồi giả lập cho câu hỏi:\n"${prompt.slice(0, 100)}..."\n\nKết nối AI đang tắt hoặc chưa cấu hình API Key.`;
    const entry = recordAiLog({
      model: `${config.model} (Mock)`,
      endpoint: 'mock://local-engine',
      status: 'mock',
      statusCode: 200,
      latencyMs,
      purpose,
      source: 'playground',
      input: { prompt, config },
      output: { rawText: mockReply, parsedJson: null, error: null },
    });
    return {
      ok: true,
      isMock: true,
      latencyMs,
      model: config.model,
      text: mockReply,
      statusCode: 200,
      logId: entry?.id,
    };
  }

  // Ưu tiên qua proxy /api/generate
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, config }),
    });

    const data = await res.json().catch(() => ({}));
    const latencyMs = Math.round(performance.now() - t0);

    if (res.ok && data.ok) {
      let parsed = null;
      try {
        parsed = JSON.parse(data.text);
      } catch {
        // không phải JSON
      }

      const entry = recordAiLog({
        model: data.model || config.model,
        endpoint: data.endpoint || '/api/generate',
        status: 'success',
        statusCode: 200,
        latencyMs: data.latencyMs || latencyMs,
        purpose,
        source: 'playground',
        input: { prompt, config },
        output: {
          rawText: data.text || '',
          parsedJson: parsed,
          usage: data.usage || null,
          rawResponse: data.rawResponse || data,
          error: null,
        },
      });

      return {
        ok: true,
        latencyMs: data.latencyMs || latencyMs,
        model: data.model || config.model,
        text: data.text || '',
        parsedJson: parsed,
        statusCode: 200,
        rawResponse: data,
        logId: entry?.id,
      };
    }

    if (res.status !== 404) {
      const errMsg = data.error || `HTTP ${res.status}`;
      const entry = recordAiLog({
        model: config.model,
        endpoint: '/api/generate',
        status: 'error',
        statusCode: res.status,
        latencyMs,
        purpose,
        source: 'playground',
        input: { prompt, config },
        output: { rawText: '', error: errMsg, rawResponse: data },
      });

      return {
        ok: false,
        error: errMsg,
        latencyMs,
        model: config.model,
        statusCode: res.status,
        logId: entry?.id,
      };
    }
  } catch (proxyErr) {
    console.warn('[aiLogger] Proxy lỗi, chuyển sang gọi client direct...', proxyErr.message);
  }

  return callApiDirect(prompt, config, purpose, 'playground');
}

/**
 * Hàm gọi API trực tiếp từ trình duyệt khi không có máy chủ proxy
 */
async function callApiDirect(prompt, config, purpose, source) {
  const t0 = performance.now();
  const { apiKey, baseUrl, model, temperature, maxTokens, timeoutSec } = config;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const latencyMs = Math.round(performance.now() - t0);
    const err = 'Chưa cấu hình API Key. Vui lòng nhập API Key hợp lệ trong mục Cấu hình.';
    const entry = recordAiLog({
      model,
      endpoint: baseUrl,
      status: 'error',
      statusCode: 401,
      latencyMs,
      purpose,
      source,
      input: { prompt, config },
      output: { rawText: '', error: err },
    });
    return { ok: false, error: err, latencyMs, model, statusCode: 401, logId: entry?.id };
  }

  const isOpenAICompat = baseUrl.includes('/v1') && !baseUrl.includes('googleapis');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (timeoutSec || 20) * 1000);

  let url, headers, body;
  if (isOpenAICompat) {
    url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 2048,
    });
  } else {
    url = `${baseUrl.replace(/\/+$/, '')}/models/${model}:generateContent?key=${apiKey}`;
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: maxTokens ?? 2048 },
    });
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - t0);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${res.status}`;
      const entry = recordAiLog({
        model,
        endpoint: url,
        status: 'error',
        statusCode: res.status,
        latencyMs,
        purpose,
        source,
        input: { prompt, config, payload: body },
        output: { rawText: '', error: errMsg, rawResponse: errData },
      });
      return { ok: false, error: errMsg, latencyMs, model, statusCode: res.status, logId: entry?.id };
    }

    const data = await res.json();
    let text = '';
    if (isOpenAICompat) {
      text = data.choices?.[0]?.message?.content ?? '';
    } else {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // ignore
    }

    const entry = recordAiLog({
      model,
      endpoint: url,
      status: 'success',
      statusCode: 200,
      latencyMs,
      purpose,
      source,
      input: { prompt, config, payload: body },
      output: {
        rawText: text,
        parsedJson: parsed,
        usage: data.usage || null,
        rawResponse: data,
        error: null,
      },
    });

    return {
      ok: true,
      latencyMs,
      model,
      text,
      parsedJson: parsed,
      statusCode: 200,
      rawResponse: data,
      logId: entry?.id,
    };
  } catch (err) {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - t0);
    const errMsg = err.name === 'AbortError' ? `Quá thời gian chờ (${timeoutSec}s).` : (err.message || 'Lỗi mạng khi kết nối API.');
    const entry = recordAiLog({
      model,
      endpoint: url || baseUrl,
      status: 'error',
      statusCode: err.name === 'AbortError' ? 504 : 500,
      latencyMs,
      purpose,
      source,
      input: { prompt, config, payload: body },
      output: { rawText: '', error: errMsg },
    });
    return { ok: false, error: errMsg, latencyMs, model, statusCode: err.name === 'AbortError' ? 504 : 500, logId: entry?.id };
  }
}

