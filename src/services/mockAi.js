import { normalizeText, normalizeSpeakers } from '../domain/normalize.js';
import { TONES } from '../domain/elsSchema.js';
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
    headline = name;
    description = `Chào mừng quý vị đến với ${name} tại ${location}. Sự kiện mang đến những góc nhìn chiến lược độc quyền cùng ${mainSpeaker}, mở ra cơ hội bứt phá toàn diện.`;
    benefits = [
      `Tiếp cận tri thức và chiến lược cao cấp từ chuyên gia ${mainSpeaker}.`,
      `Giao lưu và mở rộng mối quan hệ trong mạng lưới khách mời chất lượng cao.`,
      earlyBird ? `Đặc quyền ưu đãi độc quyền: ${earlyBird}.` : 'Nhận bộ tài liệu phân tích chuyên sâu độc quyền tại sự kiện.',
    ];
  } else if (tone === TONES.FRIENDLY) {
    headline = name;
    description = `Đừng bỏ lỡ ${name} diễn ra tại ${location}! Cùng gặp gỡ ${mainSpeaker} để học hỏi, kết nối bạn bè và tích lũy những kinh nghiệm thực chiến cực kỳ bổ ích.`;
    benefits = [
      `Lắng nghe những câu chuyện và bài học thực tế từ ${mainSpeaker}.`,
      `Môi trường giao lưu cởi mở, kết nối với những người cùng đam mê.`,
      earlyBird ? `Ưu đãi siêu hấp dẫn: ${earlyBird}.` : 'Tham gia các hoạt động hỏi đáp và nhận quà lưu niệm từ sự kiện.',
    ];
  } else {
    // PROFESSIONAL (Mặc định)
    headline = name;
    description = `Sự kiện ${name} được tổ chức tại ${location} với sự đồng hành của ${mainSpeaker}. Chương trình cung cấp kiến thức thực chiến, cập nhật xu hướng mới nhất và giải pháp tối ưu cho người tham dự.`;
    benefits = [
      `Nắm vững phương pháp và công cụ thực chiến từ ${mainSpeaker}.`,
      `Mở rộng mạng lưới kết nối và học hỏi kinh nghiệm cùng cộng đồng.`,
      earlyBird ? `Ưu đãi dành riêng cho người đăng ký sớm: ${earlyBird}.` : 'Nhận toàn bộ tài liệu và slide thuyết trình sau sự kiện.',
    ];
  }

  // Tự động phân bổ ảnh vào từng module thích hợp (Chỉ gán Hero khi có ảnh sự kiện/poster, không lấy ảnh diễn giả/địa điểm/quà tặng làm Hero)
  const heroAsset = assets.find((a) => a.role === 'hero' || a.role === 'other') || null;
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

  const eventTimeStr = eventData.eventTime || eventData.time || '09:00';
  const eventDateStr = eventData.eventDate || eventData.date || 'theo thông báo';

  return {
    headline,
    description,
    benefits,
    bullets: benefits, // Tương thích cả 2 chuẩn
    recommendedPreset: inferredDesign.presetId,
    recommendedSpeakerVariant,
    colorTheme: inferredDesign.colorTheme,
    designReasoning: inferredDesign.reasoning,
    earlyBirdOffer: earlyBird || 'Ưu đãi dành cho người tham dự đăng ký sớm',
    faq: [
      { q: 'Sự kiện diễn ra vào thời gian nào?', a: `Chương trình diễn ra vào ngày ${eventDateStr} lúc ${eventTimeStr} (GMT+7).` },
      { q: 'Địa điểm tổ chức ở đâu?', a: `Sự kiện được tổ chức tại ${location}.` },
      { q: 'Ai là người chia sẻ trong chương trình?', a: `Chương trình có sự đồng hành và chia sẻ của ${mainSpeaker}.` },
    ],
    stats: [
      { num: '01', label: 'Sự kiện chuyên đề', sub: 'Nội dung thực chiến' },
      { num: speakers.length > 0 ? String(speakers.length) : '01', label: 'Diễn giả chia sẻ', sub: 'Kinh nghiệm thực tiễn' },
      { num: '100%', label: 'Tâm huyết tổ chức', sub: 'Chất lượng hàng đầu' },
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
