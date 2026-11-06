import { STORAGE_KEYS, createEventPage, createRegistration } from '../domain/schema.js';
import { validateRegistration } from '../domain/validators.js';
import { normalizeEmail, normalizePhone } from '../domain/normalize.js';

/**
 * Helper an toàn đọc localStorage
 */
function safeGet(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn(`[repository] Lỗi đọc key ${key}:`, err);
    return defaultValue;
  }
}

/**
 * Helper an toàn ghi localStorage và đọc lại để xác nhận
 */
function safeSet(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    // Đọc lại để kiểm tra tính toàn vẹn (bền vững)
    const verified = localStorage.getItem(key);
    return verified !== null;
  } catch (err) {
    console.error(`[repository] Không thể lưu vào LocalStorage (có thể do đầy bộ nhớ hoặc bị chặn):`, err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export const eventRepo = {
  /**
   * Lấy danh sách tất cả sự kiện đã lưu
   */
  list() {
    const list = safeGet(STORAGE_KEYS.EVENTS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Lấy một sự kiện theo ID
   */
  get(id) {
    if (!id) return null;
    const events = this.list();
    return events.find((e) => e.id === id) || null;
  },

  /**
   * Lưu hoặc cập nhật một sự kiện
   */
  save(eventData) {
    const events = this.list();
    const event = createEventPage(eventData);
    const existingIndex = events.findIndex((e) => e.id === event.id);

    if (existingIndex > -1) {
      events[existingIndex] = event;
    } else {
      events.unshift(event);
    }

    const ok = safeSet(STORAGE_KEYS.EVENTS, events);
    if (ok) {
      this.setActiveId(event.id);
    }
    return { ok, event };
  },

  /**
   * Xóa một sự kiện theo ID
   */
  remove(id) {
    const events = this.list().filter((e) => e.id !== id);
    safeSet(STORAGE_KEYS.EVENTS, events);
    try {
      localStorage.removeItem(`${STORAGE_KEYS.REG_PREFIX}${id}`);
      if (this.getActiveId() === id) {
        this.clearActiveId();
      }
    } catch {}
  },

  /**
   * Lấy ID của sự kiện đang mở (phục vụ giữ trang sau F5)
   */
  getActiveId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE);
    } catch {
      return null;
    }
  },

  /**
   * Đặt sự kiện đang mở
   */
  setActiveId(id) {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE);
      }
    } catch {}
  },

  clearActiveId() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE);
    } catch {}
  },

  /**
   * Quản lý Form Draft (Bản nháp form nhập liệu)
   */
  getDraft() {
    return safeGet(STORAGE_KEYS.DRAFT, null);
  },

  saveDraft(formData) {
    return safeSet(STORAGE_KEYS.DRAFT, formData);
  },

  clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    } catch {}
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export const registrationRepo = {
  getKey(eventId) {
    return `${STORAGE_KEYS.REG_PREFIX}${eventId}`;
  },

  /**
   * Lấy danh sách đăng ký của một sự kiện
   */
  listByEvent(eventId) {
    if (!eventId) return [];
    const list = safeGet(this.getKey(eventId), []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Đếm số lượt đăng ký của một sự kiện
   */
  countByEvent(eventId) {
    return this.listByEvent(eventId).length;
  },

  /**
   * Thêm người đăng ký mới (có kiểm tra trùng và xác nhận đọc lại)
   */
  add(eventId, regData, isEventPast = false) {
    if (!eventId) {
      return { ok: false, message: 'Thiếu mã định danh sự kiện.' };
    }

    const existingList = this.listByEvent(eventId);

    // Validate nghiệp vụ
    const validation = validateRegistration(regData, existingList, isEventPast);
    if (!validation.isValid) {
      return { ok: false, message: validation.error, errors: validation.errors };
    }

    const newReg = createRegistration({
      eventId,
      fullName: regData.fullName || regData.name,
      email: normalizeEmail(regData.email),
      phone: normalizePhone(regData.phone),
    });

    const updatedList = [...existingList, newReg];
    const saved = safeSet(this.getKey(eventId), updatedList);

    if (!saved) {
      return {
        ok: false,
        message: 'Không thể lưu dữ liệu vào trình duyệt (bộ nhớ đầy hoặc bị chặn).',
      };
    }

    return {
      ok: true,
      message: 'Đăng ký thành công! Hẹn gặp bạn tại sự kiện 🎉',
      data: newReg,
      newCount: updatedList.length,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION HELPER (Chuyển dữ liệu cũ sang epb:v1:*)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Di chuyển dữ liệu cũ từ tiền tố event_lp_* sang epb:v1:*
 */
export function migrateLegacyStorage() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('event_lp_') && key.endsWith('_registrations')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const oldList = JSON.parse(raw);
          const legacyEventId = key.replace('event_lp_', '').replace('_registrations', '');
          const newKey = `${STORAGE_KEYS.REG_PREFIX}${legacyEventId}`;

          if (!localStorage.getItem(newKey) && Array.isArray(oldList)) {
            safeSet(newKey, oldList);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[repository] Lỗi migrateLegacyStorage:', err);
  }
}

// Chạy di trú tự động khi nạp file
migrateLegacyStorage();
