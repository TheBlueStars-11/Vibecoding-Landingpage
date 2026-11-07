/**
 * @file api/generate.js
 * Serverless function (Vercel / Node.js) giấu hoàn toàn API key khỏi client bundle.
 */

import { ensureMethod, ensurePayloadSize, sanitizeEndpointUrl, sendError, sendSuccess } from './_lib/http.js';

export default async function handler(req, res) {
  // Chỉ cho phép phương thức POST
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  // Giới hạn kích thước payload ≤ 16KB
  if (!ensurePayloadSize(req, res, 16384)) {
    return;
  }

  const { prompt, config } = req.body || {};

  // Đọc biến môi trường từ server-side hoặc ghi đè từ client config nếu được truyền
  const API_KEY = config?.apiKey || process.env.AI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const BASE_URL = config?.baseUrl || process.env.AI_BASE_URL || process.env.VITE_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  const MODEL = config?.model || process.env.AI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
  const temperature = typeof config?.temperature === 'number' ? config.temperature : 0.7;
  const maxTokens = typeof config?.maxTokens === 'number' ? config.maxTokens : 2048;
  const timeoutMs = (typeof config?.timeoutSec === 'number' ? config.timeoutSec : 20) * 1000;

  const startTime = Date.now();

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    return sendError(res, 'Dịch vụ AI chưa được cấu hình API key trên máy chủ.', 503, {
      isMissingKey: true,
      latencyMs: Date.now() - startTime,
    });
  }

  if (!prompt || typeof prompt !== 'string') {
    return sendError(res, 'Thiếu nội dung prompt.', 400, {
      latencyMs: Date.now() - startTime,
    });
  }

  const isOpenAICompat = BASE_URL.includes('/v1') && !BASE_URL.includes('googleapis');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let url, headers, body;

    if (isOpenAICompat) {
      url = `${BASE_URL.replace(/\/+$/, '')}/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      };
      body = JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      });
    } else {
      url = `${BASE_URL.replace(/\/+$/, '')}/models/${MODEL}:generateContent?key=${API_KEY}`;
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const sanitizedEndpoint = sanitizeEndpointUrl(url);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${response.status} từ nhà cung cấp AI`;
      return sendError(res, errMsg, response.status, {
        latencyMs,
        model: MODEL,
        rawResponse: errData,
        endpoint: sanitizedEndpoint,
      });
    }

    const data = await response.json();
    let text = '';
    if (isOpenAICompat) {
      text = data.choices?.[0]?.message?.content ?? '';
    } else {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    return sendSuccess(res, {
      text,
      model: MODEL,
      latencyMs,
      usage: data.usage || null,
      rawResponse: data,
      endpoint: sanitizedEndpoint,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return sendError(res, `Yêu cầu tới dịch vụ AI bị quá thời gian (${Math.round(timeoutMs / 1000)}s).`, 504, {
        latencyMs,
        model: MODEL,
      });
    }
    return sendError(res, err.message || 'Lỗi kết nối tới dịch vụ AI.', 500, {
      latencyMs,
      model: MODEL,
    });
  }
}
