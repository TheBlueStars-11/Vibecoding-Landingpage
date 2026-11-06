/**
 * @file sampleAssets.js
 * Danh mục ảnh mẫu chất lượng cao (ảnh chân dung AI cho diễn giả, poster sự kiện,
 * không gian hội trường và bộ quà tặng giải thưởng) phục vụ thử nghiệm và điền mẫu nhanh
 * theo yêu cầu kiểm thử và quy chế cuộc thi Đề số 08.
 */

import { createAssetImage, ASSET_ROLES, generateId } from './elsSchema.js';

export const SAMPLE_ASSET_DEFINITIONS = [
  {
    idSuffix: 'hero_poster',
    role: ASSET_ROLES.OTHER,
    url: '/sample-assets/event_poster.svg',
    caption: 'Poster chính thức Hội thảo AI & Vibe Coding Vietnam 2026',
    width: 1200,
    height: 630,
    sizeKB: 14,
  },
  {
    idSuffix: 'spk_an',
    role: ASSET_ROLES.SPEAKER,
    url: '/sample-assets/speaker_1.jpg',
    caption: 'Chân dung TS. Nguyễn Văn An - Viện trưởng Viện Nghiên cứu Trí tuệ Nhân tạo',
    width: 1024,
    height: 1024,
    sizeKB: 686,
    speakerIndex: 0,
  },
  {
    idSuffix: 'spk_phuong',
    role: ASSET_ROLES.SPEAKER,
    url: '/sample-assets/speaker_2.jpg',
    caption: 'Chân dung ThS. Trần Thị Mai Phương - Lead AI Architect @ TechCorp Global',
    width: 1024,
    height: 1024,
    sizeKB: 642,
    speakerIndex: 1,
  },
  {
    idSuffix: 'spk_minh',
    role: ASSET_ROLES.SPEAKER,
    url: '/sample-assets/speaker_3.jpg',
    caption: 'Chân dung Ông Lê Hoàng Minh - Chuyên gia Thiết kế Hệ thống & Vibe Coder',
    width: 1024,
    height: 1024,
    sizeKB: 725,
    speakerIndex: 2,
  },
  {
    idSuffix: 'venue_nic',
    role: ASSET_ROLES.VENUE,
    url: '/sample-assets/venue_auditorium.svg',
    caption: 'Không gian hội trường Tầng 3 NIC Innovation Hub 150 chỗ ngồi',
    width: 800,
    height: 500,
    sizeKB: 8,
  },
  {
    idSuffix: 'gift_awards',
    role: ASSET_ROLES.GIFT,
    url: '/sample-assets/prizes_awards.svg',
    caption: 'Bộ quà tặng Ebook Vibe Coding trị giá 500.000đ và cúp vinh danh',
    width: 800,
    height: 500,
    sizeKB: 12,
  },
];

/**
 * Sinh danh sách 6 ảnh mẫu đầy đủ đã gắn projectId và speakerRef tương ứng
 * @param {string} projectId ID của dự án hiện tại
 * @param {Array<string>} speakerIds Danh sách ID diễn giả để liên kết ảnh
 * @returns {Array<import('./elsSchema.js').AssetImage>}
 */
export function createDefaultSampleAssets(projectId, speakerIds = []) {
  return SAMPLE_ASSET_DEFINITIONS.map((def) => {
    const speakerRef = def.speakerIndex !== undefined && speakerIds[def.speakerIndex]
      ? speakerIds[def.speakerIndex]
      : null;

    return createAssetImage({
      id: generateId(`ast_${def.idSuffix}`),
      projectId,
      dataUrl: def.url,
      caption: def.caption,
      role: def.role,
      speakerRef,
      width: def.width,
      height: def.height,
      sizeKB: def.sizeKB,
    });
  });
}

