import { runAiGuard } from '../domain/aiGuard.js';
import { generateMockContent } from './mockAi.js';
import { TONES } from '../domain/elsSchema.js';
import { getAiConfig, recordAiLog } from './aiLogger.js';

/**
 * Khử trùng các thẻ delimiter trong prompt để chống Prompt Injection thoát khỏi vùng dữ liệu
 */
export function escapePromptField(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/<\/?(?:event_data|available_images|system|instruction|prompt)[^>]*>/gi, '')
    .trim();
}

/**
 * Xây dựng prompt chuẩn hóa với rào chắn chống Prompt Injection (Mục 7.5)
 * và tối ưu hóa nhận biết các Module và gán ảnh vào các trường phù hợp.
 */
export function buildPrompt(eventInfo, assets = []) {
  const { name, datetime, location, speakers, earlyBird, tone = TONES.PROFESSIONAL, imageCaptions, description: extraDescription } = eventInfo;

  let toneInstruction = 'Giọng văn chuyên nghiệp, uy tín, truyền cảm hứng.';
  if (tone === TONES.FRIENDLY) {
    toneInstruction = 'Giọng văn trẻ trung, hào hứng, gần gũi và giàu năng lượng.';
  } else if (tone === TONES.PREMIUM) {
    toneInstruction = 'Giọng văn sang trọng, đẳng cấp, tinh tế và nhấn mạnh đặc quyền.';
  }

  // Danh sách hình ảnh khả dụng kèm vai trò và chú thích
  const assetList = (assets && assets.length > 0)
    ? assets
    : (imageCaptions && Array.isArray(imageCaptions) ? imageCaptions.map((c, i) => ({ id: `img_${i + 1}`, role: 'other', caption: c })) : []);

  const imageDescriptions = assetList.length > 0
    ? assetList.map((a, i) => `- ID: "${escapePromptField(a.id || `ast_${i + 1}`)}"` + `, Vai trò: "${escapePromptField(a.role || 'other')}", Chú thích ảnh: "${escapePromptField(a.caption || 'Ảnh sự kiện')}"`).join('\n')
    : 'Chưa có ảnh tải lên (sử dụng ảnh minh họa mặc định)';

  return `Bạn là copywriter marketing sự kiện tiếng Việt chuyên nghiệp cho nền tảng Event Landing Studio.
Nhiệm vụ: Phân tích thông tin sự kiện để biên soạn nội dung landing page theo đúng quy chế: Bám sát thông tin đầu vào, tuyệt đối không bịa đặt thêm số liệu, giá vé, cam kết miễn phí, chứng chỉ hay thông tin ngoài dữ liệu được cung cấp.

<event_data>
- Tên sự kiện: ${escapePromptField(name)}
- Thời gian: ${escapePromptField(datetime)}
- Địa điểm: ${escapePromptField(location)}
- Diễn giả: ${escapePromptField(speakers)}
- Ưu đãi đăng ký sớm: ${escapePromptField(earlyBird) || 'Không có'}
- Mô tả thêm / Ghi chú đặc thù: ${escapePromptField(extraDescription) || 'Không có'}
- Giọng điệu hướng dẫn: ${toneInstruction}
</event_data>

<available_images>
${imageDescriptions}
</available_images>

YÊU CẦU NỘI DUNG:
1. Headline: Tiêu đề lôi cuốn, súc tích (10-12 từ) thể hiện chủ đề sự kiện.
2. Description: Đoạn mô tả cuốn hút từ 2-3 câu làm nổi bật giá trị cốt lõi.
3. Bullets: Đúng 3 gạch đầu dòng lợi ích thiết thực người tham dự nhận được từ nội dung và diễn giả.
4. Tự động đề xuất phong cách thiết kế:
   - recommendedPreset: chọn 1 trong ['techtalk', 'workshop', 'community', 'gala', 'compact']
   - recommendedSpeakerVariant: chọn 1 trong ['portrait-cards', 'trio-typographic', 'solo-spotlight']
   - colorTheme: chọn 1 trong ['purple', 'blue', 'emerald', 'amber', 'rose', 'dark']
   - designReasoning: 1 câu ngắn gọn giải thích lý do lựa chọn bố cục.
5. Phân bổ ảnh: Gán ID ảnh tương ứng vào heroImageId, venueImageId, giftImageId, speakerImageIds.
6. Ràng buộc nghiêm ngặt: Tuyệt đối không tự ý bịa đặt mã voucher, cam kết miễn phí/thu phí hoặc cấp chứng nhận nếu trong <event_data> không có thông tin này.

Trả về DUY NHẤT một khối JSON hợp lệ theo cấu trúc sau (không bọc trong markdown, không giải thích gì thêm):
{
  "headline": "Tiêu đề hấp dẫn, súc tích từ 10 đến 12 từ",
  "description": "Mô tả cuốn hút từ 2 đến 3 câu nhấn mạnh giá trị và lý do tham gia",
  "bullets": [
    "Lợi ích 1 nhận được khi tham dự",
    "Lợi ích 2 nhận được khi tham dự",
    "Lợi ích 3 nhận được khi tham dự"
  ],
  "recommendedPreset": "techtalk",
  "recommendedSpeakerVariant": "portrait-cards",
  "colorTheme": "purple",
  "designReasoning": "Giải thích lý do lựa chọn bố cục phù hợp với chủ đề sự kiện.",
  "imageAssignments": {
    "heroImageId": null,
    "venueImageId": null,
    "giftImageId": null,
    "contentImageId": null,
    "speakerImageIds": []
  }
}`;
}

/**
 * Gọi API backend qua /api/generate
 */
async function callApi(prompt, signal, config = null) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, config }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.error || `Lỗi máy chủ HTTP ${res.status}`);
    err.status = res.status;
    err.isMissingKey = errorData.isMissingKey;
    err.rawResponse = errorData;
    err.latencyMs = errorData.latencyMs;
    err.model = errorData.model;
    throw err;
  }

  const data = await res.json();
  return {
    text: data.text || '',
    model: data.model || config?.model,
    latencyMs: data.latencyMs,
    usage: data.usage || null,
    rawResponse: data.rawResponse || data,
    endpoint: data.endpoint || '/api/generate',
  };
}

/**
 * Gọi dự phòng client-side nếu chạy static mà không có proxy
 */
async function callClientDirect(prompt, signal, config = null) {
  const currentConfig = config || getAiConfig();
  const API_KEY = currentConfig.apiKey;
  const BASE_URL = currentConfig.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  const MODEL = currentConfig.model || 'gemini-1.5-flash';
  const temperature = currentConfig.temperature ?? 0.7;
  const maxTokens = currentConfig.maxTokens ?? 2048;

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const err = new Error('Chưa cấu hình API Key');
    err.isMissingKey = true;
    err.status = 401;
    throw err;
  }

  const isOpenAICompat = BASE_URL.includes('/v1') && !BASE_URL.includes('googleapis');
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

  const t0 = performance.now();
  const res = await fetch(url, { method: 'POST', headers, body, signal });
  const latencyMs = Math.round(performance.now() - t0);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.latencyMs = latencyMs;
    err.rawResponse = errData;
    err.model = MODEL;
    throw err;
  }

  const data = await res.json();
  let text = '';
  if (isOpenAICompat) {
    text = data.choices?.[0]?.message?.content ?? '';
  } else {
    text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  return {
    text,
    model: MODEL,
    latencyMs,
    usage: data.usage || null,
    rawResponse: data,
    endpoint: url,
  };
}

/**
 * Hàm điều phối chính sinh nội dung sự kiện:
 * - Có timeout theo config (mặc định 20s)
 * - Tự động đọc config từ AI Control (getAiConfig)
 * - Ghi nhận mọi lần gọi vào Nhật ký gọi API (recordAiLog)
 * - Fact guard kiểm tra chặt chẽ
 * - Tự động fallback sang Mock nếu không có key hoặc lỗi liên tục
 */
export async function generateEventContentWithGuard(eventInfo, assets = []) {
  const config = getAiConfig();
  const prompt = buildPrompt(eventInfo, assets);

  // Nếu người dùng bật chế độ Mock bắt buộc trong AI Control
  if (config.forceMock) {
    const mockData = generateMockContent(eventInfo, assets);
    recordAiLog({
      model: `${config.model} (Mock)`,
      endpoint: 'mock://local-engine',
      status: 'mock',
      statusCode: 200,
      latencyMs: 18,
      purpose: `Sinh nội dung sự kiện: "${eventInfo.name || 'Dự án'}" (Mock)`,
      source: 'event-generation',
      input: { prompt, config },
      output: { rawText: JSON.stringify(mockData, null, 2), parsedJson: mockData, error: null },
    });
    return mockData;
  }

  const timeoutMs = (config.timeoutSec || 20) * 1000;

  // Thử gọi AI thật (tối đa 2 lần: 1 lần gốc + 1 lần retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const t0 = performance.now();

    try {
      let callResult = null;
      try {
        // Ưu tiên gọi qua proxy /api/generate
        callResult = await callApi(prompt, controller.signal, config);
      } catch (proxyErr) {
        // Nếu proxy 404 (chạy preview tĩnh), thử gọi trực tiếp bằng client key
        if ((proxyErr.status === 404 || proxyErr.status === 502) && config.apiKey) {
          callResult = await callClientDirect(prompt, controller.signal, config);
        } else {
          throw proxyErr;
        }
      }

      clearTimeout(timer);
      const measuredLatency = callResult?.latencyMs || Math.round(performance.now() - t0);

      // Chạy qua aiGuard kiểm tra schema và chống bịa
      const guardResult = runAiGuard(callResult.text, eventInfo);
      if (guardResult.ok) {
        recordAiLog({
          model: callResult.model || config.model,
          endpoint: callResult.endpoint || '/api/generate',
          status: 'success',
          statusCode: 200,
          latencyMs: measuredLatency,
          purpose: `Sinh nội dung sự kiện: "${eventInfo.name || 'Dự án'}" (Thành công)`,
          source: 'event-generation',
          input: { prompt, config },
          output: {
            rawText: callResult.text,
            parsedJson: guardResult.data,
            usage: callResult.usage,
            rawResponse: callResult.rawResponse,
            error: null,
          },
        });

        return {
          ...guardResult.data,
          source: 'ai',
          model: callResult.model || config.model,
          generatedAt: new Date().toISOString(),
          tone: eventInfo.tone || TONES.PROFESSIONAL,
        };
      }

      console.warn(`[aiClient] Lần ${attempt} vi phạm aiGuard:`, guardResult.error);
      if (attempt === 2) {
        // Tuân thủ ADR-3, ADR-4 & TC-06: Báo lỗi minh bạch, KHÔNG tự động chuyển Mock âm thầm
        recordAiLog({
          model: callResult?.model || config.model,
          endpoint: callResult?.endpoint || '/api/generate',
          status: 'error',
          statusCode: 422,
          latencyMs: measuredLatency,
          purpose: `Sinh nội dung sự kiện: "${eventInfo.name || 'Dự án'}" (Vi phạm Guard)`,
          source: 'event-generation',
          input: { prompt, config },
          output: {
            rawText: callResult.text,
            error: `Vi phạm kiểm soát đầu ra AI (AI Guard): ${guardResult.error}`,
            parsedJson: null,
          },
        });
        const guardErr = new Error(`Nội dung AI không đạt tiêu chuẩn kiểm duyệt (${guardResult.error}). Vui lòng bấm "Thử lại" hoặc chủ động chọn "Dùng dữ liệu mô phỏng".`);
        guardErr.code = 'AI_GUARD_VIOLATION';
        guardErr.status = 422;
        throw guardErr;
      }
    } catch (err) {
      clearTimeout(timer);
      const measuredLatency = err.latencyMs || Math.round(performance.now() - t0);
      console.warn(`[aiClient] Lần ${attempt} thất bại:`, err.message);

      // Ghi nhật ký lỗi
      recordAiLog({
        model: err.model || config.model,
        endpoint: '/api/generate',
        status: 'error',
        statusCode: err.status || 500,
        latencyMs: measuredLatency,
        purpose: `Sinh nội dung sự kiện: "${eventInfo.name || 'Dự án'}" (Lần ${attempt} lỗi: ${err.message})`,
        source: 'event-generation',
        input: { prompt, config },
        output: {
          rawText: '',
          error: err.message,
          rawResponse: err.rawResponse || null,
        },
      });

      // Nếu thiếu API Key thì báo lỗi rõ ràng, KHÔNG tự ý chuyển Mock âm thầm (ADR-3, ADR-4)
      if (err.isMissingKey || err.message.includes('API Key') || err.status === 401 || err.status === 403) {
        const keyErr = new Error('Chưa cấu hình API Key hoặc API Key không hợp lệ. Vui lòng bấm "Thử lại" sau khi kiểm tra hoặc chủ động chọn "Dùng dữ liệu mô phỏng".');
        keyErr.code = 'MISSING_API_KEY';
        keyErr.status = 401;
        throw keyErr;
      }

      // Nếu đã hết số lần thử
      if (attempt === 2) {
        const netErr = new Error(`Không thể kết nối tới dịch vụ AI (${err.message}). Vui lòng kiểm tra mạng và bấm "Thử lại", hoặc chủ động chọn "Dùng dữ liệu mô phỏng".`);
        netErr.code = 'AI_NETWORK_ERROR';
        netErr.status = err.status || 500;
        throw netErr;
      }
    }
  }

  // Nếu kết thúc vòng lặp mà không thành công (tránh fallback âm thầm)
  throw new Error('Yêu cầu gọi AI không phản hồi kết quả hợp lệ. Vui lòng bấm "Thử lại" hoặc chọn "Dùng dữ liệu mô phỏng".');
}

export const generateAiContent = generateEventContentWithGuard;

