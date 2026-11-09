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
    .replace(/<\/?(?:event_data|available_images|available_speaker_images|other_event_images|system|instruction|prompt)[^>]*>/gi, '')
    .trim();
}

/**
 * Xây dựng prompt chuẩn hóa với rào chắn chống Prompt Injection (Mục 7.5)
 * và tối ưu hóa nhận biết các Module và gán ảnh vào các trường phù hợp.
 */
export function buildPrompt(eventInfo, assets = []) {
  const { name, datetime, location, speakers, earlyBird, agenda, tone = TONES.PROFESSIONAL, imageCaptions, description: extraDescription } = eventInfo;

  let toneInstruction = 'Giọng văn chuyên nghiệp, uy tín, truyền cảm hứng.';
  if (tone === TONES.FRIENDLY) {
    toneInstruction = 'Giọng văn trẻ trung, hào hứng, gần gũi và giàu năng lượng.';
  } else if (tone === TONES.PREMIUM) {
    toneInstruction = 'Giọng văn sang trọng, đẳng cấp, tinh tế và nhấn mạnh đặc quyền.';
  }

  const cleanExtraDesc = escapePromptField(extraDescription);
  const hasExtraDesc = Boolean(cleanExtraDesc.length > 0);
  const agendaText = Array.isArray(agenda)
    ? agenda.map((a) => (typeof a === 'string' ? a : `${a.time || ''} ${a.title || ''}`.trim())).filter(Boolean).join('; ')
    : escapePromptField(agenda);

  // Danh sách chi tiết từng diễn giả kèm ID và chức danh
  const rawSpeakersList = Array.isArray(eventInfo.speakersList)
    ? eventInfo.speakersList
    : (Array.isArray(eventInfo.speakers)
      ? eventInfo.speakers
      : (typeof speakers === 'string' && speakers
        ? speakers.split(',').map((s, i) => ({ id: `spk_${i + 1}`, name: s.trim(), title: '' })).filter((s) => s.name)
        : []));

  const speakerLines = rawSpeakersList.length > 0
    ? rawSpeakersList.map((s, i) => `  ${i + 1}. [Speaker ID: "${escapePromptField(s.id || `spk_${i + 1}`)}"] Tên: "${escapePromptField(s.name)}"${s.title ? `, Chức danh: "${escapePromptField(s.title)}"` : ''}`).join('\n')
    : (typeof speakers === 'string' ? escapePromptField(speakers) : 'Không có thông tin diễn giả');

  // Danh sách hình ảnh khả dụng kèm vai trò và chú thích
  const assetList = (assets && assets.length > 0)
    ? assets
    : (imageCaptions && Array.isArray(imageCaptions) ? imageCaptions.map((c, i) => ({ id: `img_${i + 1}`, role: 'other', caption: c })) : []);

  const speakerAssets = assetList.filter((a) => a.role === 'speaker');
  const otherAssets = assetList.filter((a) => a.role !== 'speaker');

  const speakerAssetDescriptions = speakerAssets.length > 0
    ? speakerAssets.map((a, i) => `  - [Asset ID: "${escapePromptField(a.id || `ast_spk_${i + 1}`)}"] Chú thích/Mô tả ảnh: "${escapePromptField(a.caption || 'Chân dung diễn giả')}" (Vai trò: speaker)`).join('\n')
    : '  (Chưa có ảnh diễn giả tải lên - sử dụng avatar chữ cái monogram)';

  const otherAssetDescriptions = otherAssets.length > 0
    ? otherAssets.map((a, i) => `  - [Asset ID: "${escapePromptField(a.id || `ast_${i + 1}`)}"] Chú thích: "${escapePromptField(a.caption || 'Ảnh sự kiện')}", Vai trò: "${escapePromptField(a.role || 'other')}"`).join('\n')
    : '  (Không có ảnh khác)';

  const extraDescInstruction = hasExtraDesc
    ? `Người dùng CÓ cung cấp "Mô tả thêm / Ghi chú đặc thù". Hãy TẬN DỤNG TỐI ĐA thông tin trong mục này để điền đầy đủ description, bullets, faq (4 câu hỏi sát thực tế), audience (3 nhóm đối tượng tham dự trích từ mô tả thêm), bentoHighlights (4 điểm nhấn cốt lõi trích từ mô tả thêm) và organizer (thông tin đơn vị tổ chức/liên hệ nếu có trong mô tả thêm).`
    : `Người dùng BỎ TRỐNG "Mô tả thêm / Ghi chú đặc thù". TUYỆT ĐỐI KHÔNG BỊA ĐẶT thông tin ngoài các trường đã nhập. Chỉ tổng hợp description, bullets và faq thuần túy từ Tên sự kiện, Thời gian, Địa điểm, Diễn giả, Ưu đãi đăng ký sớm và Lịch trình; đồng thời trả về "audience": [], "bentoHighlights": [], "organizer": null để hệ thống tự động cắt giảm các module mở rộng.`;

  return `Bạn là copywriter marketing sự kiện tiếng Việt chuyên nghiệp cho nền tảng Event Landing Studio.
Nhiệm vụ: Phân tích thông tin sự kiện để biên soạn nội dung landing page theo đúng 3 tiêu chí: KHÔNG BỊA ĐẶT - TẬN DỤNG THÔNG TIN - TẬN DỤNG MODULE.

<event_data>
- Tên sự kiện: ${escapePromptField(name)}
- Thời gian: ${escapePromptField(datetime)}
- Địa điểm: ${escapePromptField(location)}
- Diễn giả khách mời:
${speakerLines}
- Ưu đãi đăng ký sớm: ${escapePromptField(earlyBird) || 'Không có'}
- Lịch trình: ${escapePromptField(agendaText) || 'Theo chương trình'}
- Mô tả thêm / Ghi chú đặc thù: ${cleanExtraDesc || 'Không có'}
- Giọng điệu hướng dẫn: ${toneInstruction}
</event_data>

<available_images>
* DANH SÁCH ẢNH DIỄN GIẢ (Dùng để gán chính xác avatarAssetId cho từng diễn giả):
${speakerAssetDescriptions}

* DANH SÁCH ẢNH KHÁC (Poster / Địa điểm / Quà tặng):
${otherAssetDescriptions}
</available_images>

YÊU CẦU NỘI DUNG:
1. Headline: Giữ nguyên chính xác Tên sự kiện trong <event_data>.
2. Description: Đoạn mô tả từ 2-3 câu (tối đa 300 ký tự) tổng hợp trung thực từ <event_data>.
3. Bullets: Đúng 3 gạch đầu dòng lợi ích thiết thực (mỗi dòng 15-140 ký tự) bám sát diễn giả, lịch trình, ưu đãi sớm và mô tả thêm.
4. Quy tắc xử lý Mô tả thêm: ${extraDescInstruction}
5. Tự động đề xuất phong cách thiết kế:
   - recommendedPreset: chọn 1 trong ['techtalk', 'workshop', 'community', 'gala', 'compact']
   - recommendedSpeakerVariant: chọn 1 trong ['portrait-cards', 'trio-typographic', 'solo-spotlight']
   - colorTheme: chọn 1 trong ['purple', 'blue', 'emerald', 'amber', 'rose', 'dark']
   - designReasoning: 1 câu ngắn gọn giải thích lý do lựa chọn bố cục và module.
6. RÀNG BUỘC BẮT BUỘC VỀ ẢNH VÀ DIỄN GIẢ (CHỐNG LỆCH ẢNH & GÁN CHÉO):
   - Trong mảng "speakers": Với mỗi diễn giả trong <event_data>, hãy đối chiếu họ tên diễn giả với phần chú thích của ảnh trong mục DANH SÁCH ẢNH DIỄN GIẢ.
   - Bắt buộc trả về đúng trường "avatarAssetId" là Asset ID tương ứng của diễn giả đó nếu chú thích ảnh khớp tên hoặc thông tin của diễn giả. Nếu không có ảnh nào khớp, BẮT BUỘC để "avatarAssetId": null (tuyệt đối không gán ảnh của diễn giả này cho diễn giả khác).
   - Trong "imageAssignments":
     + heroImageId: ID ảnh sự kiện/poster (chỉ gán nếu có ảnh vai trò hero hoặc other; tuyệt đối không lấy ảnh diễn giả làm hero).
     + venueImageId: ID ảnh địa điểm (vai trò venue).
     + giftImageId: ID ảnh quà tặng/voucher (vai trò gift).
     + speakerImageIds: Mảng các Asset ID của diễn giả theo đúng thứ tự mảng speakers (hoặc null nếu không có).
7. Ràng buộc nghiêm ngặt: Tuyệt đối không tự ý bịa đặt mã voucher, cam kết miễn phí/thu phí, quà tặng hay cấp chứng nhận nếu trong <event_data> không có thông tin này.

Trả về DUY NHẤT một khối JSON hợp lệ theo cấu trúc sau (không bọc trong markdown, không giải thích gì thêm):
{
  "headline": "${escapePromptField(name) || 'Tên sự kiện'}",
  "description": "Mô tả từ 2 đến 3 câu bám sát dữ liệu đầu vào",
  "bullets": [
    "Lợi ích 1 trích xuất từ dữ liệu sự kiện",
    "Lợi ích 2 trích xuất từ dữ liệu sự kiện",
    "Lợi ích 3 trích xuất từ dữ liệu sự kiện"
  ],
  "speakers": [
    {
      "name": "Họ và tên diễn giả",
      "title": "Chức danh",
      "avatarAssetId": "Asset ID chính xác từ DANH SÁCH ẢNH DIỄN GIẢ hoặc null"
    }
  ],
  "faq": [
    { "q": "Câu hỏi thường gặp 1?", "a": "Câu trả lời xác thực từ dữ liệu sự kiện" },
    { "q": "Câu hỏi thường gặp 2?", "a": "Câu trả lời xác thực từ dữ liệu sự kiện" },
    { "q": "Câu hỏi thường gặp 3?", "a": "Câu trả lời xác thực từ dữ liệu sự kiện" }
  ],
  "audience": [
    {
      "badge": "Nhóm 01",
      "title": "Tên nhóm đối tượng (ví dụ: Kỹ sư phần mềm & Sinh viên CNTT)",
      "desc": "Mô tả chi tiết lý do và mục tiêu tham dự phù hợp với chương trình"
    }
  ],
  "bentoHighlights": [
    {
      "tag": "01 / GIÁ TRỊ TRỌNG TÂM",
      "title": "Tên tiêu điểm chính",
      "desc": "Mô tả ngắn gọn về điểm nhấn nổi bật"
    }
  ],
  "organizer": null,
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

