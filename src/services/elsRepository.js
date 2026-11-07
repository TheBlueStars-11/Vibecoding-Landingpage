/**
 * @file elsRepository.js
 * Quản lý kho dữ liệu Event Landing Studio lưu trong localStorage
 * Hỗ trợ xác minh ghi an toàn, chống đầy quota, migration từ v0 và phát tín hiệu real-time đa tab.
 */

import {
  ELS_STORAGE_KEYS,
  ELS_SCHEMA_VERSION,
  createProject,
  createRegistrationRecord,
} from '../domain/elsSchema.js';

// Kênh BroadcastChannel để đồng bộ realtime giữa các tab cùng trình duyệt
const CHANNEL_NAME = 'els-registrations';
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel không được hỗ trợ:', e);
  }
}

/**
 * Đọc an toàn từ localStorage có fallback
 */
function safeGetItem(key, defaultValue = null) {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Lỗi đọc localStorage khóa ${key}:`, err);
    // Sao lưu bản hỏng theo FDD mục 7.4
    try {
      const corrupt = window.localStorage.getItem(key);
      if (corrupt) {
        window.localStorage.setItem(`${key}:corrupt`, corrupt);
      }
    } catch {
      // Bỏ qua lỗi sao lưu
    }
    return defaultValue;
  }
}

/**
 * Ghi an toàn vào localStorage có đọc lại kiểm chứng và bắt lỗi Quota
 */
function safeSetItem(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const serialized = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, serialized);
    // Đọc lại kiểm chứng theo FDD 7.4
    const check = window.localStorage.getItem(key);
    if (check !== serialized) {
      throw new Error('Dữ liệu lưu trữ không khớp sau khi ghi.');
    }
    return true;
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)) {
      throw new Error('Bộ nhớ trình duyệt (localStorage) đã đầy. Hãy xóa bớt dự án hoặc ảnh để tiếp tục.');
    }
    throw new Error(`Không thể lưu dữ liệu: ${err.message || 'Lỗi không xác định'}`);
  }
}

/**
 * Tự động di chuyển dữ liệu cũ (epb:v1:*) sang cấu trúc mới (els:v1:*) nếu có
 */
function migrateFromLegacyIfNeeded() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const existingProjects = safeGetItem(ELS_STORAGE_KEYS.PROJECTS, null);
  if (existingProjects !== null) return; // Đã khởi tạo hoặc có dữ liệu mới

  try {
    const legacyEventsRaw = window.localStorage.getItem('epb:v1:events');
    if (legacyEventsRaw) {
      const legacyEvents = JSON.parse(legacyEventsRaw);
      if (Array.isArray(legacyEvents) && legacyEvents.length > 0) {
        const migratedProjects = [];

        for (const ev of legacyEvents) {
          const date = ev.startAt ? ev.startAt.slice(0, 10) : '';
          const time = ev.startAt && ev.startAt.includes('T') ? ev.startAt.slice(11, 16) : '09:00';
          const project = createProject({
            id: `prj_${ev.id || Date.now()}`,
            name: ev.name || 'Sự kiện mẫu',
            status: ev.status === 'draft' ? 'draft' : 'published',
            event: {
              eventName: ev.name || '',
              eventDate: date,
              eventTime: time,
              venue: ev.location || '',
              speakers: Array.isArray(ev.speakers)
                ? ev.speakers.map((s, idx) => (typeof s === 'string' ? { id: `spk_${idx}`, name: s, title: '' } : s))
                : [],
              earlyBirdOffer: ev.earlyBird || '',
              agenda: Array.isArray(ev.agenda)
                ? ev.agenda.map((a, idx) => (typeof a === 'string' ? { id: `ag_${idx}`, time: '09:00', title: a } : a))
                : [],
            },
            ai: ev.content
              ? {
                  source: ev.content.source || 'mock',
                  generatedAt: ev.content.generatedAt || null,
                  headline: ev.content.headline || '',
                  description: ev.content.description || '',
                  benefits: Array.isArray(ev.content.benefits) ? ev.content.benefits : ['', '', ''],
                  edited: false,
                }
              : null,
          });
          migratedProjects.push(project);

          // Chuyển registrations cũ nếu có
          const legacyRegsRaw = window.localStorage.getItem(`epb:v1:regs:${ev.id}`);
          if (legacyRegsRaw) {
            const legacyRegs = JSON.parse(legacyRegsRaw);
            if (Array.isArray(legacyRegs)) {
              const newRegs = legacyRegs.map((r) =>
                createRegistrationRecord({
                  id: r.id,
                  projectId: project.id,
                  values: {
                    fld_name: r.fullName || '',
                    fld_email: r.email || '',
                    fld_msv: '',
                  },
                  displayName: r.fullName || 'Người tham dự',
                  identityKey: (r.email || '').toLowerCase(),
                  createdAt: r.createdAt || new Date().toISOString(),
                })
              );
              safeSetItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${project.id}`, newRegs);
            }
          }
        }

        safeSetItem(ELS_STORAGE_KEYS.PROJECTS, migratedProjects);
        safeSetItem(ELS_STORAGE_KEYS.META, { schemaVersion: ELS_SCHEMA_VERSION, migratedFrom: 'epb:v1' });
        return;
      }
    }
  } catch (err) {
    console.warn('Lỗi migration dữ liệu cũ:', err);
  }

  // Khởi tạo mảng rỗng nếu chưa có
  safeSetItem(ELS_STORAGE_KEYS.PROJECTS, []);
  safeSetItem(ELS_STORAGE_KEYS.META, { schemaVersion: ELS_SCHEMA_VERSION });
}

// Khởi chạy kiểm tra migration khi load module
if (typeof window !== 'undefined') {
  migrateFromLegacyIfNeeded();
}

/**
 * Event Landing Studio Repository Service
 */
/**
 * Chuẩn hóa ô CSV và chống CSV Formula Injection (GAP-T9, TX-13)
 * Ngăn chặn mã độc Excel thực thi khi ô bắt đầu bằng =, +, -, @, tab hoặc return
 */
export function formatCsvCell(val) {
  const str = val !== undefined && val !== null ? String(val) : '';
  let safeStr = str;
  if (/^[=+\-@\t\r]/.test(safeStr)) {
    safeStr = `'${safeStr}`;
  }
  return `"${safeStr.replace(/"/g, '""')}"`;
}

export const elsRepository = {
  // ======================
  // 1. PROJECTS
  // ======================
  getProjects() {
    return safeGetItem(ELS_STORAGE_KEYS.PROJECTS, []) || [];
  },

  createProject(initialData = {}) {
    const project = createProject(initialData);
    this.saveProject(project);
    return project;
  },

  getProjectById(id) {
    const projects = this.getProjects();
    return projects.find((p) => p.id === id) || null;
  },

  getProjectBySlug(slug) {
    const projects = this.getProjects();
    return projects.find((p) => p.slug === slug) || null;
  },

  saveProject(project) {
    if (!project || !project.id) throw new Error('Dữ liệu dự án không hợp lệ.');
    const projects = this.getProjects();
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const index = projects.findIndex((p) => p.id === project.id);
    let nextProjects;
    if (index >= 0) {
      nextProjects = [...projects];
      nextProjects[index] = updatedProject;
    } else {
      nextProjects = [updatedProject, ...projects];
    }

    safeSetItem(ELS_STORAGE_KEYS.PROJECTS, nextProjects);
    this.setLastOpenProjectId(project.id);
    return updatedProject;
  },

  deleteProject(id) {
    const projects = this.getProjects();
    const nextProjects = projects.filter((p) => p.id !== id);
    safeSetItem(ELS_STORAGE_KEYS.PROJECTS, nextProjects);

    // Xóa sạch assets và registrations liên quan
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(`${ELS_STORAGE_KEYS.ASSETS_PREFIX}${id}`);
      window.localStorage.removeItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${id}`);
    }

    // Thông báo realtime
    this._notifyChannel('project_deleted', { projectId: id });
    return true;
  },

  // ======================
  // 2. ASSETS (Ảnh nguồn)
  // ======================
  getAssets(projectId) {
    if (!projectId) return [];
    return safeGetItem(`${ELS_STORAGE_KEYS.ASSETS_PREFIX}${projectId}`, []) || [];
  },

  saveAssets(projectId, assetsList) {
    if (!projectId || !Array.isArray(assetsList)) throw new Error('Dữ liệu danh sách ảnh không hợp lệ.');
    const trimmed = assetsList.slice(0, 8);
    safeSetItem(`${ELS_STORAGE_KEYS.ASSETS_PREFIX}${projectId}`, trimmed);
    return trimmed;
  },

  saveAsset(projectId, asset) {
    if (!projectId || !asset || !asset.id) throw new Error('Dữ liệu ảnh không hợp lệ.');
    const assets = this.getAssets(projectId);
    const index = assets.findIndex((a) => a.id === asset.id);
    let nextAssets;
    if (index >= 0) {
      nextAssets = [...assets];
      nextAssets[index] = asset;
    } else {
      if (assets.length >= 8) {
        throw new Error('Đã đạt giới hạn tối đa 8 ảnh cho dự án này. Hãy xóa bớt ảnh cũ.');
      }
      nextAssets = [...assets, asset];
    }
    safeSetItem(`${ELS_STORAGE_KEYS.ASSETS_PREFIX}${projectId}`, nextAssets);
    return asset;
  },

  deleteAsset(projectId, assetId) {
    if (!projectId) return false;
    const assets = this.getAssets(projectId);
    const nextAssets = assets.filter((a) => a.id !== assetId);
    safeSetItem(`${ELS_STORAGE_KEYS.ASSETS_PREFIX}${projectId}`, nextAssets);
    return true;
  },

  // ======================
  // 3. REGISTRATIONS (Đơn đăng ký)
  // ======================
  getRegistrations(projectId) {
    if (!projectId) return [];
    return safeGetItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${projectId}`, []) || [];
  },

  getRegistrationCount(projectId) {
    return this.getRegistrations(projectId).length;
  },

  getTotalRegistrationsCount() {
    const projects = this.getProjects();
    let total = 0;
    for (const p of projects) {
      total += this.getRegistrationCount(p.id);
    }
    return total;
  },

  /**
   * Thêm đơn đăng ký mới (nguyên tử và chống trùng lặp tại kho)
   */
  addRegistration(projectId, regData) {
    if (!projectId) throw new Error('Thiếu projectId khi lưu đơn đăng ký.');
    const registrations = this.getRegistrations(projectId);

    // Chống trùng identityKey
    const identityKey = (regData.identityKey || '').trim().toLowerCase();
    if (identityKey) {
      const isDuplicate = registrations.some((r) => r.identityKey === identityKey);
      if (isDuplicate) {
        throw new Error(`Thông tin định danh "${identityKey}" đã được sử dụng để đăng ký.`);
      }
    }

    const newRecord = createRegistrationRecord({
      projectId,
      values: regData.values || {},
      displayName: regData.displayName || 'Người tham dự',
      identityKey,
      source: regData.source || 'landing',
    });

    const nextRegistrations = [newRecord, ...registrations];
    safeSetItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${projectId}`, nextRegistrations);

    // Cập nhật updatedAt của dự án
    const project = this.getProjectById(projectId);
    if (project) {
      this.saveProject({ ...project, updatedAt: new Date().toISOString() });
    }

    // Phát tín hiệu realtime
    this._notifyChannel('registration_added', { projectId, registration: newRecord });
    this._dispatchLocalEvent('registration_added', { projectId, registration: newRecord });

    return newRecord;
  },

  /**
   * Nhận bản ghi đăng ký từ thiết bị khác gửi về qua luồng đồng bộ realtime
   */
  addExistingRegistration(projectId, record) {
    if (!projectId || !record || !record.id) return false;
    const registrations = this.getRegistrations(projectId);
    const exists = registrations.some((r) => r.id === record.id || (r.code && r.code === record.code));
    if (exists) return false;

    const nextRegistrations = [record, ...registrations];
    safeSetItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${projectId}`, nextRegistrations);

    const project = this.getProjectById(projectId);
    if (project) {
      this.saveProject({ ...project, updatedAt: new Date().toISOString() });
    }

    this._notifyChannel('registration_added', { projectId, registration: record });
    this._dispatchLocalEvent('registration_added', { projectId, registration: record });
    return true;
  },

  deleteRegistration(projectId, regId) {
    if (!projectId) return false;
    const registrations = this.getRegistrations(projectId);
    const nextRegistrations = registrations.filter((r) => r.id !== regId);
    safeSetItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${projectId}`, nextRegistrations);

    this._notifyChannel('registration_deleted', { projectId, regId });
    this._dispatchLocalEvent('registration_deleted', { projectId, regId });
    return true;
  },

  /**
   * Check-in vé tham dự bằng mã code (hoặc chuỗi quét từ QR)
   * @param {string} projectId
   * @param {string} rawCode
   * @returns {{ status: 'valid' | 'already_used' | 'invalid', record: object | null, cleanCode: string, message: string, checkInTime?: string }}
   */
  checkInByCode(projectId, rawCode) {
    if (!projectId || !rawCode) {
      return { status: 'invalid', record: null, cleanCode: '', message: 'Mã vé không được để trống.' };
    }

    let cleanCode = String(rawCode).trim();
    if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanCode);
        if (parsed.code) cleanCode = String(parsed.code).trim();
      } catch {}
    } else if (cleanCode.includes('code=')) {
      const match = cleanCode.match(/[?&#]code=([A-Za-z0-9_-]+)/i);
      if (match) cleanCode = match[1];
    }

    const registrations = this.getRegistrations(projectId);
    const targetIdx = registrations.findIndex(
      (r) =>
        (r.code && r.code.toUpperCase() === cleanCode.toUpperCase()) ||
        (r.id && r.id === cleanCode)
    );

    if (targetIdx === -1) {
      return {
        status: 'invalid',
        record: null,
        cleanCode,
        message: `Mã không hợp lệ: Không tìm thấy vé "${cleanCode}" trong danh sách sự kiện.`,
      };
    }

    const target = registrations[targetIdx];
    if (target.checkedIn) {
      return {
        status: 'already_used',
        record: target,
        cleanCode,
        checkInTime: target.checkInTime,
        message: `Mã đã sử dụng! Vé đã check-in lúc ${new Date(target.checkInTime).toLocaleTimeString('vi-VN')} ngày ${new Date(target.checkInTime).toLocaleDateString('vi-VN')}.`,
      };
    }

    const checkInTime = new Date().toISOString();
    const updatedRecord = {
      ...target,
      checkedIn: true,
      checkInTime,
    };

    const nextRegistrations = [...registrations];
    nextRegistrations[targetIdx] = updatedRecord;
    safeSetItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${projectId}`, nextRegistrations);

    this._notifyChannel('registration_updated', { projectId, registration: updatedRecord });
    this._dispatchLocalEvent('registration_updated', { projectId, registration: updatedRecord });

    return {
      status: 'valid',
      record: updatedRecord,
      cleanCode,
      checkInTime,
      message: 'Mã hợp lệ! Đã check-in thành công cho người tham dự.',
    };
  },

  /**
   * Đảo ngược trạng thái check-in thủ công từ bảng quản lý
   */
  toggleCheckIn(projectId, regId) {
    if (!projectId || !regId) return false;
    const registrations = this.getRegistrations(projectId);
    const targetIdx = registrations.findIndex((r) => r.id === regId);
    if (targetIdx === -1) return false;

    const target = registrations[targetIdx];
    const isNowCheckedIn = !target.checkedIn;
    const updatedRecord = {
      ...target,
      checkedIn: isNowCheckedIn,
      checkInTime: isNowCheckedIn ? new Date().toISOString() : null,
    };

    const nextRegistrations = [...registrations];
    nextRegistrations[targetIdx] = updatedRecord;
    safeSetItem(`${ELS_STORAGE_KEYS.REGISTRATIONS_PREFIX}${projectId}`, nextRegistrations);

    this._notifyChannel('registration_updated', { projectId, registration: updatedRecord });
    this._dispatchLocalEvent('registration_updated', { projectId, registration: updatedRecord });
    return updatedRecord;
  },

  // ======================
  // 4. META & REAL-TIME
  // ======================
  getLastOpenProjectId() {
    const meta = safeGetItem(ELS_STORAGE_KEYS.META, {});
    return meta?.lastOpenProjectId || null;
  },

  setLastOpenProjectId(projectId) {
    const meta = safeGetItem(ELS_STORAGE_KEYS.META, {}) || {};
    meta.lastOpenProjectId = projectId;
    meta.lastAccessedAt = new Date().toISOString();
    safeSetItem(ELS_STORAGE_KEYS.META, meta);
  },

  _notifyChannel(type, payload) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn('Lỗi postMessage qua BroadcastChannel:', e);
      }
    }
  },

  _dispatchLocalEvent(type, detail) {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('els:change', { detail: { type, ...detail } }));
      } catch {
        // Bỏ qua lỗi
      }
    }
  },

  /**
   * Lắng nghe cập nhật realtime từ BroadcastChannel và window storage event
   */
  subscribe(callback) {
    if (typeof window === 'undefined') return () => {};

    const handleChannelMessage = (event) => {
      if (event?.data) {
        callback(event.data);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key && event.key.startsWith('els:v1:')) {
        callback({ type: 'storage_change', key: event.key });
      }
    };

    const handleLocalEvent = (event) => {
      if (event?.detail) {
        callback(event.detail);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleChannelMessage);
    }
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('els:change', handleLocalEvent);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleChannelMessage);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('els:change', handleLocalEvent);
    };
  },

  /**
   * Xuất danh sách đơn đăng ký ra file CSV có UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn
   */
  exportToCSV(projectId, formFields = []) {
    const registrations = this.getRegistrations(projectId);
    if (!registrations || registrations.length === 0) {
      throw new Error('Chưa có đơn đăng ký nào để xuất.');
    }

    // Tiêu đề các cột
    const headers = ['Mã đăng ký', 'Thời gian đăng ký', 'Nguồn', 'Trạng thái Check-in', 'Thời gian Check-in'];
    const fieldCols = formFields.filter((f) => !f.deleted);
    fieldCols.forEach((f) => headers.push(f.label));

    // Dữ liệu từng dòng
    const rows = registrations.map((r) => {
      const dateStr = new Date(r.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const sourceStr = r.source === 'preview' ? 'Bản thử nghiệm' : 'Landing công khai';
      const checkInStatusStr = r.checkedIn ? 'Đã check-in' : 'Chưa check-in';
      const checkInTimeStr = r.checkInTime
        ? new Date(r.checkInTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : '';
      const row = [r.code, dateStr, sourceStr, checkInStatusStr, checkInTimeStr];
      fieldCols.forEach((f) => {
        const val = r.values && r.values[f.key] !== undefined ? String(r.values[f.key]) : '';
        row.push(formatCsvCell(val));
      });
      return row.join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh-sach-dang-ky-${projectId}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  },
};

