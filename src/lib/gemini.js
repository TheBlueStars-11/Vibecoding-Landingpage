const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = import.meta.env.VITE_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

// Tự động nhận diện loại API dựa theo BASE_URL
const isOpenAICompat = BASE_URL.includes('/v1') && !BASE_URL.includes('googleapis');

/**
 * Gọi API và trả về text thuần.
 * Hỗ trợ cả Google Gemini API lẫn OpenAI-compatible API.
 */
export async function generateText(prompt) {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Chưa cấu hình VITE_GEMINI_API_KEY trong file .env');
  }

  let url, headers, body;

  if (isOpenAICompat) {
    // ── OpenAI-compatible (vilao.ai, OpenRouter, v.v.) ──────────────
    url = `${BASE_URL}/chat/completions`;
    headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    };
    body = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1024,
    });
  } else {
    // ── Google Gemini API gốc ────────────────────────────────────────
    url = `${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`;
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
    });
  }

  const res = await fetch(url, { method: 'POST', headers, body });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();

  // Parse response theo từng format
  if (isOpenAICompat) {
    return data.choices?.[0]?.message?.content ?? '';
  } else {
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}

/**
 * Sinh nội dung marketing cho sự kiện.
 */
export async function generateEventContent(eventInfo) {
  const { name, datetime, location, speakers, earlyBird } = eventInfo;

  const prompt = `Bạn là copywriter marketing chuyên nghiệp người Việt Nam.
Hãy viết nội dung cho landing page sự kiện với thông tin sau:
- Tên sự kiện: ${name}
- Thời gian: ${datetime}
- Địa điểm: ${location}
- Diễn giả: ${speakers}
- Ưu đãi đăng ký sớm: ${earlyBird}

Trả về ĐÚNG định dạng JSON sau (không có markdown, không có backtick):
{
  "headline": "Tiêu đề hấp dẫn, ngắn gọn (tối đa 12 từ)",
  "description": "Mô tả sự kiện 2-3 câu, cuốn hút, nhấn mạnh giá trị",
  "bullets": [
    "Lợi ích 1 khi tham dự (1 câu ngắn)",
    "Lợi ích 2 khi tham dự (1 câu ngắn)",
    "Lợi ích 3 khi tham dự (1 câu ngắn)"
  ]
}`;

  const raw = await generateText(prompt);
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}
