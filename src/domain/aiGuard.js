import { normalizeText } from './normalize.js';

/**
 * Bóc tách và parse chuỗi JSON an toàn từ phản hồi thô của LLM
 */
export function cleanAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Phản hồi từ AI rỗng.');
  }

  // 1. Loại bỏ các thẻ markdown code block
  let cleaned = rawText
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  // 2. Trích xuất khối JSON đầu tiên bắt đầu từ '{' đến '}' cuối cùng
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Dữ liệu AI trả về không đúng định dạng JSON: ${err.message}`);
  }
}

/**
 * Kiểm tra tính hợp lệ của Schema nội dung sự kiện
 */
export function validateAiSchema(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu không phải là một đối tượng JSON.'] };
  }

  // 1. Headline: 10 - 120 ký tự
  const headline = normalizeText(data.headline);
  if (!headline) {
    errors.push('Thiếu tiêu đề (headline).');
  } else if (headline.length < 10 || headline.length > 120) {
    errors.push(`Độ dài tiêu đề không phù hợp (${headline.length} ký tự, yêu cầu từ 10 - 120 ký tự).`);
  }

  // 2. Description: 40 - 500 ký tự
  const description = normalizeText(data.description);
  if (!description) {
    errors.push('Thiếu phần mô tả (description).');
  } else if (description.length < 40 || description.length > 500) {
    errors.push(`Độ dài mô tả không phù hợp (${description.length} ký tự, yêu cầu từ 40 - 500 ký tự).`);
  }

  // 3. Bullets: Phải là mảng đúng 3 phần tử
  const bullets = Array.isArray(data.bullets) ? data.bullets.map(normalizeText).filter(Boolean) : [];
  if (bullets.length !== 3) {
    errors.push(`Số lượng lợi ích tham dự phải đúng 3 mục (hiện tại có ${bullets.length} mục).`);
  } else {
    bullets.forEach((b, idx) => {
      if (b.length < 8 || b.length > 150) {
        errors.push(`Lợi ích thứ ${idx + 1} có độ dài không hợp lệ (${b.length} ký tự).`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      ...data,
      headline,
      description,
      bullets,
      benefits: bullets,
    },
  };
}

/**
 * Fact Guard & Output Control (L1 - L5):
 * Kiểm tra chéo chống AI bịa đặt dữ liệu nhạy cảm, bảo vệ tính xác thực và chất lượng ngôn ngữ.
 */
export function checkFactGuard(aiContent, inputData = {}) {
  const warnings = [];
  const safeAi = aiContent || {};
  const safeInput = inputData || {};
  const fullAiText = `${safeAi.headline || ''} ${safeAi.description || ''} ${(safeAi.bullets || []).join(' ')}`;

  // 1. [L3 Safety] Chống chèn thẻ HTML / XSS Script / Dangerous URI / Inline Event Handlers
  if (
    /<script|iframe|object|embed|<[a-z][\s\S]*>/i.test(fullAiText) ||
    /javascript:|data:text\/html|vbscript:/i.test(fullAiText) ||
    /on(error|load|click|mouse|key)\s*=/i.test(fullAiText)
  ) {
    return { pass: false, reason: 'Nội dung chứa thẻ HTML, mã script hoặc URI nguy hiểm.' };
  }

  // 2. [L5 Language Guard] Chống chứa các giá trị lỗi chưa biên dịch (undefined, null, NaN, [object Object])
  if (/\b(undefined|null|NaN)\b/i.test(fullAiText) || fullAiText.includes('[object Object]')) {
    return { pass: false, reason: 'Nội dung chứa giá trị lỗi chưa được giải quyết (undefined/null/NaN).' };
  }

  // 3. [L5 Language Guard] Chống ký tự lỗi mã hóa (corrupted characters)
  if (fullAiText.includes('\ufffd') || fullAiText.includes('\u0000')) {
    return { pass: false, reason: 'Nội dung chứa ký tự lỗi mã hóa UTF-8.' };
  }

  // 4. [L5 Language Guard] Kiểm tra dấu thanh tiếng Việt đầy đủ (chuẩn tiếng Việt có dấu)
  const viAccentRegex = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
  const inputEventName = safeInput.name || safeInput.eventName || '';
  if (viAccentRegex.test(inputEventName)) {
    if (!viAccentRegex.test(safeAi.headline || '') || !viAccentRegex.test(safeAi.description || '')) {
      return { pass: false, reason: 'Nội dung tiếng Việt phải có dấu thanh chuẩn xác, không được dùng tiếng Việt không dấu.' };
    }
  }

  // Gom toàn bộ thông tin đầu vào để so khớp tính xác thực
  const fullInputText = [
    safeInput.name || safeInput.eventName || '',
    safeInput.location || safeInput.venue || '',
    safeInput.earlyBird || safeInput.earlyBirdOffer || '',
    safeInput.description || '',
    safeInput.speakers || '',
    safeInput.agenda || '',
  ].join(' ');

  // 5. [L4 Truthfulness] Chống bịa đặt URL / Link không có trong đầu vào
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urlsInAi = fullAiText.match(urlRegex) || [];
  for (const url of urlsInAi) {
    if (!fullInputText.includes(url)) {
      return { pass: false, reason: `AI tự ý chèn đường dẫn lạ không có trong thông tin: ${url}` };
    }
  }

  // 6. [L4 Truthfulness] Chống bịa đặt mức ưu đãi / chiết khấu phần trăm lạ
  // Ví dụ: AI sinh "giảm 50%" trong khi người dùng nhập "Giảm 20%" hoặc không có ưu đãi đó
  const discountRegex = /(?:giảm|chiết khấu|ưu đãi)\s*(\d{1,3})%/gi;
  let match;
  while ((match = discountRegex.exec(fullAiText)) !== null) {
    const percentStr = `${match[1]}%`;
    if (!fullInputText.includes(percentStr)) {
      return {
        pass: false,
        reason: `AI tự ý bịa đặt tỷ lệ chiết khấu/ưu đãi (${match[0]}) không có trong dữ liệu đầu vào.`,
      };
    }
  }

  // 7. [L4 Truthfulness] Chống bịa đặt tên diễn giả lạ không có trong danh sách
  if (safeInput.speakers && typeof safeInput.speakers === 'string' && safeInput.speakers.trim()) {
    const rawSpeakerNames = safeInput.speakers.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    // Nếu AI nhắc đến tên diễn giả lạ bằng cụm "diễn giả [Họ Tên]"
    const speakerMentionRegex = /diễn giả\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,3})/g;
    let spkMatch;
    while ((spkMatch = speakerMentionRegex.exec(fullAiText)) !== null) {
      const detectedName = spkMatch[1].toLowerCase();
      const isKnown = rawSpeakerNames.some((n) => n.includes(detectedName) || detectedName.includes(n));
      if (!isKnown) {
        return {
          pass: false,
          reason: `AI tự ý bịa đặt diễn giả (${spkMatch[1]}) không có trong danh sách đăng ký.`,
        };
      }
    }
  }

  // 8. [L4 Truthfulness] Chống bịa đặt mã voucher / coupon / mã ưu đãi lạ
  const couponRegex = /(?:mã\s+(?:giảm\s*giá|voucher|coupon|ưu\s*đãi)|code\s*[:=]?)\s*[:=]?\s*["']?([A-Z0-9_-]{3,15})["']?/gi;
  let cpMatch;
  while ((cpMatch = couponRegex.exec(fullAiText)) !== null) {
    const code = cpMatch[1];
    const hasCodeInInput = fullInputText.includes(code);
    const mentionsVoucher = /(?:voucher|coupon|mã\s+giảm|mã\s+ưu\s+đãi)/i.test(fullInputText);
    if (!hasCodeInInput && !mentionsVoucher) {
      return {
        pass: false,
        reason: `AI tự ý bịa đặt mã voucher/ưu đãi (${cpMatch[0]}) không có trong dữ liệu đầu vào.`,
      };
    }
  }

  // 9. [L4 Truthfulness] Chống khẳng định "100% miễn phí / tài trợ toàn phần" nếu input không nêu
  const freeRegex = /(?:100%\s*miễn\s*phí|tài\s*trợ\s*toàn\s*phần|hoàn\s*toàn\s*miễn\s*phí|miễn\s*phí\s*100%|miễn\s*phí\s*hoàn\s*toàn)/i;
  if (freeRegex.test(fullAiText)) {
    const inputMentionsFree = /(?:miễn\s*phí|free|0\s*(?:đ|vnđ|đồng)|không\s*thu\s*phí|tài\s*trợ)/i.test(fullInputText);
    if (!inputMentionsFree) {
      return {
        pass: false,
        reason: 'AI tự ý khẳng định sự kiện miễn phí 100% / tài trợ toàn phần khi dữ liệu đầu vào không nêu.',
      };
    }
  }

  // 10. [L4 Truthfulness] Chống cam kết "cấp chứng chỉ / chứng nhận" nếu input không nhắc tới
  const certRegex = /(?:cấp|nhận|trao|được)\s+(?:chứng\s*chỉ|chứng\s*nhận|certificate)|(?:chứng\s*chỉ|chứng\s*nhận|certificate)\s+(?:hoàn\s*thành|tham\s*gia|quốc\s*tế|xác\s*nhận)/i;
  if (certRegex.test(fullAiText)) {
    const inputMentionsCert = /(?:chứng\s*chỉ|chứng\s*nhận|certificate|chứng\s*thực)/i.test(fullInputText);
    if (!inputMentionsCert) {
      return {
        pass: false,
        reason: 'AI tự ý cam kết cấp chứng chỉ / chứng nhận khi dữ liệu đầu vào không nhắc tới.',
      };
    }
  }

  return { pass: true, warnings };
}

/**
 * Hàm điều phối toàn bộ quá trình kiểm định đầu ra AI
 */
export function runAiGuard(rawText, inputData) {
  try {
    // 1. Parse JSON
    const parsed = cleanAndParseJson(rawText);

    // 2. Schema check
    const schemaResult = validateAiSchema(parsed);
    if (!schemaResult.isValid) {
      return {
        ok: false,
        error: `Lỗi cấu trúc dữ liệu AI: ${schemaResult.errors.join('; ')}`,
      };
    }

    // 3. Fact Guard
    const factResult = checkFactGuard(schemaResult.data, inputData);
    if (!factResult.pass) {
      return {
        ok: false,
        error: `Phát hiện vi phạm tính xác thực: ${factResult.reason}`,
      };
    }

    return {
      ok: true,
      data: schemaResult.data,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    };
  }
}
