/**
 * @file elsSchema.js
 * Mô hình dữ liệu chuẩn cho Event Landing Studio theo FDD thiet-ke-chuc-nang-event-landing-studio.md
 */

export const ELS_SCHEMA_VERSION = 1;

export const ELS_STORAGE_KEYS = {
  PROJECTS: 'els:v1:projects',
  ASSETS_PREFIX: 'els:v1:assets:',
  REGISTRATIONS_PREFIX: 'els:v1:registrations:',
  META: 'els:v1:meta',
};

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  EMAIL: 'email',
  TEL: 'tel',
};

export const FIELD_ROLES = {
  DISPLAY_NAME: 'displayName',
  IDENTITY: 'identity',
};

export const ASSET_ROLES = {
  SPEAKER: 'speaker',
  VENUE: 'venue',
  GIFT: 'gift',
  OTHER: 'other',
};

export const TONES = {
  PROFESSIONAL: 'professional',
  FRIENDLY: 'friendly',
  PREMIUM: 'premium',
};

/**
 * ĐỊNH DANH TRƯỜNG DỮ LIỆU NỘI DUNG AI DUY NHẤT (Single Source of Truth - SYS-05)
 */
export const AI_FIELDS = {
  HEADLINE: 'headline',
  DESCRIPTION: 'description',
  BENEFITS: 'benefits',
  BULLETS: 'bullets',
  DESIGN_REASONING: 'designReasoning',
  RECOMMENDED_PRESET: 'recommendedPreset',
  RECOMMENDED_SPEAKER_VARIANT: 'recommendedSpeakerVariant',
  COLOR_THEME: 'colorTheme',
  IMAGE_ASSIGNMENTS: 'imageAssignments',
};

/**
 * ĐỊNH DANH TRƯỜNG DỮ LIỆU SỰ KIỆN DUY NHẤT (Single Source of Truth - SYS-05)
 */
export const EVENT_FIELDS = {
  NAME: 'eventName',
  DATE: 'eventDate',
  TIME: 'eventTime',
  VENUE: 'venue',
  SPEAKERS: 'speakers',
  EARLY_BIRD: 'earlyBirdOffer',
  EARLY_BIRD_DEADLINE: 'earlyBirdDeadline',
  AGENDA: 'agenda',
  CAPACITY: 'capacity',
};

/**
 * Chuẩn hóa đối tượng thông tin sự kiện từ các nguồn khác nhau (Form, AI output, Legacy input)
 * về cấu trúc chuẩn hóa duy nhất của ELS (Single Source of Truth - SYS-05).
 */
export function normalizeEventInput(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    return {
      [EVENT_FIELDS.NAME]: '',
      [EVENT_FIELDS.DATE]: '',
      [EVENT_FIELDS.TIME]: '09:00',
      [EVENT_FIELDS.VENUE]: '',
      [EVENT_FIELDS.SPEAKERS]: [],
      [EVENT_FIELDS.EARLY_BIRD]: '',
      [EVENT_FIELDS.EARLY_BIRD_DEADLINE]: '',
      [EVENT_FIELDS.AGENDA]: [],
      [EVENT_FIELDS.CAPACITY]: 0,
    };
  }

  const eventName = (raw.eventName || raw.name || raw.title || '').trim();

  let eventDate = (raw.eventDate || raw.date || '').trim();
  let eventTime = (raw.eventTime || raw.time || '09:00').trim();
  if (raw.datetime && typeof raw.datetime === 'string' && raw.datetime.includes('T')) {
    const parts = raw.datetime.split('T');
    eventDate = eventDate || parts[0];
    eventTime = eventTime || parts[1].slice(0, 5);
  }

  const venue = (raw.venue || raw.location || '').trim();
  const earlyBirdOffer = (raw.earlyBirdOffer || raw.earlyBird || '').trim();

  let speakers = raw.speakers;
  if (typeof speakers === 'string') {
    speakers = speakers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({ id: `spk_${idx + 1}`, name, title: '', assetId: null }));
  } else if (!Array.isArray(speakers)) {
    speakers = [];
  }

  let agenda = Array.isArray(raw.agenda) ? raw.agenda : [];

  return {
    [EVENT_FIELDS.NAME]: eventName,
    [EVENT_FIELDS.DATE]: eventDate,
    [EVENT_FIELDS.TIME]: eventTime,
    [EVENT_FIELDS.VENUE]: venue,
    [EVENT_FIELDS.SPEAKERS]: speakers,
    [EVENT_FIELDS.EARLY_BIRD]: earlyBirdOffer,
    [EVENT_FIELDS.EARLY_BIRD_DEADLINE]: raw.earlyBirdDeadline || '',
    [EVENT_FIELDS.AGENDA]: agenda,
    [EVENT_FIELDS.CAPACITY]: Number(raw.capacity || 0),
  };
}

/**
 * Sinh ID duy nhất với tiền tố
 */
export function generateId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Sinh mã đăng ký DK-XXXXXX dễ đọc (loại bỏ ký tự dễ nhầm 0/O, 1/I)
 */
export function generateRegistrationCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) {
      result += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `DK-${result}`;
}

/**
 * Sinh slug thân thiện từ tên
 */
export function generateSlug(name) {
  if (!name) return `event-${Date.now().toString(36)}`;
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${clean || 'event'}-${suffix}`;
}

/**
 * Bộ trường mặc định của Form đăng ký (WS2) tuân thủ nguyên tắc "chỉ thu thập trường cần thiết" (ADR-12, GAP-F7)
 */
export function createDefaultFormFields() {
  return [
    {
      key: 'fld_name',
      label: 'Họ và tên',
      type: FIELD_TYPES.TEXT,
      required: true,
      role: FIELD_ROLES.DISPLAY_NAME,
      hint: 'Họ và tên đầy đủ của người tham dự',
      deleted: false,
    },
    {
      key: 'fld_email',
      label: 'Email',
      type: FIELD_TYPES.EMAIL,
      required: true,
      role: FIELD_ROLES.IDENTITY,
      hint: 'Email nhận thông báo vé mời và tài liệu',
      deleted: false,
    },
    {
      key: 'fld_phone',
      label: 'Số điện thoại',
      type: FIELD_TYPES.TEL,
      required: false,
      role: null,
      hint: 'Số điện thoại liên hệ (tùy chọn)',
      deleted: false,
    },
  ];
}

/**
 * Khởi tạo một Project mới
 */
export function createProject({
  id = generateId('prj'),
  name = '',
  slug = null,
  status = PROJECT_STATUS.DRAFT,
  event = {},
  formFields = null,
  ai = null,
} = {}) {
  const now = new Date().toISOString();
  return {
    id,
    slug: slug || generateSlug(name),
    name: name.trim(),
    status,
    createdAt: now,
    updatedAt: now,
    event: {
      eventName: event.eventName || name.trim(),
      eventDate: event.eventDate || '',
      eventTime: event.eventTime || '09:00',
      venue: event.venue || '',
      description: event.description || '',
      speakers: Array.isArray(event.speakers) && event.speakers.length > 0
        ? event.speakers
        : [{ id: generateId('spk'), name: '', title: '', assetId: null }],
      earlyBirdOffer: event.earlyBirdOffer || '',
      earlyBirdDeadline: event.earlyBirdDeadline || '',
      agenda: Array.isArray(event.agenda) && event.agenda.length > 0
        ? event.agenda
        : [
            { id: generateId('ag'), time: '09:00', title: 'Đón tiếp & Check-in' },
            { id: generateId('ag'), time: '09:30', title: 'Khai mạc & Nội dung chính' },
          ],
    },
    formFields: formFields || createDefaultFormFields(),
    ai: ai || {
      source: 'mock',
      generatedAt: null,
      headline: '',
      description: '',
      benefits: ['', '', ''],
      edited: false,
    },
  };
}

/**
 * Khởi tạo một đối tượng ảnh nguồn (AssetImage)
 */
export function createAssetImage({
  id = generateId('img'),
  projectId,
  dataUrl,
  caption = '',
  role = ASSET_ROLES.OTHER,
  speakerRef = null,
  width = 0,
  height = 0,
  sizeKB = 0,
}) {
  return {
    id,
    projectId,
    dataUrl,
    caption: caption.trim(),
    role,
    speakerRef,
    width,
    height,
    sizeKB,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Khởi tạo bản ghi đăng ký (Registration)
 */
export function createRegistrationRecord({
  id = generateId('reg'),
  code = null,
  projectId,
  values = {},
  displayName = '',
  identityKey = '',
  source = 'landing',
  status = 'confirmed',
  checkedIn = false,
  checkInTime = null,
}) {
  return {
    id,
    code: code || generateRegistrationCode(),
    projectId,
    values,
    displayName: displayName.trim(),
    identityKey: (identityKey || '').trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    status,
    source, // 'landing' | 'preview'
    checkedIn: Boolean(checkedIn),
    checkInTime: checkInTime || null,
  };
}

