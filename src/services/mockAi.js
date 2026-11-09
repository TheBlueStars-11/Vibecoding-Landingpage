import { normalizeText, normalizeSpeakers } from '../domain/normalize.js';
import { TONES } from '../domain/elsSchema.js';
import { inferPresetAndTheme } from '../domain/moduleSchema.js';

/**
 * Cắt chuỗi an toàn đảm bảo nằm trong ngưỡng schema (8..145 ký tự cho bullet, 20..300 cho description)
 */
function clampText(text, maxLen = 140) {
  const clean = normalizeText(text);
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3).trim()}...`;
}

/**
 * Sinh nội dung mô phỏng dựa trên dữ liệu thật người dùng nhập theo chuẩn FDD
 * Đảm bảo 3 tiêu chí: Không bịa đặt - Tận dụng thông tin - Tận dụng module
 */
export function generateMockContent(eventData = {}, assets = []) {
  const name = normalizeText(eventData.eventName || eventData.name) || 'Sự kiện đặc biệt';
  const speakers = normalizeSpeakers(eventData.speakers);
  const mainSpeaker = speakers.length > 0 ? speakers[0] : 'các diễn giả của chương trình';
  const allSpeakersStr = speakers.length > 0 ? speakers.join(', ') : mainSpeaker;
  const location = normalizeText(eventData.venue || eventData.location) || 'địa điểm tổ chức sự kiện';
  const earlyBird = normalizeText(eventData.earlyBirdOffer || eventData.earlyBird);
  const extraDesc = normalizeText(eventData.description);
  const hasExtraDesc = extraDesc.length > 0;
  const tone = eventData.tone || TONES.PROFESSIONAL;

  const rawAgenda = Array.isArray(eventData.agenda) ? eventData.agenda : [];
  const agendaTitles = rawAgenda
    .map((a) => (typeof a === 'string' ? normalizeText(a) : normalizeText(a?.title)))
    .filter(Boolean);

  // Tự động phân tích chủ đề sự kiện để chọn bố cục và phương pháp thiết kế
  const inferredDesign = inferPresetAndTheme(eventData);

  const eventTimeStr = eventData.eventTime || eventData.time || '09:00';
  const eventDateStr = eventData.eventDate || eventData.date || 'theo thông báo';

  const headline = name;
  let description = '';
  let benefits = [];
  let audience = [];
  let bentoHighlights = [];
  let organizer = null;
  let faq = [];

  if (hasExtraDesc) {
    // TẬN DỤNG THÔNG TIN TỐI ĐA KHI NGƯỜI DÙNG NHẬP "MÔ TẢ THÊM SỰ KIỆN"
    const descSentences = extraDesc
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10);

    const leadDesc = descSentences.slice(0, 2).join(' ') || extraDesc;
    description = clampText(
      `${name} diễn ra tại ${location} cùng ${allSpeakersStr}. ${leadDesc}`,
      295
    );

    const b1Raw = descSentences[0]
      ? descSentences[0]
      : `Trực tiếp trao đổi và tiếp cận nội dung chuyên sâu cùng ${allSpeakersStr}.`;
    const b2Raw = descSentences[1]
      ? descSentences[1]
      : agendaTitles[0]
        ? `Tham gia phiên chuyên đề trọng tâm: ${agendaTitles[0]}.`
        : `Kết nối trực tiếp cùng cộng đồng tham dự tại ${location}.`;
    const b3Raw = earlyBird
      ? `Quyền lợi đăng ký sớm: ${earlyBird.replace(/\.$/, '')}.`
      : descSentences[2] || `Hoàn tất đăng ký trực tuyến để nhận mã QR check-in tham dự chương trình.`;

    benefits = [
      clampText(b1Raw.length >= 12 ? b1Raw : `${b1Raw} tại ${name}.`, 140),
      clampText(b2Raw.length >= 12 ? b2Raw : `${b2Raw} cùng ${mainSpeaker}.`, 140),
      clampText(b3Raw.length >= 12 ? b3Raw : `Tham dự chương trình tại ${location}.`, 140),
    ];

    // Trích xuất thông tin đối tượng tham dự & tiêu điểm Bento từ Mô tả thêm
    audience = [
      {
        badge: 'Trọng tâm 01',
        title: `Người quan tâm chủ đề ${clampText(name, 48)}`,
        desc: clampText(descSentences[0] || extraDesc, 160),
      },
      {
        badge: 'Trọng tâm 02',
        title: `Trao đổi trực tiếp cùng ${clampText(mainSpeaker, 42)}`,
        desc: clampText(
          agendaTitles.length > 0
            ? `Theo dõi các phiên chuyên đề: ${agendaTitles.slice(0, 2).join('; ')}.`
            : descSentences[1] || extraDesc,
          160
        ),
      },
      {
        badge: 'Trọng tâm 03',
        title: 'Kết nối & Mở rộng hợp tác thực tiễn',
        desc: clampText(
          descSentences[1] || descSentences[2] || `Giao lưu trực tiếp tại ${location} và nhận ưu đãi đăng ký sớm.`,
          160
        ),
      },
    ];

    bentoHighlights = [
      {
        tag: '01 / ĐIỂM NHẤN CHƯƠNG TRÌNH',
        title: clampText(descSentences[0] || name, 75),
        desc: clampText(extraDesc, 180),
      },
      {
        tag: '02 / QUYỀN LỢI ĐĂNG KÝ SỚM',
        title: 'Ưu đãi dành cho người tham dự',
        desc: earlyBird || benefits[2],
      },
      {
        tag: '03 / DIỄN GIẢ ĐỒNG HÀNH',
        title: `Chia sẻ bởi ${clampText(allSpeakersStr, 55)}`,
        desc: agendaTitles[0] ? `Trọng tâm: ${agendaTitles[0]}` : benefits[0],
      },
      {
        tag: '04 / KHÔNG GIAN & LỊCH TRÌNH',
        title: `${rawAgenda.length || 1} phiên nội dung tại sự kiện`,
        desc: `Tổ chức lúc ${eventTimeStr} ngày ${eventDateStr} tại ${location}.`,
      },
    ];

    // Trích xuất email / hotline từ Mô tả thêm nếu người dùng có nhập
    const emailMatch = extraDesc.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = extraDesc.match(/(?:0|\+84)[\d\s.-]{8,13}\d/);
    organizer = {
      name: eventData.organizerName || `Ban Tổ Chức ${name}`,
      tagline: clampText(descSentences[descSentences.length - 1] || extraDesc, 140),
      email: emailMatch ? emailMatch[0] : null,
      hotline: phoneMatch ? phoneMatch[0].trim() : null,
      venue: location,
      hours: `${eventTimeStr} · Ngày ${eventDateStr}`,
    };

    faq = [
      {
        q: 'Sự kiện diễn ra vào thời gian và địa điểm nào?',
        a: `Chương trình diễn ra vào ngày ${eventDateStr} lúc ${eventTimeStr} (GMT+7) tại ${location}.`,
      },
      {
        q: 'Nội dung trọng tâm và đối tượng tham dự của sự kiện là gì?',
        a: extraDesc,
      },
      {
        q: 'Ai là người chia sẻ trong chương trình?',
        a: `Chương trình có sự đồng hành và chia sẻ của ${allSpeakersStr}.`,
      },
      ...(earlyBird
        ? [
            {
              q: 'Quyền lợi khi đăng ký tham dự sớm là gì?',
              a: `Người tham dự đăng ký sớm được hưởng quyền lợi: ${earlyBird}.`,
            },
          ]
        : []),
    ];
  } else {
    // KHÔNG BỊA ĐẶT KHI NGƯỜI DÙNG BỎ TRỐNG "MÔ TẢ THÊM SỰ KIỆN"
    // Chỉ tổng hợp thuần túy từ các trường bắt buộc đã nhập (Tên, Ngày giờ, Địa điểm, Diễn giả, Ưu đãi sớm, Lịch trình)
    if (tone === TONES.PREMIUM) {
      description = clampText(
        `Chào mừng quý vị đến với ${name} tổ chức vào lúc ${eventTimeStr} ngày ${eventDateStr} tại ${location}, với sự tham gia chia sẻ của ${allSpeakersStr}.`,
        295
      );
    } else if (tone === TONES.FRIENDLY) {
      description = clampText(
        `Cùng tham gia ${name} diễn ra vào lúc ${eventTimeStr} ngày ${eventDateStr} tại ${location} và lắng nghe chia sẻ từ ${allSpeakersStr}.`,
        295
      );
    } else {
      description = clampText(
        `Sự kiện ${name} được tổ chức vào lúc ${eventTimeStr} ngày ${eventDateStr} tại ${location} với sự đồng hành chia sẻ của ${allSpeakersStr}.`,
        295
      );
    }

    const benefit1 = speakers.length > 0
      ? `Trực tiếp lắng nghe phần chia sẻ chuyên đề từ ${allSpeakersStr}.`
      : `Tham dự các phiên nội dung chính thức trong khuôn khổ ${name}.`;

    const benefit2 = agendaTitles.length > 0
      ? `Theo dõi ${agendaTitles.length} phiên chương trình tổ chức tại ${location}.`
      : `Tham gia trực tiếp chương trình vào lúc ${eventTimeStr} ngày ${eventDateStr} tại ${location}.`;

    const benefit3 = earlyBird
      ? `Quyền lợi đăng ký sớm: ${earlyBird.replace(/\.$/, '')}.`
      : `Đăng ký trực tuyến trên trang để nhận mã vé QR check-in tại ${location}.`;

    benefits = [
      clampText(benefit1, 140),
      clampText(benefit2, 140),
      clampText(benefit3, 140),
    ];

    faq = [
      {
        q: 'Sự kiện diễn ra vào thời gian nào?',
        a: `Chương trình diễn ra vào ngày ${eventDateStr} lúc ${eventTimeStr} (GMT+7).`,
      },
      {
        q: 'Địa điểm tổ chức ở đâu?',
        a: `Sự kiện được tổ chức tại ${location}.`,
      },
      {
        q: 'Ai là diễn giả chia sẻ trong chương trình?',
        a: `Chương trình có sự tham gia chia sẻ của ${allSpeakersStr}.`,
      },
      ...(earlyBird
        ? [
            {
              q: 'Ưu đãi dành cho người đăng ký sớm là gì?',
              a: `${earlyBird}`,
            },
          ]
        : []),
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

  // Ánh xạ ảnh diễn giả chính xác chống gán chéo
  const rawSpeakersList = Array.isArray(eventData.speakersList)
    ? eventData.speakersList
    : (Array.isArray(eventData.speakers)
      ? eventData.speakers
      : (speakers.length > 0 ? speakers.map((name, i) => ({ id: `spk_${i + 1}`, name })) : []));

  const cleanSpkName = (n = '') => String(n).toLowerCase().replace(/^(ts\.|ths\.|ông|bà|dr\.)\s+/i, '').trim();

  const mappedAiSpeakers = rawSpeakersList.map((spk, idx) => {
    const spkName = typeof spk === 'string' ? spk : spk?.name || '';
    const cleanName = cleanSpkName(spkName);
    const spkId = typeof spk === 'object' ? spk?.id : null;

    // Ưu tiên 1: khớp speakerRef hoặc caption
    const matchedAsset = speakerAssets.find((a) => {
      if (spkId && a.speakerRef && a.speakerRef === spkId) return true;
      if (cleanName.length >= 2 && a.caption && cleanSpkName(a.caption).includes(cleanName)) return true;
      return false;
    }) || (!speakerAssets.some((a) => a.caption && cleanSpkName(a.caption).length >= 3 && cleanSpkName(a.caption) !== cleanName) ? speakerAssets[idx] : null);

    return {
      name: spkName,
      title: typeof spk === 'object' ? spk?.title || '' : '',
      avatarAssetId: matchedAsset?.id || null,
    };
  });

  const capacityNum = Number(eventData.capacity || 0);
  const stats = [
    {
      num: String(rawAgenda.length > 0 ? rawAgenda.length : 1).padStart(2, '0'),
      label: 'Phiên chương trình',
      sub: 'Lịch trình công bố',
    },
    {
      num: String(speakers.length > 0 ? speakers.length : 1).padStart(2, '0'),
      label: 'Diễn giả chia sẻ',
      sub: 'Đồng hành tại sự kiện',
    },
    ...(capacityNum > 0
      ? [{ num: String(capacityNum), label: 'Chỉ tiêu tham dự', sub: location }]
      : [{ num: eventTimeStr, label: `Khai mạc (${eventDateStr})`, sub: location }]),
  ];

  return {
    headline,
    description,
    benefits,
    bullets: benefits, // Tương thích cả 2 chuẩn
    speakers: mappedAiSpeakers,
    recommendedPreset: inferredDesign.presetId,
    recommendedSpeakerVariant,
    colorTheme: inferredDesign.colorTheme,
    designReasoning: inferredDesign.reasoning,
    earlyBirdOffer: earlyBird || '',
    faq,
    stats,
    audience,
    bentoHighlights,
    organizer,
    imageAssignments: {
      heroImageId: heroAsset?.id || null,
      venueImageId: venueAsset?.id || null,
      giftImageId: giftAsset?.id || null,
      contentImageId: contentAsset?.id || null,
      speakerImageIds: mappedAiSpeakers.map((s) => s.avatarAssetId),
    },
    source: 'mock',
    model: 'mock-engine',
    generatedAt: new Date().toISOString(),
    tone,
    notice: 'Bản demo vòng loại - Dữ liệu mô phỏng AI',
  };
}
