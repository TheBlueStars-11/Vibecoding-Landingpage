/**
 * @file moduleSchema.js
 * Định nghĩa cấu trúc Module, Danh mục (Catalog), Biến thể (Variants) và Dữ liệu thử
 * theo tài liệu yeu-cau-chuc-nang-module-design-dev-mode.md
 */

import { generateId } from './elsSchema.js';

export const MANDATORY_MODULE_TYPES = ['hero', 'countdown', 'agenda', 'form'];

export const BREAKPOINT_PRESETS = [
  { id: 'mobile-xs', label: 'Cực nhỏ / Fold gập (280px)', width: 280, height: 653, category: 'mobile' },
  { id: 'mobile-s', label: 'Điện thoại nhỏ (320px)', width: 320, height: 568, category: 'mobile' },
  { id: 'mobile-m', label: 'Điện thoại chuẩn (375px)', width: 375, height: 667, category: 'mobile' },
  { id: 'mobile-l', label: 'Điện thoại lớn (414px)', width: 414, height: 896, category: 'mobile' },
  { id: 'tablet-sm', label: 'Tablet nhỏ / Ngang (600px)', width: 600, height: 960, category: 'tablet' },
  { id: 'tablet-p', label: 'Máy tính bảng dọc (768px)', width: 768, height: 1024, category: 'tablet' },
  { id: 'tablet-l', label: 'Máy tính bảng ngang (1024px)', width: 1024, height: 768, category: 'tablet' },
  { id: 'laptop', label: 'Laptop (1280px)', width: 1280, height: 800, category: 'desktop' },
  { id: 'desktop', label: 'Màn hình rộng (1440px)', width: 1440, height: 900, category: 'desktop' },
  { id: 'desktop-wide', label: 'Full HD / 2K (1600px)', width: 1600, height: 1000, category: 'desktop' },
];

export const COLOR_THEMES = [
  { id: 'purple', name: 'Tím Hoàng Gia', hex: '#6366f1', primary: '#4f46e5', tint: '#f5f3ff', desc: 'Sáng tạo, hiện đại, công nghệ AI' },
  { id: 'blue', name: 'Xanh Công Nghệ', hex: '#0284c7', primary: '#0369a1', tint: '#f0f9ff', desc: 'Chuyên nghiệp, tin cậy, hội nghị' },
  { id: 'emerald', name: 'Xanh Ngọc Lục', hex: '#10b981', primary: '#059669', tint: '#ecfdf5', desc: 'Tươi mới, bền vững, startup' },
  { id: 'amber', name: 'Cam Nhiệt Huyết', hex: '#f59e0b', primary: '#d97706', tint: '#fffbeb', desc: 'Năng động, bùng nổ, sự kiện lễ hội' },
  { id: 'rose', name: 'Đỏ Ruby Quý Phái', hex: '#f43f5e', primary: '#e11d48', tint: '#fff1f2', desc: 'Sang trọng, cuốn hút, chuyển đổi cao' },
  { id: 'dark', name: 'Đen Huyền Bí', hex: '#0f172a', primary: '#1e293b', tint: '#f8fafc', desc: 'Đẳng cấp, huyền bí, phong cách Tech Dark' },
];

export const DEFAULT_COLOR_THEME = 'rose';

export const MODULE_CATEGORIES = {
  INTRO: 'Mở đầu & Nổi bật',
  INFO: 'Thông tin sự kiện',
  CONTENT: 'Nội dung & Truyền thông',
  CONVERSION: 'Chuyển đổi (Đăng ký)',
  UTILITY: 'Bố cục & Tiện ích',
};

export const MODULE_CATALOG = {
  hero: {
    type: 'hero',
    name: 'Phần mở đầu (Hero)',
    category: MODULE_CATEGORIES.INTRO,
    isMandatory: true,
    description: 'Tiêu đề, mô tả, 3 lợi ích, ưu đãi, thời gian, địa điểm và nút đăng ký',
    variants: [
      { id: 'image-right', label: 'Ảnh bên phải · Chữ bên trái' },
      { id: 'center', label: 'Căn giữa tập trung' },
      { id: 'benefits-band', label: 'Dải 3 giá trị nổi bật' },
      { id: 'split-card', label: 'Thẻ ngày giờ kính mờ' },
      { id: 'cinema-letterbox', label: 'Điện ảnh Letterbox 21:9' },
    ],
    defaultVariant: 'image-right',
  },
  countdown: {
    type: 'countdown',
    name: 'Đồng hồ đếm ngược',
    category: MODULE_CATEGORIES.INFO,
    isMandatory: true,
    description: 'Đếm ngược đến giờ khai mạc; hiển thị sự kiện đã kết thúc khi qua giờ',
    variants: [
      { id: 'boxes', label: 'Dạng 4 ô số nổi bật' },
      { id: 'circles', label: 'Dạng 4 vòng tròn' },
    ],
    defaultVariant: 'boxes',
  },
  agenda: {
    type: 'agenda',
    name: 'Chương trình chi tiết',
    category: MODULE_CATEGORIES.INFO,
    isMandatory: true,
    description: 'Lịch trình sự kiện theo các mốc thời gian',
    variants: [
      { id: 'timeline', label: 'Dòng thời gian (Timeline đứng)' },
      { id: 'agenda-glance', label: 'Nhìn lướt 1 dòng các mốc chính' },
      { id: 'timeline-sectioned', label: 'Phân chia giai đoạn / ca học chi tiết' },
      { id: 'timeline-speaker', label: 'Gắn avatar & khách mời vào phiên' },
      { id: 'steps-horizontal', label: 'Các chặng ngang có mũi tên' },
    ],
    defaultVariant: 'timeline',
  },
  form: {
    type: 'form',
    name: 'Form đăng ký tham dự',
    category: MODULE_CATEGORIES.CONVERSION,
    isMandatory: true,
    description: 'Hiển thị các trường đăng ký đã cấu hình ở Workspace 2 và lưu đơn',
    variants: [
      { id: 'card', label: 'Thẻ nổi bật giữa trang' },
      { id: 'split-benefit', label: 'Tóm tắt ưu đãi + Form hai cột' },
      { id: 'split-offer', label: 'Trái ưu đãi & người tham gia + Phải form' },
    ],
    defaultVariant: 'card',
  },
  speakers: {
    type: 'speakers',
    name: 'Danh sách diễn giả',
    category: MODULE_CATEGORIES.INFO,
    isMandatory: false,
    description: 'Hiển thị hình ảnh, tên và chức danh các diễn giả khách mời',
    variants: [
      { id: 'portrait-cards', label: 'Thẻ chân dung tỷ lệ 4:5' },
      { id: 'trio-typographic', label: 'Thuần chữ sang trọng cho 3 diễn giả' },
      { id: 'solo-spotlight', label: '1 Diễn giả tâm điểm nổi bật' },
    ],
    defaultVariant: 'portrait-cards',
  },
  venue: {
    type: 'venue',
    name: 'Địa điểm & Bản đồ',
    category: MODULE_CATEGORIES.INFO,
    isMandatory: false,
    description: 'Tên địa điểm, địa chỉ tổ chức và hình ảnh hội trường',
    variants: [
      { id: 'image-left', label: 'Ảnh trái · Địa chỉ phải' },
      { id: 'map-left', label: 'Ô vuông bản đồ (MapSlot) trái · Địa chỉ phải' },
      { id: 'text-only', label: 'Địa chỉ chữ thuần tối giản' },
      { id: 'online-card', label: 'Sự kiện trực tuyến Online (Zoom/Meet)' },
    ],
    defaultVariant: 'image-left',
  },
  benefits: {
    type: 'benefits',
    name: 'Lợi ích tham dự',
    category: MODULE_CATEGORIES.INFO,
    isMandatory: false,
    description: '3 điểm nhấn và giá trị người tham gia nhận được',
    variants: [
      { id: 'cards', label: '3 Thẻ độc lập' },
      { id: 'recap-strip', label: 'Dải tóm tắt 1 hàng sát form đăng ký' },
      { id: 'recap-chips', label: 'Viên thuốc tóm tắt giá trị' },
      { id: 'numbered-rows', label: '3 Hàng lớn đánh số 01/02/03' },
    ],
    defaultVariant: 'cards',
  },
  offer_banner: {
    type: 'offer_banner',
    name: 'Thanh ưu đãi nổi bật',
    category: MODULE_CATEGORIES.INTRO,
    isMandatory: false,
    description: 'Nhấn mạnh ưu đãi đăng ký sớm và quà tặng',
    variants: [
      { id: 'ribbon', label: 'Dải ruy băng gradient' },
      { id: 'split-coupon', label: 'Phiếu quà tặng voucher 2 phần' },
      { id: 'price-compare', label: 'So sánh giá thường vs giá ưu đãi' },
      { id: 'card-image-left', label: 'Thẻ ảnh quà tặng bên trái' },
      { id: 'inline-chip', label: 'Huy hiệu ưu đãi nhỏ gọn' },
    ],
    defaultVariant: 'ribbon',
  },
  faq: {
    type: 'faq',
    name: 'Câu hỏi thường gặp (FAQ)',
    category: MODULE_CATEGORIES.CONTENT,
    isMandatory: false,
    description: 'Giải đáp các thắc mắc phổ biến về sự kiện',
    variants: [
      { id: 'accordion', label: 'Thu gọn / Mở rộng (Accordion)' },
    ],
    defaultVariant: 'accordion',
  },
  footer: {
    type: 'footer',
    name: 'Chân trang (Footer)',
    category: MODULE_CATEGORIES.UTILITY,
    isMandatory: false,
    description: 'Bản quyền, liên hệ và nhãn minh bạch quy chế cuộc thi',
    variants: [
      { id: 'simple', label: 'Đơn giản căn giữa' },
      { id: 'cta-strip', label: 'Dải kêu gọi hành động phía trên chân trang' },
      { id: 'rich-3col', label: 'Chân trang 3 cột đầy đủ' },
      { id: 'credits-roll', label: 'Cuộn Credit kết thúc (Credits Roll)' },
    ],
    defaultVariant: 'simple',
  },
  divider: {
    type: 'divider',
    name: 'Đường phân cách',
    category: MODULE_CATEGORIES.UTILITY,
    isMandatory: false,
    description: 'Ngăn cách các phần một cách trực quan',
    variants: [
      { id: 'solid', label: 'Đường thẳng liền' },
      { id: 'fade-to-stage', label: 'Chuyển cảnh mờ dần sang Stage' },
    ],
    defaultVariant: 'solid',
  },
  nav: {
    type: 'nav',
    name: 'Thanh điều hướng neo (Nav)',
    category: MODULE_CATEGORIES.UTILITY,
    isMandatory: false,
    description: 'Thanh neo cố định hoặc lướt nhanh tới các phân đoạn chính trong trang',
    variants: [
      { id: 'bar', label: 'Thanh ngang tiêu chuẩn' },
    ],
    defaultVariant: 'bar',
  },
  stats: {
    type: 'stats',
    name: 'Số liệu nổi bật (Stats)',
    category: MODULE_CATEGORIES.CONTENT,
    isMandatory: false,
    description: 'Hiển thị các chỉ số ấn tượng về quy mô: giờ, diễn giả, người tham gia',
    variants: [
      { id: 'row', label: 'Hàng ngang ngăn cách mảnh' },
      { id: 'cards', label: 'Thẻ số liệu bo góc' },
    ],
    defaultVariant: 'row',
  },
  audience: {
    type: 'audience',
    name: 'Sự kiện dành cho ai (Audience)',
    category: MODULE_CATEGORIES.CONTENT,
    isMandatory: false,
    description: 'Phân loại các đối tượng tham dự phù hợp nhất, giảm băn khoăn cho khách',
    variants: [
      { id: 'chips', label: 'Hàng thẻ chip danh mục' },
      { id: 'persona-cards', label: 'Thẻ hồ sơ đối tượng chi tiết' },
      { id: 'checklist', label: 'Danh sách tiêu chí phù hợp' },
      { id: 'yes-no-split', label: 'Dành cho ai & Không dành cho ai' },
    ],
    defaultVariant: 'chips',
  },
  bento: {
    type: 'bento',
    name: 'Lưới Bento đa năng (Bento Grid)',
    category: MODULE_CATEGORIES.CONTENT,
    isMandatory: false,
    description: 'Bố cục bất đối xứng hiện đại gom tóm tắt lợi ích, địa điểm, số liệu',
    variants: [
      { id: 'grid-asymmetric', label: 'Lưới bất đối xứng 4 ô' },
      { id: 'bento-3', label: 'Lưới Bento 3 ô tinh gọn' },
      { id: 'bento-dark-glass', label: 'Bento nền tối kính mờ viền phát sáng' },
    ],
    defaultVariant: 'grid-asymmetric',
  },
  sponsors: {
    type: 'sponsors',
    name: 'Nhà tài trợ & Đối tác',
    category: MODULE_CATEGORIES.CONTENT,
    isMandatory: false,
    description: 'Hiển thị logo hoặc biểu trưng các đơn vị đồng hành và bảo trợ',
    variants: [
      { id: 'grid-tiered', label: 'Lưới phân hạng (Kim cương / Vàng / Bạc)' },
    ],
    defaultVariant: 'grid-tiered',
  },
  final_cta: {
    type: 'final_cta',
    name: 'Kêu gọi cuối trang (Final CTA)',
    category: MODULE_CATEGORIES.CONVERSION,
    isMandatory: false,
    description: 'Khối chuyển đổi chốt hạ cuối trang trước khi kết thúc hành trình đọc',
    variants: [
      { id: 'banner', label: 'Banner màu chuyển sắc lớn' },
      { id: 'split-form', label: 'Kêu gọi trái + Form nhanh phải' },
      { id: 'minimal', label: 'Một câu kêu gọi ngắn gọn' },
      { id: 'countdown-cta', label: 'Kêu gọi kèm đồng hồ gấp rút' },
      { id: 'cinema-finale', label: 'Đại cảnh kết màn (Cinema Finale)' },
    ],
    defaultVariant: 'banner',
  },
  organizer: {
    type: 'organizer',
    name: 'Ban tổ chức & Liên hệ',
    category: MODULE_CATEGORIES.INFO,
    isMandatory: false,
    description: 'Thông tin cơ quan tổ chức, kênh hỗ trợ, số hotline và email giải đáp',
    variants: [
      { id: 'card', label: 'Thẻ thông tin liên hệ đầy đủ' },
    ],
    defaultVariant: 'card',
  },
  sticky_cta: {
    type: 'sticky_cta',
    name: 'Nút đăng ký dính (Sticky CTA)',
    category: MODULE_CATEGORIES.UTILITY,
    isMandatory: false,
    description: 'Thanh hành động bám chân màn hình mobile hoặc góc desktop đảm bảo luôn có CTA',
    variants: [
      { id: 'bar', label: 'Thanh đáy tràn viền (Mobile)' },
      { id: 'rail-card', label: 'Thẻ cạnh dính (Rail Card)' },
    ],
    defaultVariant: 'bar',
  },
  announcement_bar: {
    type: 'announcement_bar',
    name: 'Thanh thông báo khẩn (Announcement)',
    category: MODULE_CATEGORIES.UTILITY,
    isMandatory: false,
    description: 'Dải thông báo ưu đãi gấp hoặc lịch mở cổng ghi danh ở đỉnh trang',
    variants: [
      { id: 'info', label: 'Thông báo tin tức trang nhã' },
      { id: 'urgent', label: 'Cảnh báo khẩn cấp số lượng có hạn' },
      { id: 'countdown', label: 'Thông báo kèm đồng hồ mini đếm giờ ưu đãi' },
    ],
    defaultVariant: 'info',
  },
};

/**
 * Danh sách đen vĩnh viễn các module và biến thể đã bị loại bỏ/xóa bỏ vĩnh viễn khỏi hệ thống app
 * (Theo nhật ký đánh giá thực tế MODULE_DEV_REVIEW_LOG và yêu cầu xóa vĩnh viễn)
 */
export const PERMANENT_DELETED_MODULE_TYPES = ['announcement_bar'];

export const PERMANENT_DELETED_VARIANTS = {
  hero: ['image-left', 'poster-fullbleed'],
  agenda: ['timeline-compact'],
  speakers: ['cast-credits'],
  benefits: ['cinema-trio'],
};

export const STORAGE_DELETED_MODULE_TYPES = 'ELS_DELETED_MODULE_TYPES';
export const STORAGE_DELETED_VARIANTS = 'ELS_DELETED_VARIANTS';

export function getDeletedModuleTypes() {
  let list = [...PERMANENT_DELETED_MODULE_TYPES];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_DELETED_MODULE_TYPES);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        for (const t of parsed) {
          if (!list.includes(t)) list.push(t);
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập localStorage
    }
  }
  // Chỉ giữ lại những loại module hiện đang tồn tại trong MODULE_CATALOG và không phải bắt buộc
  return list.filter((t) => MODULE_CATALOG[t] && !MODULE_CATALOG[t].isMandatory);
}

export function isModuleTypeDeleted(type) {
  return getDeletedModuleTypes().includes(type);
}

export function getDeletedVariants() {
  let local = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_DELETED_VARIANTS);
      local = raw ? JSON.parse(raw) : {};
    } catch {
      local = {};
    }
  }

  // Hợp nhất danh sách đen vĩnh viễn với các biến thể xóa trong localStorage
  const merged = {};
  for (const [type, variants] of Object.entries(PERMANENT_DELETED_VARIANTS)) {
    merged[type] = [...variants];
  }

  for (const [type, variants] of Object.entries(local)) {
    if (!MODULE_CATALOG[type] || !Array.isArray(variants)) continue;
    if (!merged[type]) merged[type] = [];
    for (const v of variants) {
      if (!merged[type].includes(v)) {
        merged[type].push(v);
      }
    }
  }

  return merged;
}

export function isVariantDeleted(type, variantId) {
  const deleted = getDeletedVariants();
  return Array.isArray(deleted[type]) && deleted[type].includes(variantId);
}

/**
 * Tìm biến thể an toàn, tự động loại bỏ biến thể đã bị xóa và thay thế bằng biến thể khả dụng
 */
export function getSafeVariant(type, desiredVariant) {
  const cat = MODULE_CATALOG[type];
  if (!cat) return desiredVariant || 'default';

  const deleted = getDeletedVariants()[type] || [];

  // Nếu biến thể mong muốn nằm trong danh sách ĐÃ BỊ XÓA -> Chặn và chuyển sang fallback an toàn
  if (desiredVariant && deleted.includes(desiredVariant)) {
    const availableVariants = (cat.variants || []).filter((v) => !deleted.includes(v.id));
    if (cat.defaultVariant && !deleted.includes(cat.defaultVariant)) {
      return cat.defaultVariant;
    }
    return availableVariants[0]?.id || 'default';
  }

  // Nếu không bị xóa, cho phép sử dụng desiredVariant hoặc defaultVariant
  return desiredVariant || cat.defaultVariant || 'default';
}

export function saveDeletedModuleType(type) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const current = getDeletedModuleTypes();
  if (!current.includes(type)) {
    const updated = [...current, type];
    localStorage.setItem(STORAGE_DELETED_MODULE_TYPES, JSON.stringify(updated));
  }
}

export function saveDeletedVariant(type, variantId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const current = getDeletedVariants();
  const existingForType = current[type] || [];
  if (!existingForType.includes(variantId)) {
    const updated = {
      ...current,
      [type]: [...existingForType, variantId],
    };
    localStorage.setItem(STORAGE_DELETED_VARIANTS, JSON.stringify(updated));
  }
}

export function restoreDefaultCatalog() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.removeItem(STORAGE_DELETED_MODULE_TYPES);
  localStorage.removeItem(STORAGE_DELETED_VARIANTS);
}

/**
 * Khởi tạo một đối tượng Module chuẩn (luôn kiểm tra và chặn biến thể bị xóa)
 */
export function createModuleInstance(type, customProps = {}) {
  const catalogItem = MODULE_CATALOG[type];
  if (!catalogItem) {
    throw new Error(`Loại module "${type}" không tồn tại trong danh mục.`);
  }

  const requestedVariant = customProps.variant || catalogItem.defaultVariant;
  const safeVariant = getSafeVariant(type, requestedVariant);

  return {
    id: generateId(`mod_${type}`),
    type,
    name: catalogItem.name,
    hidden: false,
    locked: false,
    isMandatory: catalogItem.isMandatory || false,
    dataSource: 'auto', // 'auto' (kế thừa WS1/WS2/AI) | 'custom' (nhập riêng)
    customContent: {},
    responsiveOverrides: {
      mobile: {},
      tablet: {},
      desktop: {},
    },
    styles: {
      padding: 'normal', // 'compact' | 'normal' | 'spacious'
      background: 'default', // 'default' | 'surface' | 'alt' | 'primary' | 'dark'
      align: 'default',
    },
    ...customProps,
    variant: safeVariant, // Bắt buộc ghi đè bằng biến thể an toàn không bị xóa
  };
}

/**
 * Tạo cây Module mặc định gồm 4 khu vực bắt buộc + các phần bổ trợ
 */
export function createDefaultModuleTree() {
  return [
    createModuleInstance('hero', { variant: 'image-right' }),
    createModuleInstance('countdown', { variant: 'boxes' }),
    createModuleInstance('speakers', { variant: 'portrait-cards' }),
    createModuleInstance('agenda', { variant: 'timeline' }),
    createModuleInstance('form', { variant: 'card' }),
    createModuleInstance('footer', { variant: 'simple' }),
  ];
}

/**
 * Công thức preset landing page theo loại sự kiện (theo mục 6.2 MODULE_DESIGN_REVIEW_AND_UPGRADE)
 * Được thiết kế để tận dụng hài hòa tối đa nhiều module cùng lúc (14-16 modules phối hợp)
 */
export const PRESET_TEMPLATES = {
  workshop: {
    id: 'workshop',
    name: 'Hội thảo / Workshop (Đầy đủ tiêu chuẩn)',
    description: 'Bố cục toàn diện kết hợp 15 module chuẩn mực cho hội thảo học thuật, đào tạo chuyên sâu và chuyển giao tri thức',
    useCase: 'Hội thảo chuyên môn, khóa đào tạo thực chiến, workshop kỹ năng, chuyển giao công nghệ',
    modules: [
      { type: 'nav', variant: 'bar' },
      { type: 'hero', variant: 'image-right' },
      { type: 'countdown', variant: 'boxes' },
      { type: 'offer_banner', variant: 'ribbon' },
      { type: 'stats', variant: 'row' },
      { type: 'benefits', variant: 'cards' },
      { type: 'agenda', variant: 'timeline' },
      { type: 'speakers', variant: 'portrait-cards' },
      { type: 'venue', variant: 'image-left' },
      { type: 'faq', variant: 'accordion' },
      { type: 'form', variant: 'split-offer' },
      { type: 'organizer', variant: 'card' },
      { type: 'final_cta', variant: 'banner' },
      { type: 'footer', variant: 'simple' },
      { type: 'sticky_cta', variant: 'bar' },
    ],
  },
  techtalk: {
    id: 'techtalk',
    name: 'Tech Talk / Dev Summit (Hiện đại Bento)',
    description: 'Phong cách công nghệ cao cấp kết hợp 15 module với Bento Grid, số liệu ấn tượng, chuyên đề và nhà tài trợ',
    useCase: 'Hội nghị công nghệ, Hackathon, Dev Summit, AI Developer Day, ra mắt sản phẩm số',
    modules: [
      { type: 'nav', variant: 'bar' },
      { type: 'hero', variant: 'split-card' },
      { type: 'countdown', variant: 'boxes' },
      { type: 'stats', variant: 'row' },
      { type: 'bento', variant: 'grid-asymmetric' },
      { type: 'benefits', variant: 'numbered-rows' },
      { type: 'speakers', variant: 'portrait-cards' },
      { type: 'agenda', variant: 'timeline' },
      { type: 'venue', variant: 'image-left' },
      { type: 'sponsors', variant: 'grid-tiered' },
      { type: 'faq', variant: 'accordion' },
      { type: 'form', variant: 'split-benefit' },
      { type: 'final_cta', variant: 'banner' },
      { type: 'footer', variant: 'simple' },
      { type: 'sticky_cta', variant: 'rail-card' },
    ],
  },
  community: {
    id: 'community',
    name: 'Cộng đồng / Giao lưu mở',
    description: 'Thân thiện, nhiều ưu đãi kết hợp 16 module với phân loại đối tượng, lộ trình hoạt động và mạng lưới kết nối',
    useCase: 'Ngày hội sinh viên, câu lạc bộ, Open Day, networking mở, giao lưu cựu thành viên',
    modules: [
      { type: 'nav', variant: 'bar' },
      { type: 'hero', variant: 'center' },
      { type: 'countdown', variant: 'circles' },
      { type: 'offer_banner', variant: 'ribbon' },
      { type: 'audience', variant: 'chips' },
      { type: 'benefits', variant: 'cards' },
      { type: 'agenda', variant: 'timeline' },
      { type: 'speakers', variant: 'portrait-cards' },
      { type: 'venue', variant: 'image-left' },
      { type: 'sponsors', variant: 'grid-tiered' },
      { type: 'organizer', variant: 'card' },
      { type: 'faq', variant: 'accordion' },
      { type: 'form', variant: 'card' },
      { type: 'final_cta', variant: 'banner' },
      { type: 'footer', variant: 'simple' },
      { type: 'sticky_cta', variant: 'bar' },
    ],
  },
  gala: {
    id: 'gala',
    name: 'Gala VIP / Lễ kỷ niệm',
    description: 'Trang trọng, quý phái kết hợp 15 module với tâm điểm diễn giả danh dự, đơn vị bảo trợ và thiệp mời dạ tiệc',
    useCase: 'Lễ kỷ niệm thành lập, dạ tiệc vinh danh, trao giải thưởng, khai trương trang trọng',
    modules: [
      { type: 'nav', variant: 'bar' },
      { type: 'hero', variant: 'center' },
      { type: 'countdown', variant: 'circles' },
      { type: 'benefits', variant: 'cards' },
      { type: 'speakers', variant: 'portrait-cards' },
      { type: 'agenda', variant: 'timeline' },
      { type: 'venue', variant: 'image-left' },
      { type: 'sponsors', variant: 'grid-tiered' },
      { type: 'organizer', variant: 'card' },
      { type: 'faq', variant: 'accordion' },
      { type: 'form', variant: 'card' },
      { type: 'final_cta', variant: 'banner' },
      { type: 'footer', variant: 'simple' },
      { type: 'sticky_cta', variant: 'rail-card' },
    ],
  },
  compact: {
    id: 'compact',
    name: 'Rút gọn (Live Demo cấp tốc)',
    description: 'Tập trung tối đa vào 4 khu vực bắt buộc kết hợp các tiện ích chốt đơn cấp tốc',
    useCase: 'Sự kiện cấp tốc, chiến dịch chuyển đổi nhanh, kiểm thử nhanh trong vòng chung khảo',
    modules: [
      { type: 'nav', variant: 'bar' },
      { type: 'hero', variant: 'image-right' },
      { type: 'countdown', variant: 'boxes' },
      { type: 'benefits', variant: 'cards' },
      { type: 'agenda', variant: 'timeline' },
      { type: 'form', variant: 'card' },
      { type: 'final_cta', variant: 'banner' },
      { type: 'footer', variant: 'simple' },
      { type: 'sticky_cta', variant: 'bar' },
    ],
  },
};

export function createPresetModuleTree(presetId = 'workshop') {
  const preset = PRESET_TEMPLATES[presetId] || PRESET_TEMPLATES.workshop;
  const deletedTypes = getDeletedModuleTypes();
  return preset.modules
    .filter((m) => !deletedTypes.includes(m.type))
    .map((m) => {
      const safeVariant = getSafeVariant(m.type, m.variant);
      return createModuleInstance(m.type, { variant: safeVariant });
    });
}

/**
 * Tự động phân tích chủ đề sự kiện để suy luận bố cục (preset), bảng màu (colorTheme)
 * và phương pháp thiết kế tối ưu dựa trên nhu cầu của người dùng.
 */
export function inferPresetAndTheme(eventData = {}) {
  const name = (eventData.eventName || eventData.name || '').toLowerCase();
  const desc = (eventData.description || '').toLowerCase();
  const earlyBird = (eventData.earlyBirdOffer || '').toLowerCase();
  const venue = (eventData.venue || '').toLowerCase();
  const combined = `${name} ${desc} ${earlyBird} ${venue}`;

  // 1. Tech Talk / Dev Summit / Coding / AI
  const techKeywords = [
    'ai', 'vibe coding', 'coding', 'lập trình', 'tech', 'frontend', 'backend',
    'fullstack', 'developer', 'dev', 'summit', 'hackathon', 'phần mềm',
    'kỹ sư', 'data', 'cloud', 'api', 'robotics', 'machine learning', 'deep learning',
    'prompt', 'web3', 'blockchain', 'react', 'vite', 'javascript', 'python'
  ];
  if (techKeywords.some((kw) => combined.includes(kw))) {
    return {
      presetId: 'techtalk',
      colorTheme: 'purple',
      category: 'Công nghệ & Đổi mới sáng tạo',
      reasoning: 'Chủ đề Công nghệ & AI: Tự động kích hoạt bố cục Tech Talk với Bento Grid hiện đại, số liệu kỹ thuật nổi bật và form chia cột tối ưu tỷ lệ chuyển đổi cho dân công nghệ.',
    };
  }

  // 2. Gala VIP / Lễ kỷ niệm / Trao giải / Khai trương
  const galaKeywords = [
    'gala', 'kỷ niệm', 'trao giải', 'vip', 'sang trọng', 'tri ân',
    'dạ tiệc', 'lễ hội', 'grand opening', 'khai trương', 'tôn vinh',
    'thảm đỏ', 'anniversary', 'awards'
  ];
  if (galaKeywords.some((kw) => combined.includes(kw))) {
    return {
      presetId: 'gala',
      colorTheme: 'rose',
      category: 'Dạ tiệc & Kỷ niệm VIP',
      reasoning: 'Chủ đề Gala & Lễ kỷ niệm: Tự động áp dụng bố cục Gala VIP sang trọng với tâm điểm tôn vinh dàn diễn giả danh giá, đối tác tài trợ và khoảnh khắc đếm ngược trang trọng.',
    };
  }

  // 3. Cộng đồng / Sinh viên / CLB / Meetup / Networking
  const communityKeywords = [
    'cộng đồng', 'clb', 'câu lạc bộ', 'sinh viên', 'giao lưu', 'meetup',
    'kết nối', 'thanh niên', 'open day', 'ngày hội', 'tuổi trẻ', 'tình nguyện',
    'networking', 'hội thảo mở', 'chia sẻ kinh nghiệm'
  ];
  if (communityKeywords.some((kw) => combined.includes(kw))) {
    return {
      presetId: 'community',
      colorTheme: 'amber',
      category: 'Giao lưu & Cộng đồng',
      reasoning: 'Chủ đề Giao lưu Cộng đồng: Tự động áp dụng bố cục Community thân thiện, nổi bật nhóm đối tượng tham gia, ribbon ưu đãi độc quyền và dải tóm tắt lợi ích mở.',
    };
  }

  // 4. Rút gọn / Cấp tốc / Live Demo
  const compactKeywords = ['cấp tốc', 'siêu tốc', 'rút gọn', 'khẩn', 'flash', 'live demo', 'tối giản', 'nhanh'];
  if (compactKeywords.some((kw) => combined.includes(kw))) {
    return {
      presetId: 'compact',
      colorTheme: 'blue',
      category: 'Live Demo & Cấp tốc',
      reasoning: 'Chủ đề Tinh gọn & Cấp tốc: Tự động kích hoạt bố cục Compact tập trung tối đa vào 4 khu vực cốt lõi để tối ưu tốc độ quyết định và đăng ký ngay.',
    };
  }

  // 5. Mặc định: Hội thảo / Workshop chuyên môn
  return {
    presetId: 'workshop',
    colorTheme: 'blue',
    category: 'Hội thảo & Workshop chuyên môn',
    reasoning: 'Chủ đề Hội thảo & Workshop: Tự động áp dụng bố cục Workshop tiêu chuẩn toàn diện với dòng thời gian chi tiết, hồ sơ diễn giả và khối kêu gọi chốt hạ cuối trang.',
  };
}

/**
 * Danh sách các Bộ dữ liệu thử nghiệm (FR-52 -> FR-57)
 */
export const TEST_DATASETS = {
  real: {
    id: 'real',
    label: 'Dữ liệu dự án thật',
    description: 'Sử dụng dữ liệu bạn đã nhập trong WS1, WS2 và AI',
  },
  typical: {
    id: 'typical',
    label: 'Dữ liệu điển hình (Mẫu đẹp)',
    description: 'Dữ liệu tiêu chuẩn đầy đủ ảnh, diễn giả, ưu đãi và chương trình',
    event: {
      eventName: 'Workshop AI & Next-Gen Frontend 2026',
      eventDate: '2026-11-15',
      eventTime: '08:30',
      venue: 'Hội trường Innovation Hub, 180 Triệu Việt Vương, Hà Nội',
      earlyBirdOffer: 'Tặng Ebook Design System trị giá 600k & Vé mời VIP Networking',
      speakers: [
        { id: 's1', name: 'TS. Nguyễn Văn A', title: 'Giám đốc Công nghệ AI Lab' },
        { id: 's2', name: 'ThS. Trần Thị B', title: 'Senior Product Designer' },
      ],
      agenda: [
        { id: 'a1', time: '08:30', title: 'Đón tiếp, check-in và nhận quà lưu niệm' },
        { id: 'a2', time: '09:00', title: 'Phiên 1: Xu hướng AI Coding & Thiết kế Module' },
        { id: 'a3', time: '10:30', title: 'Phiên 2: Thực hành Live Demo & Hỏi đáp diễn giả' },
      ],
    },
    ai: {
      headline: 'Làm chủ kỷ nguyên AI Coding cùng các chuyên gia đầu ngành',
      description: 'Khám phá phương pháp xây dựng landing page và ứng dụng hiện đại với tốc độ gấp 10 lần. Cơ hội kết nối và học hỏi thực chiến dành cho Marketer và Developer.',
      benefits: [
        'Tiếp cận quy trình chuẩn Dev Mode và Design Tokens.',
        'Mở rộng kết nối cùng mạng lưới hơn 200 chuyên gia công nghệ.',
        'Nhận bộ tài liệu mẫu và chứng nhận tham gia sự kiện.',
      ],
    },
  },
  minimal: {
    id: 'minimal',
    label: 'Dữ liệu tối thiểu (Thiếu ảnh/phụ)',
    description: 'Chỉ có tên và thời gian, không có ảnh và không có mô tả dài',
    event: {
      eventName: 'Gặp mặt thành viên CLB',
      eventDate: '2026-11-20',
      eventTime: '18:00',
      venue: 'Phòng họp 302',
      earlyBirdOffer: '',
      speakers: [{ id: 's1', name: 'Ban tổ chức', title: '' }],
      agenda: [{ id: 'a1', time: '18:00', title: 'Họp mặt' }],
    },
    ai: {
      headline: 'Gặp mặt thân mật CLB',
      description: 'Buổi gặp gỡ định kỳ.',
      benefits: ['Giao lưu thành viên', 'Chia sẻ kinh nghiệm', 'Kế hoạch sắp tới'],
    },
  },
  empty: {
    id: 'empty',
    label: 'Dữ liệu rỗng (Kiểm tra lỗi)',
    description: 'Tất cả các trường đều để trống để kiểm tra khả năng phòng thủ của giao diện',
    event: {
      eventName: '',
      eventDate: '',
      eventTime: '',
      venue: '',
      earlyBirdOffer: '',
      speakers: [],
      agenda: [],
    },
    ai: {
      headline: '',
      description: '',
      benefits: [],
    },
  },
  long_text: {
    id: 'long_text',
    label: 'Văn bản rất dài (Kiểm tra tràn khung)',
    description: 'Tiêu đề và mô tả có độ dài cực đại để kiểm tra tự động xuống dòng và overflow-wrap',
    event: {
      eventName: 'Đại hội thường niên kỷ niệm 30 năm phát triển và ứng dụng trí tuệ nhân tạo toàn diện trong chuyển đổi số doanh nghiệp quy mô lớn khu vực Đông Nam Á năm 2026',
      eventDate: '2026-12-30',
      eventTime: '08:00',
      venue: 'Trung tâm Hội nghị Quốc tế Grand Palace Tower, Tầng 72, Tòa nhà Landmark Century, 999 Đại lộ Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh, Việt Nam',
      earlyBirdOffer: 'Miễn phí hoàn toàn 100% chi phí tham dự bao gồm tiệc trưa VIP 5 sao, gói quà tặng công nghệ cao cấp trị giá 15.000.000 VNĐ, tài khoản premium 1 năm và quyền truy cập không giới hạn vào toàn bộ kho tài nguyên nghiên cứu độc quyền.',
      speakers: [
        { id: 's1', name: 'Giáo sư - Tiến sĩ Khoa học Danh dự Nguyễn Hoàng Gia Bảo Long', title: 'Chủ tịch kiêm Tổng giám đốc điều hành Tập đoàn Công nghệ Trí tuệ Nhân tạo Đa quốc gia' },
      ],
      agenda: [
        { id: 'a1', time: '08:00', title: 'Tiếp đón đại biểu, phát kỷ yếu hội thảo dày 500 trang và hướng dẫn check-in bằng nhận diện khuôn mặt' },
      ],
    },
    ai: {
      headline: 'Đại hội đỉnh cao quy tụ hơn 5000 nhà lãnh đạo công nghệ và chuyên gia hàng đầu từ 20 quốc gia trên thế giới',
      description: 'Chương trình được thiết kế đặc biệt nhằm giải quyết triệt để những thách thức phức tạp nhất trong quá trình chuyển dịch mô hình kinh doanh truyền thống sang hệ sinh thái tự động hóa thông minh dựa trên nền tảng trí tuệ nhân tạo thế hệ mới.',
      benefits: [
        'Tiếp cận hệ thống giải pháp công nghệ toàn diện đã được kiểm chứng qua hơn 1000 dự án thực tế tại các tập đoàn Fortune 500.',
        'Mở rộng quan hệ hợp tác chiến lược cùng mạng lưới các nhà đầu tư mạo hiểm và quỹ đầu tư công nghệ hàng đầu khu vực.',
        'Được cố vấn trực tiếp 1-1 bởi các chuyên gia đầu ngành về lộ trình ứng dụng công nghệ phù hợp với điều kiện thực tiễn của doanh nghiệp.',
      ],
    },
  },
  special_chars: {
    id: 'special_chars',
    label: 'Ký tự đặc biệt & Tiếng Việt có dấu',
    description: 'Kiểm tra XSS, dấu nháy đơn/kép, dấu ngoặc nhọn, emoji và ký tự Unicode phức tạp',
    event: {
      eventName: '🔥 "Hội thảo Vibe Coding" & <Tech Trends> 2026: Cơ hội "vàng" — Đừng bỏ lỡ!',
      eventDate: '2026-11-25',
      eventTime: '14:00',
      venue: 'Tòa nhà C2 & D3 (Khu A), 100% máy lạnh — "Phòng Lab 4.0"',
      earlyBirdOffer: 'Ưu đãi "Early-Bird": Giảm ngay 50% cho SV & tặng áo thun "I ❤️ AI"!',
      speakers: [
        { id: 's1', name: 'Ông O\'Connor & TS. Lê Thùy Dương', title: 'Cố vấn cấp cao (Senior Advisor & CTO)' },
      ],
      agenda: [
        { id: 'a1', time: '14:00', title: 'Khởi động: "Warm-up" & Giới thiệu về <Vibe Coding>' },
      ],
    },
    ai: {
      headline: 'Chinh phục "Đỉnh cao công nghệ" cùng Vibe Coding 2026 🚀',
      description: 'Trải nghiệm phương pháp lập trình trực quan <Zero-to-One> với sự hỗ trợ của các mô hình ngôn ngữ lớn (LLMs). Không cần kiến thức chuyên sâu vẫn có thể tự tay tạo ra sản phẩm "cực chất"!',
      benefits: [
        'Học cách prompt hiệu quả & tối ưu hóa mã nguồn trong 15 phút.',
        'Làm quen với các công cụ: Cursor, Claude, Gemini & Copilot.',
        'Nhận chứng chỉ điện tử có chữ ký số "NFT-Verified" uy tín.',
      ],
    },
  },
};

/**
 * ==============================================================
 * DỮ LIỆU MẪU ĐỘC LẬP CHO DEV MODE (STANDALONE SANDBOX DATA)
 * Cung cấp ảnh mẫu, title mẫu, nội dung mẫu cho 12 module
 * Hoàn toàn không liên quan và không phụ thuộc vào dữ liệu dự án
 * ==============================================================
 */
export const DEV_SAMPLE_HERO_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
  <defs>
    <linearGradient id="gHero" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e11d48"/>
      <stop offset="50%" stop-color="#be123c"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
  </defs>
  <rect width="900" height="540" rx="20" fill="url(#gHero)"/>
  <circle cx="800" cy="120" r="160" fill="rgba(255,255,255,0.08)"/>
  <circle cx="120" cy="440" r="180" fill="rgba(255,255,255,0.06)"/>
  <rect x="70" y="70" width="130" height="36" rx="18" fill="rgba(255,255,255,0.2)"/>
  <text x="135" y="94" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">LIVE DEMO 2026</text>
  <text x="450" y="240" font-family="system-ui, sans-serif" font-size="42" font-weight="800" fill="#ffffff" text-anchor="middle">AI &amp; VIBE CODING SUMMIT</text>
  <text x="450" y="295" font-family="system-ui, sans-serif" font-size="22" font-weight="500" fill="#ffe4e8" text-anchor="middle">Kiến tạo tương lai với Lập trình trực quan &amp; Generative AI</text>
  <rect x="330" y="340" width="240" height="50" rx="25" fill="#ffffff" fill-opacity="0.25"/>
  <text x="450" y="372" font-family="system-ui, sans-serif" font-size="17" font-weight="600" fill="#ffffff" text-anchor="middle">Hội trường NIC · 15/11/2026</text>
</svg>
`)}`;

export const DEV_SAMPLE_VENUE_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="460" viewBox="0 0 800 460">
  <rect width="800" height="460" rx="16" fill="#f1f5f9"/>
  <path d="M0 120 Q200 160 400 110 T800 150" stroke="#cbd5e1" stroke-width="24" fill="none"/>
  <path d="M250 0 L280 460" stroke="#e2e8f0" stroke-width="16" fill="none"/>
  <path d="M520 0 L500 460" stroke="#e2e8f0" stroke-width="16" fill="none"/>
  <rect x="340" y="160" width="160" height="120" rx="12" fill="#e11d48" opacity="0.9"/>
  <text x="420" y="215" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">NIC Innovation Hub</text>
  <text x="420" y="240" font-family="system-ui, sans-serif" font-size="13" fill="#ffe4e8" text-anchor="middle">Tòa nhà HITC, Tầng 3</text>
  <circle cx="420" cy="140" r="14" fill="#ef4444"/>
  <circle cx="420" cy="140" r="6" fill="#ffffff"/>
</svg>
`)}`;

export const DEV_SAMPLE_CONTENT_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="gContent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#be123c"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" rx="16" fill="url(#gContent)"/>
  <text x="400" y="230" font-family="system-ui, sans-serif" font-size="32" font-weight="800" fill="#ffffff" text-anchor="middle">KHÔNG GIAN TRẢI NGHIỆM AI</text>
  <text x="400" y="280" font-family="system-ui, sans-serif" font-size="18" fill="#ffe4e8" text-anchor="middle">Khu vực Demo &amp; Networking công nghệ tương tác cao</text>
</svg>
`)}`;

export const makeSpeakerAvatarSvg = (name, color1 = '#e11d48', color2 = '#be123c') => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="gSpk_${name.length}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="150" fill="url(#gSpk_${name.length})"/>
  <circle cx="150" cy="115" r="50" fill="#ffffff" fill-opacity="0.9"/>
  <path d="M75 250 C75 195 110 185 150 185 C190 185 225 195 225 250 Z" fill="#ffffff" fill-opacity="0.9"/>
</svg>
`)}`;

export const makeWordmarkSvg = (text, bg = '#f8fafc', color = '#334155') => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60">
  <rect width="180" height="60" rx="8" fill="${bg}" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="90" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${color}" text-anchor="middle" letter-spacing="0.05em">${text}</text>
</svg>
`)}`;

export const DEV_SAMPLE_QR_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#ffffff" rx="12"/>
  <rect x="20" y="20" width="50" height="50" rx="6" fill="#1e293b"/>
  <rect x="28" y="28" width="34" height="34" rx="4" fill="#ffffff"/>
  <rect x="36" y="36" width="18" height="18" rx="2" fill="#1e293b"/>
  <rect x="130" y="20" width="50" height="50" rx="6" fill="#1e293b"/>
  <rect x="138" y="28" width="34" height="34" rx="4" fill="#ffffff"/>
  <rect x="146" y="36" width="18" height="18" rx="2" fill="#1e293b"/>
  <rect x="20" y="130" width="50" height="50" rx="6" fill="#1e293b"/>
  <rect x="28" y="138" width="34" height="34" rx="4" fill="#ffffff"/>
  <rect x="36" y="146" width="18" height="18" rx="2" fill="#1e293b"/>
  <rect x="85" y="25" width="10" height="10" fill="#1e293b"/>
  <rect x="105" y="25" width="10" height="10" fill="#1e293b"/>
  <rect x="85" y="45" width="10" height="10" fill="#1e293b"/>
  <rect x="105" y="55" width="10" height="10" fill="#1e293b"/>
  <rect x="25" y="85" width="10" height="10" fill="#1e293b"/>
  <rect x="45" y="95" width="10" height="10" fill="#1e293b"/>
  <rect x="65" y="85" width="10" height="10" fill="#1e293b"/>
  <rect x="85" y="85" width="30" height="30" rx="4" fill="#e11d48"/>
  <rect x="125" y="85" width="10" height="10" fill="#1e293b"/>
  <rect x="145" y="95" width="10" height="10" fill="#1e293b"/>
  <rect x="165" y="85" width="10" height="10" fill="#1e293b"/>
  <rect x="85" y="135" width="10" height="10" fill="#1e293b"/>
  <rect x="105" y="145" width="10" height="10" fill="#1e293b"/>
  <rect x="135" y="135" width="10" height="10" fill="#1e293b"/>
  <rect x="155" y="145" width="10" height="10" fill="#1e293b"/>
  <rect x="135" y="165" width="20" height="10" fill="#1e293b"/>
</svg>
`)}`;

export const STANDALONE_DEV_MOCK_DATA = {
  event: {
    eventName: 'Hội thảo AI & Vibe Coding Vietnam 2026',
    eventDate: '2026-11-20',
    eventTime: '08:30',
    venue: 'Trung tâm Đổi mới Sáng tạo Quốc gia (NIC), Tòa nhà HITC, Cầu Giấy, Hà Nội',
    venueAddress: '239 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    venueNotes: 'Tầng 3 Hội trường A1, bãi đỗ xe ô tô & xe máy miễn phí',
    earlyBirdOffer: 'Tặng bộ Ebook Vibe Coding trị giá 500.000đ & Áo thun độc quyền cho 50 vé đầu tiên',
    earlyBirdDeadline: '2026-11-10',
    speakers: [
      { id: 'spk_1', name: 'TS. Nguyễn Văn An', title: 'Viện trưởng Viện Nghiên cứu Trí tuệ Nhân tạo' },
      { id: 'spk_2', name: 'ThS. Trần Thị Mai Phương', title: 'Lead AI Architect @ TechCorp Global' },
      { id: 'spk_3', name: 'Ông Lê Hoàng Minh', title: 'Chuyên gia Thiết kế Hệ thống & Vibe Coder' },
    ],
    agenda: [
      { id: 'ag_1', time: '08:30 - 09:00', title: 'Đón tiếp, Check-in & Trải nghiệm khu vực công nghệ Demo' },
      { id: 'ag_2', time: '09:00 - 10:30', title: 'Khai mạc & Keynote: Kỷ nguyên mới của Vibe Coding và Lập trình Tự động' },
      { id: 'ag_3', time: '10:30 - 12:00', title: 'Thực chiến: Xây dựng Landing Page đa nền tảng trong 15 phút' },
      { id: 'ag_4', time: '13:30 - 16:30', title: 'Tọa đàm Q&A với các diễn giả & Rút thăm trúng thưởng' },
    ],
  },
  ai: {
    headline: 'Chinh phục kỷ nguyên Vibe Coding cùng các chuyên gia đầu ngành',
    description: 'Khám phá phương pháp xây dựng landing page và ứng dụng hiện đại với tốc độ gấp 10 lần. Cơ hội kết nối và học hỏi thực chiến dành cho Marketer và Developer.',
    benefits: [
      'Học cách thiết kế và tối ưu module landing page thích ứng mọi thiết bị.',
      'Làm chủ quy trình phát triển sản phẩm với sự hỗ trợ của Generative AI.',
      'Nhận trọn bộ tài liệu thực hành và chứng nhận hoàn thành độc quyền.',
    ],
  },
  formFields: [
    { key: 'fld_name', label: 'Họ và tên', type: 'text', required: true, hint: 'Nguyễn Văn A' },
    { key: 'fld_email', label: 'Email liên hệ', type: 'email', required: true, hint: 'example@domain.com' },
    { key: 'fld_tel', label: 'Số điện thoại', type: 'tel', required: true, hint: '0912 345 678' },
    { key: 'fld_msv', label: 'Mã sinh viên / Công ty', type: 'text', required: false, hint: 'Đại học Quốc gia Hà Nội' },
    { key: 'fld_note', label: 'Câu hỏi cho diễn giả', type: 'text', required: false, hint: 'Tôi muốn hỏi về xu hướng AI trong năm tới...' },
  ],
  assets: [
    {
      id: 'ast_hero',
      role: 'hero',
      caption: 'Poster chính thức Hội thảo AI & Vibe Coding Vietnam 2026',
      dataUrl: '/sample-assets/event_poster.svg',
      url: '/sample-assets/event_poster.svg',
      name: 'Poster sự kiện Cyber Tech 2026',
      width: 1200,
      height: 630,
      sizeKB: 14,
    },
    {
      id: 'ast_spk_1',
      role: 'speaker',
      speakerRef: 'spk_1',
      caption: 'Chân dung TS. Nguyễn Văn An - Viện trưởng Viện Nghiên cứu Trí tuệ Nhân tạo',
      dataUrl: '/sample-assets/speaker_1.jpg',
      url: '/sample-assets/speaker_1.jpg',
      name: 'Chân dung AI TS. Nguyễn Văn An',
      width: 1024,
      height: 1024,
      sizeKB: 686,
    },
    {
      id: 'ast_spk_2',
      role: 'speaker',
      speakerRef: 'spk_2',
      caption: 'Chân dung ThS. Trần Thị Mai Phương - Lead AI Architect @ TechCorp Global',
      dataUrl: '/sample-assets/speaker_2.jpg',
      url: '/sample-assets/speaker_2.jpg',
      name: 'Chân dung AI ThS. Trần Thị Mai Phương',
      width: 1024,
      height: 1024,
      sizeKB: 642,
    },
    {
      id: 'ast_spk_3',
      role: 'speaker',
      speakerRef: 'spk_3',
      caption: 'Chân dung Ông Lê Hoàng Minh - Chuyên gia Thiết kế Hệ thống & Vibe Coder',
      dataUrl: '/sample-assets/speaker_3.jpg',
      url: '/sample-assets/speaker_3.jpg',
      name: 'Chân dung AI Ông Lê Hoàng Minh',
      width: 1024,
      height: 1024,
      sizeKB: 725,
    },
    {
      id: 'ast_venue',
      role: 'venue',
      caption: 'Không gian hội trường Tầng 3 NIC Innovation Hub 150 chỗ ngồi',
      dataUrl: '/sample-assets/venue_auditorium.svg',
      url: '/sample-assets/venue_auditorium.svg',
      name: 'Hội trường sự kiện NIC',
      width: 800,
      height: 500,
      sizeKB: 8,
    },
    {
      id: 'ast_gift',
      role: 'gift',
      caption: 'Bộ quà tặng Ebook Vibe Coding trị giá 500.000đ và cúp vinh danh',
      dataUrl: '/sample-assets/prizes_awards.svg',
      url: '/sample-assets/prizes_awards.svg',
      name: 'Bộ quà tặng & Giải thưởng',
      width: 800,
      height: 500,
      sizeKB: 12,
    },
    {
      id: 'ast_content',
      role: 'image_content',
      caption: 'Khu vực trưng bày công nghệ & quà tặng lưu niệm',
      dataUrl: '/sample-assets/prizes_awards.svg',
      url: '/sample-assets/prizes_awards.svg',
      name: 'Khu vực trải nghiệm công nghệ',
      width: 800,
      height: 500,
      sizeKB: 12,
    },
  ],
  nav: {
    logoText: 'VIBE CODING 2026',
    links: [
      { id: 'hero', label: 'Tổng quan' },
      { id: 'agenda', label: 'Chương trình' },
      { id: 'speakers', label: 'Diễn giả' },
      { id: 'venue', label: 'Địa điểm' },
      { id: 'form', label: 'Đăng ký' },
    ],
    ctaText: 'Đăng ký ngay',
  },
  socialProof: {
    liveCount: 128,
    capacity: 150,
    recentNames: ['Hoàng M.', 'Thùy D.', 'Anh T.', 'Minh N.', 'Phương L.'],
  },
  stats: [
    { id: 'st_1', value: '3+', label: 'Giờ nội dung thực chiến', subtext: 'Từ lý thuyết đến ứng dụng' },
    { id: 'st_2', value: '3', label: 'Diễn giả chuyên gia', subtext: 'Kinh nghiệm hàng đầu lĩnh vực' },
    { id: 'st_3', value: '150', label: 'Suất tham dự trực tiếp', subtext: 'Hội trường chuẩn quốc tế' },
    { id: 'st_4', value: '100%', label: 'Miễn phí hoàn toàn', subtext: 'Tài trợ bởi Ban Tổ Chức' },
  ],
  audience: [
    { id: 'aud_1', title: 'Lập trình viên & Kỹ sư Phần mềm', badge: 'Devs', description: 'Muốn tăng tốc quy trình lập trình và tích hợp AI vào dự án thực tế.' },
    { id: 'aud_2', title: 'Product Manager & UI/UX Designer', badge: 'Designers', description: 'Nắm bắt xu hướng kiến trúc giao diện tương thích đa thiết bị cực nhanh.' },
    { id: 'aud_3', title: 'Sinh viên & Người chuyển ngành', badge: 'Students', description: 'Tiếp cận tư duy Vibe Coding hiện đại từ các chuyên gia đầu ngành.' },
  ],
  bento: [
    { id: 'b_1', title: 'Lộ trình từ Zero đến Fullstack', desc: 'Xây dựng toàn diện ứng dụng hiện đại chỉ với phương pháp Prompt & Iterate.', span: 'large' },
    { id: 'b_2', title: '100% Thực chiến Live Coding', desc: 'Không lý thuyết suông — xem trực tiếp diễn giả dựng landing page.', span: 'small' },
    { id: 'b_3', title: 'Chứng chỉ NFT Verified', desc: 'Lưu trữ thành tích vĩnh viễn trên chuỗi khối.', span: 'small' },
    { id: 'b_4', title: 'Cơ hội Networking Độc quyền', desc: 'Kết nối trực tiếp cùng 150+ kỹ sư và nhà sáng lập công nghệ.', span: 'medium' },
  ],
  howItWorks: [
    { step: '01', title: 'Điền form đăng ký', desc: 'Cung cấp họ tên, email và số điện thoại bên dưới chỉ mất 30 giây.' },
    { step: '02', title: 'Nhận vé & QR qua Email', desc: 'Hệ thống gửi thư xác nhận tự động kèm mã QR check-in tại cửa hội trường.' },
    { step: '03', title: 'Tham dự & Trải nghiệm', desc: 'Có mặt đúng giờ tại Innovation Hub NIC lúc 08:30 ngày 20/11/2026.' },
  ],
  sponsors: [
    { tier: 'Bảo trợ truyền thông', logos: ['TechVn Hub', 'AI Innovators', 'Vietnam Dev Club'] },
    { tier: 'Đồng hành công nghệ', logos: ['CloudVibe Global', 'CodeNext Solutions'] },
  ],
  finalCta: {
    headline: 'Đừng bỏ lỡ cơ hội bứt phá cùng Vibe Coding 2026',
    subtext: 'Chỉ còn số lượng có hạn 22 vé miễn phí cuối cùng. Đăng ký ngay trước khi đóng cổng ghi danh!',
    buttonText: 'Giữ chỗ miễn phí ngay',
    urgencyText: '🔥 Hơn 128 người đã đăng ký hôm nay',
  },
  shareCalendar: {
    calendarLinks: {
      google: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=AI+%26+Vibe+Coding+Summit+2026',
      apple: '#download-ics',
      outlook: '#outlook-calendar',
    },
    shareUrl: 'https://vibecoding2026.vn/event/ai-summit',
    qrSvg: DEV_SAMPLE_QR_SVG,
  },
  organizer: {
    orgName: 'Ban Tổ Chức AI & Vibe Coding Vietnam',
    tagline: 'Cộng đồng Kết nối Kỹ sư Công nghệ & Nhà sáng tạo số',
    contactEmail: 'contact@vibecoding.vn',
    hotline: '024 3999 8888',
    address: '239 Xuân Thủy, Cầu Giấy, Hà Nội',
  },
  stickyCta: {
    title: 'Hội thảo AI & Vibe Coding 2026',
    offerText: 'Tặng Ebook 500k cho 50 vé đầu',
    buttonText: 'Đăng ký tham dự',
  },
  faq: [
    { q: 'Sự kiện có thu phí tham dự không?', a: 'Sự kiện hoàn toàn MIỄN PHÍ dành cho tất cả những ai yêu thích công nghệ, lập trình trực quan và Generative AI.' },
    { q: 'Tôi không biết code thì có tham gia được không?', a: 'Hoàn toàn được! Vibe Coding hướng tới phương pháp tư duy sản phẩm và kiến trúc cùng AI, rất phù hợp cho người mới bắt đầu.' },
    { q: 'Tôi cần mang theo những gì khi tham gia?', a: 'Bạn nên mang theo máy tính xách tay (laptop) đã sạc đầy pin để trực tiếp thực hành trong phiên Live Demo.' },
    { q: 'Sự kiện có cấp chứng nhận tham dự không?', a: 'Có. Tất cả người tham dự check-in trực tiếp sẽ được gửi chứng nhận số hoàn thành hội thảo qua email.' },
  ],

  // Mock data cho 12 module Workshop mới
  quickFacts: [
    { icon: '🗓', label: 'Thời gian', value: '20/11/2026 · 08:30' },
    { icon: '📍', label: 'Địa điểm', value: 'Innovation Hub NIC, Hà Nội' },
    { icon: '🎟', label: 'Vé tham dự', value: 'Miễn phí 100%' },
    { icon: '⏱', label: 'Thời lượng', value: '3.5 Giờ thực chiến' },
    { icon: '🌐', label: 'Ngôn ngữ', value: 'Tiếng Việt' },
    { icon: '👥', label: 'Quy mô', value: '150 Chỗ ngồi' },
  ],
  outcomes: [
    { title: 'Landing Page hoàn chỉnh', desc: 'Tự tay dựng sản phẩm thực chiến có mã nguồn tải về sau buổi học.', icon: '🚀' },
    { title: 'Bộ Prompt AI độc quyền', desc: '100+ prompt chuẩn hóa cho UI/UX, copy và logic nghiệp vụ.', icon: '📑' },
    { title: 'Chứng nhận NFT Verified', desc: 'Chứng nhận số chính danh xác thực kỹ năng Vibe Coding.', icon: '🏅' },
    { title: 'Mạng lưới kết nối 150+ kỹ sư', desc: 'Gia nhập cộng đồng kỹ sư công nghệ và nhà sáng lập trẻ.', icon: '💬' },
  ],
  prerequisites: {
    bring: [
      'Laptop có kết nối Wifi và sạc pin đầy',
      'Trình duyệt Chrome hoặc Edge bản mới nhất',
      'Tài khoản GitHub và Google cá nhân',
    ],
    know: [
      'Khái niệm web cơ bản (HTML/CSS sơ khởi)',
      'Tư duy logic giải quyết vấn đề',
      'Không bắt buộc thành thạo lập trình trước',
    ],
    level: 'Cơ bản đến Trung cấp',
  },
  painSolution: [
    {
      pain: 'Mất nhiều tuần để viết code giao diện thủ công từ con số 0',
      solution: 'Xây dựng trang đích đa nền tảng chỉ trong 15 phút với tư duy Vibe Coding',
    },
    {
      pain: 'Thiếu người hướng dẫn thực chiến khi gặp lỗi logic do AI sinh ra',
      solution: 'Được các chuyên gia kỳ cựu trực tiếp gỡ lỗi và giải đáp 1-1 tại hội trường',
    },
    {
      pain: 'Khó đồng bộ thiết kế responsive trên màn hình điện thoại gập và tablet',
      solution: 'Làm chủ kiến trúc Container Query co giãn mượt mà từ 280px đến 1920px',
    },
  ],
  ticketTiers: [
    {
      name: 'Tiêu chuẩn',
      price: 'Miễn phí',
      tag: 'Cơ bản',
      features: ['Tham dự trực tiếp tại hội trường', 'Nhận tài liệu slide sau sự kiện', 'Hỏi đáp Q&A cùng diễn giả'],
    },
    {
      name: 'Thực chiến VIP',
      price: '299.000đ',
      tag: 'Phổ biến nhất',
      isPopular: true,
      features: ['Vị trí ngồi hàng đầu ưu tiên', 'Bộ Prompt AI & Source Code mẫu', 'Chứng nhận NFT Verified', 'Tiệc trà Networking độc quyền'],
    },
    {
      name: 'Doanh nghiệp / Team',
      price: '599.000đ',
      tag: 'Team 3 người',
      features: ['3 Vé VIP đầy đủ quyền lợi', 'Bàn thảo luận riêng cùng chuyên gia', 'Tặng 1 buổi tư vấn kiến trúc AI'],
    },
  ],
  tools: [
    { name: 'Antigravity IDE', role: 'Môi trường AI Studio' },
    { name: 'Gemini 2.5 Pro', role: 'Mô hình tư duy AI' },
    { name: 'React 19', role: 'Kiến trúc giao diện' },
    { name: 'Vite 8', role: 'Đóng gói siêu tốc' },
    { name: 'Container Queries', role: 'Responsive đa thiết bị' },
    { name: 'Node.js 22', role: 'Nền tảng kiểm thử' },
  ],
  comparison: {
    criteria: [
      { name: 'Thời gian hoàn thiện giao diện', selfLearn: '1 - 2 Tuần code thủ công', workshop: '15 Phút tự động hóa cao' },
      { name: 'Chi phí công cụ & giấy phép', selfLearn: 'Tốn kém license phần mềm', workshop: '100% Công cụ mở miễn phí' },
      { name: 'Độ tương thích đa màn hình', selfLearn: 'Dễ vỡ khung trên mobile', workshop: 'Chuẩn mượt từ 280px - 1920px' },
      { name: 'Khả năng tích hợp AI', selfLearn: 'Khó kết nối API ổn định', workshop: 'Kiến trúc bảo vệ AI Guard' },
      { name: 'Tự động kiểm định lỗi', selfLearn: 'Tự mò mẫm test tay', workshop: 'Auditor Engine quét tự động' },
    ],
  },
  quoteBlock: {
    quote: 'Tương lai của lập trình không phải là gõ từng dòng cú pháp, mà là khả năng giao tiếp và kiến trúc hệ thống cùng AI.',
    author: 'TS. Nguyễn Văn A',
    title: 'Chuyên gia Trí tuệ Nhân tạo & Cố vấn Công nghệ ELS',
  },
  testimonials: [
    {
      name: 'Minh Hoàng',
      role: 'Frontend Engineer @ TechCorp',
      comment: 'Buổi workshop đã thay đổi hoàn toàn cách tôi làm việc. Từ việc mất cả ngày làm UI, nay tôi dựng landing page responsive chỉ trong nửa tiếng!',
    },
    {
      name: 'Thu Thảo',
      role: 'Product Manager @ FinTech Vibe',
      comment: 'Không khí cực kỳ nhiệt huyết và thực chiến. Diễn giả hướng dẫn chi tiết từng câu lệnh prompt và cách kiểm soát rủi ro AI.',
    },
    {
      name: 'Quốc Bảo',
      role: 'Sinh viên ĐH Bách Khoa',
      comment: 'Kiến thức Container Query và thiết kế module mở ra tư duy hoàn toàn mới cho em. Rất đáng giá!',
    },
  ],
  gallery: [
    '/sample-assets/networking_venue.svg',
    '/sample-assets/speaker_demo.svg',
    '/sample-assets/prizes_awards.svg',
    '/sample-assets/workshop_coding.svg',
  ],
  videoTeaser: {
    title: 'Khám phá không gian thực chiến Vibe Coding 2026',
    duration: '02:15',
    placeholderText: 'Xem video giới thiệu hành trình sự kiện',
  },
  announcementBar: {
    text: '🔥 Đã mở cổng ghi danh đợt 2! Chỉ còn 22 vé miễn phí cuối cùng.',
    ctaText: 'Đăng ký giữ chỗ',
  },
};

