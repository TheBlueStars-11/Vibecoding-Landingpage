import { normalizeText, normalizeSpeakers } from '../domain/normalize.js';
import { TONES } from '../domain/schema.js';
import { inferPresetAndTheme } from '../domain/moduleSchema.js';

/**
 * Sinh nội dung mô phỏng dựa trên dữ liệu thật người dùng nhập theo chuẩn FDD
 */
export function generateMockContent(eventData = {}, assets = []) {
  const name = normalizeText(eventData.eventName || eventData.name) || 'Sự kiện đặc biệt';
  const speakers = normalizeSpeakers(eventData.speakers);
  const mainSpeaker = speakers.length > 0 ? speakers[0] : 'các chuyên gia đầu ngành';
  const location = normalizeText(eventData.venue || eventData.location) || 'Địa điểm tổ chức';
  const earlyBird = normalizeText(eventData.earlyBirdOffer || eventData.earlyBird);
  const tone = eventData.tone || TONES.PROFESSIONAL;

  // Tự động phân tích chủ đề sự kiện để chọn bố cục và phương pháp thiết kế
  const inferredDesign = inferPresetAndTheme(eventData);

  let headline = '';
  let description = '';
  let benefits = [];

  if (tone === TONES.PREMIUM) {
    headline = `Khám phá đỉnh cao cùng ${name}`;
    description = `Chào mừng quý vị đến với ${name} tại ${location}. Sự kiện mang đến những góc nhìn chiến lược độc quyền cùng ${mainSpeaker}, mở ra cơ hội bứt phá toàn diện.`;
    benefits = [
      `Tiếp cận tri thức và chiến lược cao cấp từ chuyên gia ${mainSpeaker}.`,
      `Giao lưu và mở rộng mối quan hệ trong mạng lưới khách mời chất lượng cao.`,
      earlyBird ? `Đặc quyền ưu đãi độc quyền: ${earlyBird}.` : 'Nhận bộ tài liệu phân tích chuyên sâu độc quyền tại sự kiện.',
    ];
  } else if (tone === TONES.FRIENDLY) {
    headline = `Tham gia ngay: ${name}!`;
    description = `Đừng bỏ lỡ ${name} diễn ra tại ${location}! Cùng gặp gỡ ${mainSpeaker} để học hỏi, kết nối bạn bè và tích lũy những kinh nghiệm thực chiến cực kỳ bổ ích.`;
    benefits = [
      `Lắng nghe những câu chuyện và bài học thực tế từ ${mainSpeaker}.`,
      `Môi trường giao lưu cởi mở, kết nối với những người cùng đam mê.`,
      earlyBird ? `Ưu đãi siêu hấp dẫn: ${earlyBird}.` : 'Tham gia các hoạt động hỏi đáp và nhận quà lưu niệm từ sự kiện.',
    ];
  } else {
    // PROFESSIONAL (Mặc định)
    headline = `${name} — Nâng tầm tri thức, đột phá tương lai`;
    description = `Sự kiện ${name} được tổ chức tại ${location} với sự đồng hành của ${mainSpeaker}. Chương trình cung cấp kiến thức thực chiến, cập nhật xu hướng mới nhất và giải pháp tối ưu cho người tham dự.`;
    benefits = [
      `Nắm vững phương pháp và công cụ thực chiến từ ${mainSpeaker}.`,
      `Mở rộng mạng lưới kết nối và học hỏi kinh nghiệm cùng cộng đồng.`,
      earlyBird ? `Ưu đãi dành riêng cho người đăng ký sớm: ${earlyBird}.` : 'Nhận toàn bộ tài liệu và chứng chỉ chứng nhận tham gia sự kiện.',
    ];
  }

  // Tự động phân bổ ảnh vào từng module thích hợp
  const heroAsset = assets.find((a) => a.role === 'hero') || assets[0];
  const venueAsset = assets.find((a) => a.role === 'venue');
  const speakerAssets = assets.filter((a) => a.role === 'speaker');
  const giftAsset = assets.find((a) => a.role === 'gift');
  const contentAsset = assets.find((a) => a.role === 'image_content');

  // Lựa chọn biến thể diễn giả thông minh dựa trên số lượng & hình ảnh
  let recommendedSpeakerVariant = 'portrait-cards';
  if (speakers.length === 1) {
    recommendedSpeakerVariant = 'solo-spotlight';
  } else if (speakers.length > 0 && speakers.length <= 3 && speakerAssets.length === 0 && tone === TONES.PREMIUM) {
    recommendedSpeakerVariant = 'trio-typographic';
  } else {
    recommendedSpeakerVariant = 'portrait-cards';
  }

  return {
    headline,
    description,
    benefits,
    bullets: benefits, // Tương thích cả 2 chuẩn
    recommendedPreset: inferredDesign.presetId,
    recommendedSpeakerVariant,
    colorTheme: inferredDesign.colorTheme,
    designReasoning: inferredDesign.reasoning,
    earlyBirdOffer: earlyBird || 'Tặng vé mời VIP và Ebook tài liệu độc quyền',
    couponCode: 'VIBE2026',
    faq: [
      { q: 'Sự kiện có thu phí tham dự không?', a: 'Sự kiện hoàn toàn miễn phí cho người đăng ký sớm và sinh viên.' },
      { q: 'Tôi có nhận được chứng chỉ sau buổi học không?', a: 'Có, toàn bộ người tham gia đầy đủ sẽ nhận chứng nhận điện tử sau sự kiện.' },
      { q: 'Tôi cần chuẩn bị gì khi đến tham dự?', a: 'Bạn nên mang theo laptop để cùng thực hành các bài tập demo trực tiếp.' },
    ],
    stats: [
      { num: '3+', label: 'Giờ nội dung thực chiến', sub: 'Từ lý thuyết đến ứng dụng' },
      { num: '150', label: 'Suất tham dự trực tiếp', sub: 'Hội trường chuẩn quốc tế' },
      { num: '100%', label: 'Miễn phí hoàn toàn', sub: 'Tài trợ bởi Ban Tổ Chức' },
    ],
    imageAssignments: {
      heroImageId: heroAsset?.id || null,
      venueImageId: venueAsset?.id || null,
      giftImageId: giftAsset?.id || null,
      contentImageId: contentAsset?.id || null,
      speakerImageIds: speakerAssets.map((s) => s.id),
    },
    source: 'mock',
    model: 'mock-engine',
    generatedAt: new Date().toISOString(),
    tone,
    notice: 'Bản demo vòng loại - Dữ liệu mô phỏng AI',
  };
}
