/**
 * @file schema.js
 * Định nghĩa cấu trúc dữ liệu và các hằng số chuẩn cho toàn bộ ứng dụng.
 */

export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  EVENTS: 'epb:v1:events',
  ACTIVE: 'epb:v1:active',
  DRAFT: 'epb:v1:draft',
  REG_PREFIX: 'epb:v1:regs:',
};

export const THEMES = {
  CLASSIC: 'classic',
  MIDNIGHT: 'midnight',
  SUNRISE: 'sunrise',
  MINIMAL: 'minimal',
};

export const TONES = {
  PROFESSIONAL: 'professional',
  FRIENDLY: 'friendly',
  PREMIUM: 'premium',
};

export const DEFAULT_FORM_DATA = {
  name: '',
  date: '',
  time: '08:00',
  location: '',
  speakers: '',
  earlyBird: '',
  agenda: '',
  tone: TONES.PROFESSIONAL,
  theme: THEMES.CLASSIC,
};

/**
 * Tạo một EventPage object chuẩn hóa
 */
export function createEventPage({
  id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  name = '',
  startAt = '',
  location = '',
  speakers = [],
  earlyBird = '',
  agenda = [],
  agendaIsSample = false,
  content = {
    headline: '',
    description: '',
    benefits: [],
    source: 'ai',
    model: 'gemini',
    generatedAt: new Date().toISOString(),
    tone: TONES.PROFESSIONAL,
  },
  theme = THEMES.CLASSIC,
  status = 'published',
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    name,
    startAt,
    location,
    speakers: Array.isArray(speakers) ? speakers : [],
    earlyBird,
    agenda: Array.isArray(agenda) ? agenda : [],
    agendaIsSample,
    content,
    theme,
    status,
    createdAt,
  };
}

/**
 * Tạo một Registration object chuẩn hóa
 */
export function createRegistration({
  id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `reg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  eventId,
  fullName = '',
  email = '',
  phone = '',
  status = 'confirmed',
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    eventId,
    fullName,
    email,
    phone,
    status,
    createdAt,
  };
}

