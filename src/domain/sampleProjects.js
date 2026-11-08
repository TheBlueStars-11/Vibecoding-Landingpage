/**
 * @file sampleProjects.js
 * Bộ 3 Dự án mẫu hệ thống luôn được lưu sẵn trong ứng dụng.
 * Bao quát 3 kịch bản thực tế của người dùng để thể hiện trọn vẹn thế mạnh của Event Landing Studio:
 *   1. Mẫu 1 (Đầy đủ 6 ảnh): Hội nghị Công nghệ AI & Vibe Coding (6 ảnh nguồn, 3 diễn giả, lịch trình sáng/chiều, QR vé).
 *   2. Mẫu 2 (Không có ảnh - 0 ảnh): Diễn đàn Chiến lược Quản trị Doanh nghiệp SME (Thuần Typography, Avatar chữ cái & Bản đồ SVG thông minh).
 *   3. Mẫu 3 (Ảnh chọn lọc & Form tùy biến - 2 ảnh): Ngày hội Khởi nghiệp Sinh viên (1 diễn giả Spotlight + 1 ảnh quà tặng, tự động bù bản đồ hội trường, trường Form tùy chỉnh).
 */

import {
  PROJECT_STATUS,
  FIELD_TYPES,
  ASSET_ROLES,
  createProject,
  createAssetImage,
  createRegistrationRecord,
  createDefaultFormFields,
} from './elsSchema.js';
import { createModuleInstance } from './moduleSchema.js';

export const SAMPLE_PROJECT_IDS = [
  'prj_sample_ai_summit',
  'prj_sample_biz_strategy',
  'prj_sample_student_fest',
];

/**
 * Tạo chuỗi ngày YYYY-MM-DD trong tương lai (cách hôm nay N ngày)
 * Đảm bảo bộ đếm ngược (Countdown) và kiểm tra ngày tương lai luôn hoạt động ở mọi thời điểm mở ứng dụng.
 */
export function getFutureDateOffset(daysAhead = 21) {
  const target = new Date(Date.now() + daysAhead * 86400 * 1000);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Khởi tạo danh sách 3 dự án mẫu hệ thống kèm ảnh nguồn (assets) và đơn đăng ký mẫu (registrations)
 */
export function buildSystemSampleProjects() {
  const dateSummit = getFutureDateOffset(18);
  const dateSummitEarly = getFutureDateOffset(10);

  const dateBiz = getFutureDateOffset(28);
  const dateBizEarly = getFutureDateOffset(15);

  const dateStudent = getFutureDateOffset(35);
  const dateStudentEarly = getFutureDateOffset(20);

  // ============================================================================
  // DỰ ÁN MẪU 1: ĐẦY ĐỦ 6 ẢNH NGUỒN (TECH CONFERENCE & QR CHECK-IN)
  // ============================================================================
  const p1Id = 'prj_sample_ai_summit';
  const p1Assets = [
    createAssetImage({
      id: 'img_s1_poster',
      projectId: p1Id,
      dataUrl: '/sample-assets/event_poster.svg',
      caption: 'Poster chính thức Hội nghị Công nghệ AI & Vibe Coding Vietnam 2026',
      role: ASSET_ROLES.OTHER,
      width: 1200,
      height: 675,
      sizeKB: 4,
    }),
    createAssetImage({
      id: 'img_s1_spk1',
      projectId: p1Id,
      dataUrl: '/sample-assets/speaker_1.jpg',
      caption: 'Chân dung diễn giả TS. Nguyễn Văn An - Giám đốc Nghiên cứu AI',
      role: ASSET_ROLES.SPEAKER,
      speakerRef: 'spk_s1_1',
      width: 640,
      height: 640,
      sizeKB: 82,
    }),
    createAssetImage({
      id: 'img_s1_spk2',
      projectId: p1Id,
      dataUrl: '/sample-assets/speaker_2.jpg',
      caption: 'Chân dung diễn giả ThS. Trần Thị Mai Phương - Principal Frontend Architect',
      role: ASSET_ROLES.SPEAKER,
      speakerRef: 'spk_s1_2',
      width: 640,
      height: 640,
      sizeKB: 76,
    }),
    createAssetImage({
      id: 'img_s1_spk3',
      projectId: p1Id,
      dataUrl: '/sample-assets/speaker_3.jpg',
      caption: 'Chân dung diễn giả Ông Lê Hoàng Minh - Lead AI Engineer',
      role: ASSET_ROLES.SPEAKER,
      speakerRef: 'spk_s1_3',
      width: 640,
      height: 640,
      sizeKB: 85,
    }),
    createAssetImage({
      id: 'img_s1_venue',
      projectId: p1Id,
      dataUrl: '/sample-assets/venue_auditorium.svg',
      caption: 'Không gian Hội trường lớn Trung tâm Đổi mới Sáng tạo Quốc gia (NIC)',
      role: ASSET_ROLES.VENUE,
      width: 1200,
      height: 750,
      sizeKB: 4,
    }),
    createAssetImage({
      id: 'img_s1_gift',
      projectId: p1Id,
      dataUrl: '/sample-assets/prizes_awards.svg',
      caption: 'Bộ quà tặng Ebook thực chiến, cúp lưu niệm và giải thưởng bốc thăm',
      role: ASSET_ROLES.GIFT,
      width: 1000,
      height: 650,
      sizeKB: 4,
    }),
  ];

  const p1ModuleLayout = [
    createModuleInstance('nav', { variant: 'bar', styles: { padding: 'compact', background: 'default' } }),
    createModuleInstance('hero', { variant: 'image-right', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('countdown', { variant: 'boxes', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('bento', { variant: 'grid-asymmetric', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('stats', { variant: 'row', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('audience', { variant: 'persona-cards', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('benefits', { variant: 'cards', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('speakers', { variant: 'portrait-cards', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('agenda', { variant: 'timeline-speaker', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('venue', { variant: 'image-left', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('offer_banner', { variant: 'card-image-left', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('faq', { variant: 'accordion', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('form', { variant: 'split-offer', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('organizer', { variant: 'card', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('footer', { variant: 'rich-3col', styles: { padding: 'normal', background: 'dark' } }),
  ];

  const p1Project = createProject({
    id: p1Id,
    name: 'Hội nghị Công nghệ AI & Vibe Coding Vietnam 2026',
    slug: 'hoi-nghi-ai-vibe-coding-2026',
    status: PROJECT_STATUS.PUBLISHED,
    isSample: true,
    sampleTag: 'Mẫu 1 · Đủ 6 ảnh & Có mô tả thêm chi tiết',
    sampleScenario: 'Có đầy đủ Mô tả thêm sự kiện và 6 ảnh nguồn: Khai thác tối đa 15 module (Hero ảnh, Bento, Đối tượng tham dự, Thống kê, Ban tổ chức, FAQ) và danh sách vé QR.',
    colorTheme: 'rose',
    modulePreset: 'techtalk',
    moduleLayout: p1ModuleLayout,
    alternatingBg: true,
    event: {
      eventName: 'Hội nghị Công nghệ AI & Vibe Coding Vietnam 2026',
      eventDate: dateSummit,
      eventTime: '08:30',
      venue: 'Hội trường Lớn Tầng 5 - Trung tâm Đổi mới Sáng tạo Quốc gia (NIC), Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
      venueAddress: 'Tòa nhà NIC, Ngõ 7 Tôn Thất Thuyết, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
      venueNotes: 'Hội trường trang bị màn hình LED Cong 8K, hệ thống dịch cabin song ngữ và quầy check-in QR tự động.',
      description: 'Hội nghị chuyên sâu thường niên dành cho kỹ sư phần mềm, kiến trúc sư hệ thống (Solution Architect), Tech Lead và Product Manager. Chương trình tập trung thực hành quy trình Vibe Coding kết hợp Agentic AI để rút ngắn 70% thời gian phát triển giao diện đa thiết bị, kiểm chứng chất lượng tự động (Fact Guard) và bảo mật ứng dụng web. Sự kiện do Cộng đồng Kỹ sư AI Việt Nam phối hợp cùng Trung tâm Đổi mới Sáng tạo Quốc gia (NIC) tổ chức, hỗ trợ đại biểu qua email sukien.ai@nic.gov.vn và hotline 024 3795 9999.',
      capacity: 150,
      speakers: [
        {
          id: 'spk_s1_1',
          name: 'TS. Nguyễn Văn An',
          title: 'Giám đốc Nghiên cứu AI — Viện Công nghệ Số Việt Nam',
          assetId: 'img_s1_spk1',
        },
        {
          id: 'spk_s1_2',
          name: 'ThS. Trần Thị Mai Phương',
          title: 'Principal Frontend Architect — Cố vấn Kiến trúc Hệ thống',
          assetId: 'img_s1_spk2',
        },
        {
          id: 'spk_s1_3',
          name: 'Ông Lê Hoàng Minh',
          title: 'Lead AI Product Engineer — Chuyên gia Tự động hóa',
          assetId: 'img_s1_spk3',
        },
      ],
      earlyBirdOffer: 'Miễn phí 100% vé tham dự tiêu chuẩn và tặng trọn bộ Ebook "AI Vibe Coding Playbook 2026" kèm 150+ mẫu Prompt thực chiến cho 100 người đăng ký đầu tiên.',
      earlyBirdDeadline: `${dateSummitEarly}T23:59`,
      agenda: [
        { id: 'ag_s1_1', time: '08:30', title: 'Đón tiếp đại biểu, Quét mã QR Check-in nhận bộ Kit & Giao lưu Teabreak sáng' },
        { id: 'ag_s1_2', time: '09:00', title: 'Keynote 1: Kỷ nguyên Vibe Coding — Khi Kỹ sư Phần mềm làm chủ Agentic AI (TS. Nguyễn Văn An)' },
        { id: 'ag_s1_3', time: '10:15', title: 'Keynote 2: Kiến trúc Giao diện Đa thiết bị và Hệ thống Kiểm chứng Sự thật (ThS. Trần Thị Mai Phương)' },
        { id: 'ag_s1_4', time: '11:15', title: 'Live Coding Demo: Xây dựng ứng dụng sự kiện hoàn chỉnh trong 15 phút (Ông Lê Hoàng Minh)' },
        { id: 'ag_s1_5', time: '13:30', title: 'Tọa đàm Bàn tròn: Chiến lược nâng cao hiệu suất đội ngũ kỹ thuật với AI' },
        { id: 'ag_s1_6', time: '15:00', title: 'Bốc thăm trúng thưởng công nghệ, Trao quà lưu niệm & Networking tự do' },
      ],
    },
    formFields: createDefaultFormFields(),
    ai: {
      source: 'ai',
      generatedAt: '2026-11-08T08:00:00.000Z',
      headline: 'Hội nghị Công nghệ AI & Vibe Coding Vietnam 2026',
      description: 'Hội nghị chuyên sâu thường niên tại Trung tâm Đổi mới Sáng tạo Quốc gia (NIC) dành cho kỹ sư phần mềm, Solution Architect, Tech Lead và Product Manager. Thực hành quy trình Vibe Coding kết hợp Agentic AI giúp rút ngắn 70% thời gian phát triển giao diện đa thiết bị và kiểm chứng chất lượng tự động.',
      benefits: [
        'Thực hành quy trình Vibe Coding kết hợp Agentic AI rút ngắn 70% thời gian phát triển giao diện đa thiết bị và kiểm chứng Fact Guard.',
        'Giao lưu chuyên sâu cùng TS. Nguyễn Văn An, ThS. Trần Thị Mai Phương và Ông Lê Hoàng Minh qua 6 phiên Keynote & Live Demo.',
        'Miễn phí 100% vé tham dự tiêu chuẩn và tặng Ebook "AI Vibe Coding Playbook 2026" kèm 150+ mẫu Prompt cho 100 người đăng ký đầu tiên.',
      ],
      stats: [
        { num: '06', label: 'Phiên chuyên đề sáng & chiều', sub: 'Keynote, Live Demo & Tọa đàm' },
        { num: '03', label: 'Diễn giả chuyên gia AI', sub: 'Chia sẻ kinh nghiệm thực chiến' },
        { num: '70%', label: 'Rút ngắn thời gian phát triển', sub: 'Quy trình Agentic AI & Fact Guard' },
        { num: '150', label: 'Đại biểu kỹ thuật tham dự', sub: 'Tại Hội trường Lớn Tầng 5 NIC' },
      ],
      audience: [
        {
          badge: 'Software Engineers',
          title: 'Kỹ sư Phần mềm & Fullstack Developer',
          desc: 'Trực tiếp thực hành quy trình Vibe Coding kết hợp Agentic AI để rút ngắn 70% thời gian phát triển ứng dụng web.',
        },
        {
          badge: 'Architects & Leads',
          title: 'Solution Architect & Tech Lead',
          desc: 'Nắm vững kiến trúc giao diện đa thiết bị, hệ thống kiểm chứng chất lượng tự động (Fact Guard) và bảo mật ứng dụng.',
        },
        {
          badge: 'Product Teams',
          title: 'Product Manager & Kỹ sư Sản phẩm AI',
          desc: 'Trải nghiệm quy trình xây dựng ứng dụng sự kiện hoàn chỉnh trong 15 phút và chiến lược nâng cao hiệu suất đội ngũ.',
        },
      ],
      bentoHighlights: [
        {
          tag: '01 / CÔNG NGHỆ TRỌNG TÂM',
          title: 'Vibe Coding & Agentic AI rút ngắn 70% thời gian phát triển',
          desc: 'Tập trung thực hành phát triển giao diện đa thiết bị, kiểm chứng chất lượng tự động (Fact Guard) và bảo mật ứng dụng web.',
        },
        {
          tag: '02 / ƯU ĐÃI ĐĂNG KÝ SỚM',
          title: 'Miễn phí 100% vé & Ebook 150+ Prompt',
          desc: 'Tặng trọn bộ Ebook "AI Vibe Coding Playbook 2026" kèm 150+ mẫu Prompt thực chiến cho 100 người đăng ký đầu tiên.',
        },
        {
          tag: '03 / LIVE CODING 15 PHÚT',
          title: 'Trình diễn trực tiếp cùng 3 chuyên gia đầu ngành',
          desc: 'Theo dõi Keynote và màn Live Coding từ TS. Nguyễn Văn An, ThS. Trần Thị Mai Phương và Ông Lê Hoàng Minh.',
        },
        {
          tag: '04 / TỔ CHỨC TẠI NIC HÀ NỘI',
          title: '150 Đại biểu tại Hội trường Lớn Tầng 5 NIC',
          desc: 'Cộng đồng Kỹ sư AI Việt Nam phối hợp cùng Trung tâm Đổi mới Sáng tạo Quốc gia (NIC) tổ chức.',
        },
      ],
      organizer: {
        name: 'Cộng đồng Kỹ sư AI Việt Nam & Trung tâm Đổi mới Sáng tạo Quốc gia (NIC)',
        tagline: 'Đơn vị tổ chức Hội nghị Công nghệ AI & Vibe Coding Vietnam 2026 tại Tòa nhà NIC, Cầu Giấy, Hà Nội.',
        email: 'sukien.ai@nic.gov.vn',
        hotline: '024 3795 9999',
        venue: 'Hội trường Lớn Tầng 5 - Tòa nhà NIC, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
        hours: `08:30 - 16:30 · Ngày ${dateSummit}`,
      },
      faq: [
        {
          q: 'Sự kiện diễn ra vào thời gian và địa điểm nào?',
          a: `Chương trình diễn ra vào ngày ${dateSummit} lúc 08:30 (GMT+7) tại Hội trường Lớn Tầng 5 - Trung tâm Đổi mới Sáng tạo Quốc gia (NIC), Tôn Thất Thuyết, Cầu Giấy, Hà Nội.`,
        },
        {
          q: 'Đối tượng tham dự và nội dung trọng tâm của hội nghị là gì?',
          a: 'Hội nghị dành cho kỹ sư phần mềm, Solution Architect, Tech Lead và Product Manager, tập trung thực hành quy trình Vibe Coding kết hợp Agentic AI để rút ngắn 70% thời gian phát triển giao diện, kiểm chứng Fact Guard và bảo mật web.',
        },
        {
          q: 'Người đăng ký sớm nhận được quyền lợi gì?',
          a: '100 người đăng ký đầu tiên trước hạn ưu đãi được miễn phí 100% vé tham dự tiêu chuẩn và nhận bộ Ebook "AI Vibe Coding Playbook 2026" kèm 150+ mẫu Prompt thực chiến.',
        },
        {
          q: 'Liên hệ Ban tổ chức qua kênh nào khi cần hỗ trợ?',
          a: 'Đại biểu có thể liên hệ Cộng đồng Kỹ sư AI Việt Nam & NIC qua email sukien.ai@nic.gov.vn hoặc hotline 024 3795 9999.',
        },
      ],
      recommendedPreset: 'techtalk',
      recommendedSpeakerVariant: 'portrait-cards',
      colorTheme: 'rose',
      imageAssignments: {
        hero: 'img_s1_poster',
        heroImageId: 'img_s1_poster',
        venue: 'img_s1_venue',
        venueImageId: 'img_s1_venue',
        gift: 'img_s1_gift',
        giftImageId: 'img_s1_gift',
        speakers: [
          { speakerIndex: 0, assetId: 'img_s1_spk1' },
          { speakerIndex: 1, assetId: 'img_s1_spk2' },
          { speakerIndex: 2, assetId: 'img_s1_spk3' },
        ],
      },
      edited: false,
    },
  });

  const p1Registrations = [
    createRegistrationRecord({
      id: 'reg_s1_1',
      code: 'DK-AI2601',
      projectId: p1Id,
      values: {
        fld_name: 'Nguyễn Minh Tuấn',
        fld_email: 'tuan.nguyen@techviet.vn',
        fld_phone: '0912345678',
      },
      displayName: 'Nguyễn Minh Tuấn',
      identityKey: 'tuan.nguyen@techviet.vn',
      source: 'landing',
      checkedIn: true,
      checkInTime: '2026-11-08T01:35:00.000Z',
    }),
    createRegistrationRecord({
      id: 'reg_s1_2',
      code: 'DK-AI2602',
      projectId: p1Id,
      values: {
        fld_name: 'Phạm Hoàng Bảo Ngọc',
        fld_email: 'ngoc.pham@fpt.com.vn',
        fld_phone: '0987654321',
      },
      displayName: 'Phạm Hoàng Bảo Ngọc',
      identityKey: 'ngoc.pham@fpt.com.vn',
      source: 'landing',
      checkedIn: true,
      checkInTime: '2026-11-08T01:42:00.000Z',
    }),
    createRegistrationRecord({
      id: 'reg_s1_3',
      code: 'DK-AI2603',
      projectId: p1Id,
      values: {
        fld_name: 'Trần Quốc Khánh',
        fld_email: 'khanh.tran@vng.com.vn',
        fld_phone: '0909112233',
      },
      displayName: 'Trần Quốc Khánh',
      identityKey: 'khanh.tran@vng.com.vn',
      source: 'landing',
      checkedIn: true,
      checkInTime: '2026-11-08T01:50:00.000Z',
    }),
    createRegistrationRecord({
      id: 'reg_s1_4',
      code: 'DK-AI2604',
      projectId: p1Id,
      values: {
        fld_name: 'Lê Thu Hà',
        fld_email: 'ha.le@vinai.io',
        fld_phone: '0933445566',
      },
      displayName: 'Lê Thu Hà',
      identityKey: 'ha.le@vinai.io',
      source: 'landing',
      checkedIn: false,
      checkInTime: null,
    }),
    createRegistrationRecord({
      id: 'reg_s1_5',
      code: 'DK-AI2605',
      projectId: p1Id,
      values: {
        fld_name: 'Đặng Gia Huy',
        fld_email: 'huy.dang@hust.edu.vn',
        fld_phone: '0977889900',
      },
      displayName: 'Đặng Gia Huy',
      identityKey: 'huy.dang@hust.edu.vn',
      source: 'preview',
      checkedIn: false,
      checkInTime: null,
    }),
  ];

  // ============================================================================
  // DỰ ÁN MẪU 2: KHÔNG DÙNG ẢNH NGUỒN - 0 ẢNH (PURE TYPOGRAPHY & SMART MAP)
  // ============================================================================
  const p2Id = 'prj_sample_biz_strategy';
  const p2Assets = []; // 0 ảnh để minh chứng khả năng tự động dàn trang Typography & Bản đồ SVG

  const p2FormFields = [
    ...createDefaultFormFields(),
    {
      key: 'fld_company',
      label: 'Doanh nghiệp / Chức vụ',
      type: FIELD_TYPES.TEXT,
      required: false,
      role: null,
      hint: 'Tên công ty và vị trí công tác hiện tại',
      deleted: false,
    },
  ];

  const p2ModuleLayout = [
    createModuleInstance('nav', { variant: 'bar', styles: { padding: 'compact', background: 'default' } }),
    createModuleInstance('hero', { variant: 'split-card', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('countdown', { variant: 'boxes', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('benefits', { variant: 'numbered-rows', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('speakers', { variant: 'trio-typographic', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('agenda', { variant: 'timeline', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('venue', { variant: 'map-left', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('offer_banner', { variant: 'ribbon', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('faq', { variant: 'accordion', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('form', { variant: 'split-benefit', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('footer', { variant: 'simple', styles: { padding: 'normal', background: 'dark' } }),
  ];

  const p2Project = createProject({
    id: p2Id,
    name: 'Diễn Đàn Chiến Lược Quản Trị & Tăng Trưởng Doanh Nghiệp SME 2026',
    slug: 'dien-dan-chien-luoc-quan-tri-sme-2026',
    status: PROJECT_STATUS.PUBLISHED,
    isSample: true,
    sampleTag: 'Mẫu 2 · Không ảnh & Không mô tả thêm (Tinh gọn)',
    sampleScenario: 'Bỏ trống ô Mô tả thêm sự kiện và không dùng ảnh (0 ảnh): Tự động cắt giảm các module mở rộng, tuyệt đối không bịa đặt thông tin ngoài 6 trường bắt buộc.',
    colorTheme: 'amber',
    modulePreset: 'gala',
    moduleLayout: p2ModuleLayout,
    alternatingBg: true,
    event: {
      eventName: 'Diễn Đàn Chiến Lược Quản Trị & Tăng Trưởng Doanh Nghiệp SME 2026',
      eventDate: dateBiz,
      eventTime: '13:30',
      venue: 'Khách sạn Melia Hanoi - Phòng Grand Ballroom Tầng 2, 44B Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
      venueAddress: '44B Lý Thường Kiệt, Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
      venueNotes: 'Phòng hội nghị tiêu chuẩn 5 sao kèm tiệc trà chiều kết nối giao thương B2B.',
      description: '',
      capacity: 80,
      speakers: [
        {
          id: 'spk_s2_1',
          name: 'Ông Vũ Minh Đức',
          title: 'Chủ tịch HĐQT — Tập đoàn Tư vấn Chiến lược Doanh nghiệp Việt',
          assetId: null,
        },
        {
          id: 'spk_s2_2',
          name: 'Bà Đỗ Thanh Tâm',
          title: 'Giám đốc Điều hành Khối Đầu tư & Tăng trưởng B2B',
          assetId: null,
        },
        {
          id: 'spk_s2_3',
          name: 'TS. Hoàng Quốc Bảo',
          title: 'Chuyên gia Tái cấu trúc Tài chính & Vận hành Tinh gọn',
          assetId: null,
        },
      ],
      earlyBirdOffer: 'Tặng bộ Khung Ma trận Quản trị OKR/KPI 2026 và 1 phiên tư vấn 1-1 cùng chuyên gia cho 30 lãnh đạo doanh nghiệp đăng ký sớm nhất.',
      earlyBirdDeadline: `${dateBizEarly}T23:59`,
      agenda: [
        { id: 'ag_s2_1', time: '13:30', title: 'Đón tiếp khách mời VIP, Check-in QR & Giao lưu kết nối B2B' },
        { id: 'ag_s2_2', time: '14:00', title: 'Phiên 1: Tái định hình Mô hình Tăng trưởng SME trong bối cảnh kinh tế số (Ông Vũ Minh Đức)' },
        { id: 'ag_s2_3', time: '15:00', title: 'Phiên 2: Tối ưu hóa Dòng tiền và Quản trị Hiệu suất Đội ngũ (TS. Hoàng Quốc Bảo)' },
        { id: 'ag_s2_4', time: '16:00', title: 'Đối thoại Bàn tròn: Giải bài toán mở rộng thị trường & Gọi vốn chiến lược (Bà Đỗ Thanh Tâm)' },
        { id: 'ag_s2_5', time: '17:00', title: 'Tiệc trà chiều Executive Networking & Tư vấn trực tiếp' },
      ],
    },
    formFields: p2FormFields,
    ai: {
      source: 'ai',
      generatedAt: '2026-11-08T08:30:00.000Z',
      headline: 'Diễn Đàn Chiến Lược Quản Trị & Tăng Trưởng Doanh Nghiệp SME 2026',
      description: `Diễn Đàn Chiến Lược Quản Trị & Tăng Trưởng Doanh Nghiệp SME 2026 diễn ra vào lúc 13:30 ngày ${dateBiz} tại Khách sạn Melia Hanoi - Phòng Grand Ballroom Tầng 2, 44B Lý Thường Kiệt, Hoàn Kiếm, Hà Nội với sự tham gia chia sẻ của Ông Vũ Minh Đức, Bà Đỗ Thanh Tâm và TS. Hoàng Quốc Bảo.`,
      benefits: [
        'Trực tiếp lắng nghe phần chia sẻ chuyên đề từ Ông Vũ Minh Đức, Bà Đỗ Thanh Tâm và TS. Hoàng Quốc Bảo.',
        'Theo dõi 5 phiên chương trình từ 13:30 đến 17:00 tại Khách sạn Melia Hanoi - Phòng Grand Ballroom Tầng 2.',
        'Quyền lợi đăng ký sớm: Tặng bộ Khung Ma trận Quản trị OKR/KPI 2026 và 1 phiên tư vấn 1-1 cho 30 lãnh đạo đăng ký sớm nhất.',
      ],
      faq: [
        {
          q: 'Sự kiện diễn ra vào thời gian nào?',
          a: `Chương trình diễn ra vào ngày ${dateBiz} lúc 13:30 (GMT+7).`,
        },
        {
          q: 'Địa điểm tổ chức ở đâu?',
          a: 'Sự kiện được tổ chức tại Khách sạn Melia Hanoi - Phòng Grand Ballroom Tầng 2, 44B Lý Thường Kiệt, Hoàn Kiếm, Hà Nội.',
        },
        {
          q: 'Ai là diễn giả chia sẻ và ưu đãi đăng ký sớm là gì?',
          a: 'Chương trình có sự chia sẻ của Ông Vũ Minh Đức, Bà Đỗ Thanh Tâm, TS. Hoàng Quốc Bảo; tặng bộ Khung Ma trận Quản trị OKR/KPI 2026 và 1 phiên tư vấn 1-1 cho 30 người đăng ký sớm nhất.',
        },
      ],
      audience: [],
      bentoHighlights: [],
      organizer: null,
      recommendedPreset: 'gala',
      recommendedSpeakerVariant: 'trio-typographic',
      colorTheme: 'amber',
      imageAssignments: {
        hero: null,
        heroImageId: null,
        venue: null,
        venueImageId: null,
        gift: null,
        giftImageId: null,
        speakers: [],
      },
      edited: false,
    },
  });

  const p2Registrations = [
    createRegistrationRecord({
      id: 'reg_s2_1',
      code: 'DK-SME801',
      projectId: p2Id,
      values: {
        fld_name: 'Phan Văn Hùng',
        fld_email: 'hung.phan@alphacorp.vn',
        fld_phone: '0903123456',
        fld_company: 'CEO - Alpha Logistics Vietnam',
      },
      displayName: 'Phan Văn Hùng',
      identityKey: 'hung.phan@alphacorp.vn',
      source: 'landing',
      checkedIn: true,
      checkInTime: '2026-11-08T02:10:00.000Z',
    }),
    createRegistrationRecord({
      id: 'reg_s2_2',
      code: 'DK-SME802',
      projectId: p2Id,
      values: {
        fld_name: 'Ngô Bích Thủy',
        fld_email: 'thuy.ngo@greenretail.vn',
        fld_phone: '0918223344',
        fld_company: 'Giám đốc Vận hành - GreenRetail',
      },
      displayName: 'Ngô Bích Thủy',
      identityKey: 'thuy.ngo@greenretail.vn',
      source: 'landing',
      checkedIn: true,
      checkInTime: '2026-11-08T02:18:00.000Z',
    }),
    createRegistrationRecord({
      id: 'reg_s2_3',
      code: 'DK-SME803',
      projectId: p2Id,
      values: {
        fld_name: 'Lý Thành Nam',
        fld_email: 'nam.ly@minhphatjsc.com',
        fld_phone: '0989556677',
        fld_company: 'Founder - Minh Phát JSC',
      },
      displayName: 'Lý Thành Nam',
      identityKey: 'nam.ly@minhphatjsc.com',
      source: 'landing',
      checkedIn: false,
      checkInTime: null,
    }),
  ];

  // ============================================================================
  // DỰ ÁN MẪU 3: ẢNH CHỌN LỌC (2 ẢNH) & FORM ĐĂNG KÝ TÙY BIẾN CHO SINH VIÊN
  // ============================================================================
  const p3Id = 'prj_sample_student_fest';
  const p3Assets = [
    createAssetImage({
      id: 'img_s3_spk1',
      projectId: p3Id,
      dataUrl: '/sample-assets/speaker_2.jpg',
      caption: 'Chân dung diễn giả khách mời ThS. Trần Thị Mai Phương - Cố vấn Vườn ươm Khởi nghiệp',
      role: ASSET_ROLES.SPEAKER,
      speakerRef: 'spk_s3_1',
      width: 640,
      height: 640,
      sizeKB: 76,
    }),
    createAssetImage({
      id: 'img_s3_gift',
      projectId: p3Id,
      dataUrl: '/sample-assets/prizes_awards.svg',
      caption: 'Học bổng ươm tạo dự án và bộ kit khởi nghiệp dành cho sinh viên',
      role: ASSET_ROLES.GIFT,
      width: 1000,
      height: 650,
      sizeKB: 4,
    }),
  ];

  const p3FormFields = [
    ...createDefaultFormFields(),
    {
      key: 'fld_school',
      label: 'Trường Đại học / Chuyên ngành',
      type: FIELD_TYPES.TEXT,
      required: true,
      role: null,
      hint: 'Ví dụ: ĐH Bách Khoa Hà Nội - Khoa CNTT',
      deleted: false,
    },
  ];

  const p3ModuleLayout = [
    createModuleInstance('nav', { variant: 'bar', styles: { padding: 'compact', background: 'default' } }),
    createModuleInstance('hero', { variant: 'benefits-band', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('countdown', { variant: 'circles', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('bento', { variant: 'grid-asymmetric', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('audience', { variant: 'persona-cards', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('benefits', { variant: 'recap-chips', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('speakers', { variant: 'solo-spotlight', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('agenda', { variant: 'steps-horizontal', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('venue', { variant: 'image-left', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('offer_banner', { variant: 'card-image-left', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('faq', { variant: 'accordion', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('form', { variant: 'card', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('organizer', { variant: 'card', styles: { padding: 'normal', background: 'default' } }),
    createModuleInstance('footer', { variant: 'cta-strip', styles: { padding: 'normal', background: 'dark' } }),
  ];

  const p3Project = createProject({
    id: p3Id,
    name: 'Ngày Hội Khởi Nghiệp & Đổi Mới Sáng Tạo Sinh Viên 2026',
    slug: 'ngay-hoi-khoi-nghiep-sinh-vien-2026',
    status: PROJECT_STATUS.PUBLISHED,
    isSample: true,
    sampleTag: 'Mẫu 3 · 2 ảnh chọn lọc & Có mô tả thêm',
    sampleScenario: 'Có đầy đủ Mô tả thêm sự kiện và 2 ảnh chọn lọc (1 Diễn giả + 1 Quà tặng, không có ảnh sự kiện): Dùng Hero không ảnh, khai thác Bento, Đối tượng sinh viên, Solo Spotlight và Ban tổ chức.',
    colorTheme: 'emerald',
    modulePreset: 'community',
    moduleLayout: p3ModuleLayout,
    alternatingBg: true,
    event: {
      eventName: 'Ngày Hội Khởi Nghiệp & Đổi Mới Sáng Tạo Sinh Viên 2026',
      eventDate: dateStudent,
      eventTime: '08:00',
      venue: 'Không gian Sáng tạo BK-Holdings - Đại học Bách Khoa Hà Nội, Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
      venueAddress: 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
      venueNotes: 'Khu vực triển lãm 20 gian hàng dự án sinh viên và sân khấu Pitching trung tâm.',
      description: 'Ngày hội khởi nghiệp thường niên dành cho sinh viên các khối ngành Công nghệ thông tin, Kinh tế và Kỹ thuật tại các trường đại học khu vực miền Bắc. Chương trình quy tụ 20 gian hàng trưng bày sản phẩm mẫu (Prototype), vòng Chung kết Pitching gọi vốn ươm tạo trước Hội đồng Cố vấn BK-Holdings và hoạt động kết nối tuyển dụng thực tập sinh tài năng. Ban tổ chức Vườn ươm Khởi nghiệp Sinh viên hỗ trợ giải đáp tại Sảnh Trung tâm BK-Holdings hoặc qua email startupfest@bkholdings.vn và hotline 024 3868 4567.',
      capacity: 200,
      speakers: [
        {
          id: 'spk_s3_1',
          name: 'ThS. Trần Thị Mai Phương',
          title: 'Cố vấn Vườn ươm Khởi nghiệp Trẻ — Giám khảo Chung kết Pitching',
          assetId: 'img_s3_spk1',
        },
      ],
      earlyBirdOffer: 'Tặng gói Học bổng Ươm tạo Khởi nghiệp cùng bộ Kit Sổ tay Pitching Deck cho 100 bạn sinh viên đăng ký sớm nhất.',
      earlyBirdDeadline: `${dateStudentEarly}T23:59`,
      agenda: [
        { id: 'ag_s3_1', time: '08:00', title: 'Check-in QR nhận vòng tay sự kiện & Tham quan 20 gian hàng dự án sinh viên' },
        { id: 'ag_s3_2', time: '09:00', title: 'Spotlight Talk: Từ Đồ án Môn học đến Sản phẩm Khởi nghiệp Thực tế (ThS. Trần Thị Mai Phương)' },
        { id: 'ag_s3_3', time: '10:15', title: 'Vòng Chung kết Pitching: 5 đội thi xuất sắc trình bày trước Hội đồng Cố vấn' },
        { id: 'ag_s3_4', time: '11:30', title: 'Trao giải thưởng Ươm tạo, Giao lưu tuyển dụng thực tập sinh & Bế mạc' },
      ],
    },
    formFields: p3FormFields,
    ai: {
      source: 'ai',
      generatedAt: '2026-11-08T09:00:00.000Z',
      headline: 'Ngày Hội Khởi Nghiệp & Đổi Mới Sáng Tạo Sinh Viên 2026',
      description: 'Ngày hội khởi nghiệp thường niên tại Không gian Sáng tạo BK-Holdings (ĐH Bách Khoa Hà Nội) dành cho sinh viên các khối ngành CNTT, Kinh tế và Kỹ thuật khu vực miền Bắc. Quy tụ 20 gian hàng Prototype, vòng Chung kết Pitching trước Hội đồng Cố vấn và kết nối tuyển dụng thực tập sinh.',
      benefits: [
        'Tặng gói Học bổng Ươm tạo Khởi nghiệp và bộ Kit Sổ tay Pitching Deck cho 100 sinh viên đăng ký sớm nhất.',
        'Lắng nghe chia sẻ thực tế từ ThS. Trần Thị Mai Phương tại phiên Spotlight Talk: Từ Đồ án Môn học đến Sản phẩm Khởi nghiệp.',
        'Tham quan 20 gian hàng sản phẩm mẫu (Prototype), theo dõi Chung kết Pitching 5 đội thi và kết nối thực tập sinh tài năng.',
      ],
      audience: [
        {
          badge: 'Khối CNTT & Kỹ thuật',
          title: 'Sinh viên Công nghệ thông tin & Kỹ thuật',
          desc: 'Trực tiếp trải nghiệm 20 gian hàng trưng bày sản phẩm mẫu (Prototype) và học hỏi cách chuyển hóa đồ án môn học thành sản phẩm thực tế.',
        },
        {
          badge: 'Khối Kinh tế & Quản trị',
          title: 'Sinh viên Kinh tế & Nhóm Dự án Khởi nghiệp',
          desc: 'Theo dõi vòng Chung kết Pitching gọi vốn ươm tạo của 5 đội thi xuất sắc trước Hội đồng Cố vấn BK-Holdings.',
        },
        {
          badge: 'Thực tập & Tuyển dụng',
          title: 'Sinh viên tìm kiếm cơ hội Thực tập sinh tài năng',
          desc: 'Kết nối trực tiếp với các doanh nghiệp công nghệ và vườn ươm khởi nghiệp ngay tại khu vực giao lưu tuyển dụng.',
        },
      ],
      bentoHighlights: [
        {
          tag: '01 / TRIỂN LÃM PROTOTYPE',
          title: '20 Gian hàng trưng bày sản phẩm mẫu sinh viên',
          desc: 'Không gian trưng bày dự án công nghệ, kỹ thuật và mô hình kinh doanh sáng tạo từ các trường đại học miền Bắc.',
        },
        {
          tag: '02 / HỌC BỔNG ĐĂNG KÝ SỚM',
          title: 'Gói Học bổng Ươm tạo & Sổ tay Pitching Deck',
          desc: 'Dành tặng 100 bạn sinh viên hoàn tất đăng ký sớm nhất trước thời hạn ưu đãi.',
        },
        {
          tag: '03 / SPOTLIGHT & PITCHING',
          title: 'Chia sẻ cùng ThS. Trần Thị Mai Phương & Chung kết 5 đội',
          desc: 'Từ đồ án môn học đến sản phẩm thực tế và màn tranh tài gọi vốn ươm tạo trước Hội đồng Cố vấn BK-Holdings.',
        },
        {
          tag: '04 / KẾT NỐI THỰC TẬP SINH',
          title: '200 Sinh viên tại Không gian Sáng tạo BK-Holdings',
          desc: 'Hoạt động giao lưu tuyển dụng thực tập sinh tài năng tại Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội.',
        },
      ],
      organizer: {
        name: 'Ban Tổ Chức Vườn Ươm Khởi Nghiệp Sinh Viên — BK-Holdings',
        tagline: 'Hỗ trợ sinh viên các khối ngành CNTT, Kinh tế và Kỹ thuật tại Sảnh Trung tâm BK-Holdings - Đại học Bách Khoa Hà Nội.',
        email: 'startupfest@bkholdings.vn',
        hotline: '024 3868 4567',
        venue: 'Không gian Sáng tạo BK-Holdings, Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
        hours: `08:00 - 12:00 · Ngày ${dateStudent}`,
      },
      faq: [
        {
          q: 'Ngày hội diễn ra vào thời gian và địa điểm nào?',
          a: `Chương trình diễn ra vào ngày ${dateStudent} lúc 08:00 (GMT+7) tại Không gian Sáng tạo BK-Holdings - Đại học Bách Khoa Hà Nội, Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội.`,
        },
        {
          q: 'Sinh viên các trường nào có thể đăng ký tham dự?',
          a: 'Chương trình mở cửa cho sinh viên các khối ngành Công nghệ thông tin, Kinh tế và Kỹ thuật tại các trường đại học khu vực miền Bắc.',
        },
        {
          q: 'Quyền lợi dành cho 100 sinh viên đăng ký sớm nhất là gì?',
          a: '100 bạn sinh viên đăng ký sớm nhất nhận được gói Học bổng Ươm tạo Khởi nghiệp cùng bộ Kit Sổ tay Pitching Deck.',
        },
        {
          q: 'Khi cần hỗ trợ thông tin, sinh viên liên hệ Ban tổ chức ở đâu?',
          a: 'Ban tổ chức Vườn ươm Khởi nghiệp Sinh viên hỗ trợ trực tiếp tại Sảnh Trung tâm BK-Holdings hoặc qua email startupfest@bkholdings.vn và hotline 024 3868 4567.',
        },
      ],
      recommendedPreset: 'community',
      recommendedSpeakerVariant: 'solo-spotlight',
      colorTheme: 'emerald',
      imageAssignments: {
        hero: null,
        heroImageId: null,
        venue: null,
        venueImageId: null,
        gift: 'img_s3_gift',
        giftImageId: 'img_s3_gift',
        speakers: [{ speakerIndex: 0, assetId: 'img_s3_spk1' }],
      },
      edited: false,
    },
  });

  const p3Registrations = [
    createRegistrationRecord({
      id: 'reg_s3_1',
      code: 'DK-SV9001',
      projectId: p3Id,
      values: {
        fld_name: 'Vũ Hoàng Long',
        fld_email: 'long.vh2210@sis.hust.edu.vn',
        fld_phone: '0966112233',
        fld_school: 'ĐH Bách Khoa Hà Nội - Khoa học Máy tính',
      },
      displayName: 'Vũ Hoàng Long',
      identityKey: 'long.vh2210@sis.hust.edu.vn',
      source: 'landing',
      checkedIn: true,
      checkInTime: '2026-11-08T03:05:00.000Z',
    }),
    createRegistrationRecord({
      id: 'reg_s3_2',
      code: 'DK-SV9002',
      projectId: p3Id,
      values: {
        fld_name: 'Đinh Phương Thảo',
        fld_email: 'thao.dinh@neu.edu.vn',
        fld_phone: '0944556677',
        fld_school: 'ĐH Kinh tế Quốc dân - Quản trị Kinh doanh',
      },
      displayName: 'Đinh Phương Thảo',
      identityKey: 'thao.dinh@neu.edu.vn',
      source: 'landing',
      checkedIn: true,
      checkInTime: '2026-11-08T03:12:00.000Z',
    }),
    createRegistrationRecord({
      id: 'reg_s3_3',
      code: 'DK-SV9003',
      projectId: p3Id,
      values: {
        fld_name: 'Trịnh Minh Quân',
        fld_email: 'quan.trinh@vnu.edu.vn',
        fld_phone: '0932889911',
        fld_school: 'ĐH Công nghệ ĐHQGHN - Trí tuệ Nhân tạo',
      },
      displayName: 'Trịnh Minh Quân',
      identityKey: 'quan.trinh@vnu.edu.vn',
      source: 'landing',
      checkedIn: false,
      checkInTime: null,
    }),
    createRegistrationRecord({
      id: 'reg_s3_4',
      code: 'DK-SV9004',
      projectId: p3Id,
      values: {
        fld_name: 'Bùi Ngọc Ánh',
        fld_email: 'anh.bui@ftu.edu.vn',
        fld_phone: '0971234567',
        fld_school: 'ĐH Ngoại Thương - Kinh tế Đối ngoại',
      },
      displayName: 'Bùi Ngọc Ánh',
      identityKey: 'anh.bui@ftu.edu.vn',
      source: 'landing',
      checkedIn: false,
      checkInTime: null,
    }),
  ];

  // Đặt mốc thời gian cơ sở cho dự án mẫu hệ thống để luôn nằm sau các dự án người dùng mới tạo, giữ đúng thứ tự Mẫu 1 -> Mẫu 2 -> Mẫu 3
  p1Project.updatedAt = '2026-01-01T09:30:00.000Z';
  p2Project.updatedAt = '2026-01-01T09:20:00.000Z';
  p3Project.updatedAt = '2026-01-01T09:10:00.000Z';

  return [
    { project: p1Project, assets: p1Assets, registrations: p1Registrations },
    { project: p2Project, assets: p2Assets, registrations: p2Registrations },
    { project: p3Project, assets: p3Assets, registrations: p3Registrations },
  ];
}
