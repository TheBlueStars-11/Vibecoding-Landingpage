/**
 * @file validators.js
 * Kiểm tra tính hợp lệ dữ liệu cho toàn bộ các màn hình và nghiệp vụ của Event Landing Studio
 */

import { normalizeText, normalizeEmail, normalizePhone, isValidVietnamesePhone, normalizeSpeakers } from './normalize.js';
import { isFutureDateTime, checkPastDateTime, parseTimelineTime, validateTimelineOrder, validateAgendaChronology } from './time.js';
import { FIELD_ROLES, FIELD_TYPES } from './elsSchema.js';

export { parseTimelineTime, validateTimelineOrder, validateAgendaChronology };

/**
 * Kiểm tra tên dự án khi tạo mới hoặc đổi tên (Trang 1)
 */
export function validateProjectName(name) {
  const clean = normalizeText(name || '');
  if (!clean) {
    return { isValid: false, error: 'Tên dự án không được để trống. Vui lòng nhập tên từ 3 đến 120 ký tự.' };
  }
  if (clean.length < 3 || clean.length > 120) {
    return { isValid: false, error: 'Tên dự án phải từ 3 đến 120 ký tự.' };
  }
  return { isValid: true, error: null, cleanName: clean };
}

/**
 * Kiểm tra dữ liệu WS1: Thông tin sự kiện và thư viện ảnh
 */
export function validateProjectInfo(eventData = {}, assets = []) {
  const errors = {};

  // 1. Tên sự kiện
  const eventName = normalizeText(eventData.eventName || '');
  if (!eventName) {
    errors.eventName = 'Tên sự kiện không được để trống. Vui lòng nhập tên từ 3 đến 120 ký tự.';
  } else if (eventName.length < 3 || eventName.length > 120) {
    errors.eventName = 'Tên sự kiện phải từ 3 đến 120 ký tự.';
  }

  // 2. Ngày diễn ra
  if (!eventData.eventDate) {
    errors.eventDate = 'Vui lòng chọn ngày diễn ra sự kiện.';
  }

  // 3. Giờ bắt đầu
  if (!eventData.eventTime) {
    errors.eventTime = 'Vui lòng chọn giờ bắt đầu sự kiện.';
  }

  // Chặn thời gian quá khứ (phân định rõ ngày quá khứ vs giờ quá khứ trong ngày - SYS-08)
  if (eventData.eventDate && eventData.eventTime) {
    const pastCheck = checkPastDateTime(eventData.eventDate, eventData.eventTime);
    if (pastCheck.isPastDate) {
      errors.eventDate = 'Ngày diễn ra đã qua. Vui lòng chọn một ngày từ hôm nay trở đi.';
    } else if (pastCheck.isPastHourToday) {
      errors.eventTime = 'Giờ bắt đầu sự kiện hôm nay đã trôi qua. Vui lòng chọn giờ sau thời điểm hiện tại.';
    } else if (!isFutureDateTime(eventData.eventDate, eventData.eventTime, 0)) {
      errors.eventDate = 'Thời gian sự kiện đã qua. Vui lòng chọn thời điểm trong tương lai.';
    }
  }

  // 4. Địa điểm
  const venue = normalizeText(eventData.venue || '');
  if (!venue) {
    errors.venue = 'Địa điểm không được để trống. Vui lòng nhập nơi tổ chức sự kiện.';
  } else if (venue.length < 3 || venue.length > 200) {
    errors.venue = 'Địa điểm phải từ 3 đến 200 ký tự.';
  }

  // 5. Diễn giả (ít nhất 1 người, mỗi người có tên)
  const speakers = Array.isArray(eventData.speakers) ? eventData.speakers : [];
  if (speakers.length === 0) {
    errors.speakers = 'Vui lòng thêm ít nhất một diễn giả.';
  } else {
    const invalidSpeaker = speakers.some((s) => !normalizeText(s.name || ''));
    if (invalidSpeaker) {
      errors.speakers = 'Tên diễn giả không được để trống. Vui lòng nhập họ tên cho tất cả diễn giả.';
    }
  }

  // 6. Ưu đãi đăng ký sớm (bắt buộc theo FDD, <= 300 ký tự)
  const earlyBird = normalizeText(eventData.earlyBirdOffer || '');
  if (!earlyBird) {
    errors.earlyBirdOffer = 'Ưu đãi đăng ký sớm không được để trống. Nhập nội dung ưu đãi (ví dụ: Giảm 30% cho 50 bạn đầu).';
  } else if (earlyBird.length > 300) {
    errors.earlyBirdOffer = 'Nội dung ưu đãi không được vượt quá 300 ký tự.';
  }

  // 7. Chương trình (ít nhất 1 mục)
  const agenda = Array.isArray(eventData.agenda) ? eventData.agenda : [];
  if (agenda.length === 0) {
    errors.agenda = 'Vui lòng thêm ít nhất một mục trong chương trình sự kiện.';
  } else {
    const times = new Set();
    let hasEmptyField = false;
    let hasDuplicateTime = false;

    for (const item of agenda) {
      const title = normalizeText(item.title || '');
      const time = (item.time || '').trim();
      if (!title || !time) {
        hasEmptyField = true;
      }
      if (times.has(time)) {
        hasDuplicateTime = true;
      }
      times.add(time);
    }

    if (hasEmptyField) {
      errors.agenda = 'Mỗi mục chương trình cần có đầy đủ thời gian (HH:mm) và nội dung.';
    } else if (hasDuplicateTime) {
      errors.agenda = 'Chương trình có các mốc thời gian trùng nhau. Vui lòng kiểm tra lại.';
    } else {
      const chronoCheck = validateTimelineOrder(agenda);
      if (!chronoCheck.isValid) {
        errors.agenda = chronoCheck.error;
      }
    }
  }

  // 8. Thư viện ảnh: Mọi ảnh upload đều phải có mô tả (caption)
  if (Array.isArray(assets) && assets.length > 0) {
    const missingCaption = assets.some((a) => !normalizeText(a.caption || ''));
    if (missingCaption) {
      errors.assets = 'Một số ảnh chưa có mô tả. Hãy nhập mô tả (ví dụ: Diễn giả 1) để AI dùng đúng ảnh.';
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : null,
  };
}

/**
 * Kiểm tra tính hợp lệ cấu hình trường Form (WS2)
 */
export function validateFormFields(fields = []) {
  const activeFields = fields.filter((f) => !f.deleted);
  const errors = [];
  const warnings = [];

  if (activeFields.length === 0) {
    errors.push('Form phải có ít nhất 1 trường thông tin.');
  }

  if (activeFields.length > 8) {
    errors.push('Form chỉ được có tối đa 8 trường.');
  }

  // Kiểm tra duy nhất 1 displayName
  const displayFields = activeFields.filter((f) => f.role === FIELD_ROLES.DISPLAY_NAME);
  if (displayFields.length !== 1) {
    errors.push('Form phải có đúng 1 trường đại diện tên hiển thị (Họ và tên).');
  }

  // Kiểm tra ít nhất 1 identity (email hoặc tel)
  const identityFields = activeFields.filter((f) => f.role === FIELD_ROLES.IDENTITY);
  if (identityFields.length === 0) {
    errors.push('Form phải có ít nhất 1 trường định danh chống trùng (loại Email hoặc Số điện thoại).');
  } else {
    for (const idField of identityFields) {
      if (idField.type !== FIELD_TYPES.EMAIL && idField.type !== FIELD_TYPES.TEL) {
        errors.push(`Trường định danh "${idField.label}" phải có kiểu Email hoặc Số điện thoại.`);
      }
    }
  }

  // Kiểm tra trùng tên nhãn
  const labelsSeen = new Set();
  for (const field of activeFields) {
    const norm = normalizeText(field.label || '').toLowerCase();
    if (!norm) {
      errors.push('Tên trường không được để trống.');
    } else if (labelsSeen.has(norm)) {
      errors.push(`Tên trường "${field.label}" bị trùng lặp.`);
    }
    labelsSeen.add(norm);

    // Cảnh báo trường nhạy cảm
    const sensitiveWords = ['cccd', 'cmnd', 'can cuoc', 'chung minh', 'ngay sinh', 'dia chi nha', 'so nha', 'giay to'];
    if (sensitiveWords.some((w) => norm.includes(w))) {
      warnings.push(`Trường "${field.label}" có thể là thông tin nhạy cảm. Chỉ thu thập dữ liệu thật sự cần thiết.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Helper trích xuất email từ bản ghi đăng ký cũ bất kể cấu trúc
 */
function getRecordEmail(r) {
  if (!r) return '';
  if (typeof r.email === 'string' && r.email.trim()) return r.email.trim().toLowerCase();
  if (r.values && typeof r.values === 'object') {
    if (typeof r.values.email === 'string' && r.values.email.trim()) return r.values.email.trim().toLowerCase();
    if (typeof r.values.fld_email === 'string' && r.values.fld_email.trim()) return r.values.fld_email.trim().toLowerCase();
    for (const [k, v] of Object.entries(r.values)) {
      if ((k.toLowerCase().includes('email') || (typeof v === 'string' && v.includes('@'))) && typeof v === 'string' && v.trim()) {
        return v.trim().toLowerCase();
      }
    }
  }
  if (typeof r.identityKey === 'string' && r.identityKey.includes('@')) {
    return r.identityKey.trim().toLowerCase();
  }
  return '';
}

/**
 * Helper trích xuất số điện thoại từ bản ghi đăng ký cũ bất kể cấu trúc
 */
function getRecordPhone(r) {
  if (!r) return '';
  if (typeof r.phone === 'string' && r.phone.trim()) return r.phone.trim().toLowerCase();
  if (r.values && typeof r.values === 'object') {
    if (typeof r.values.phone === 'string' && r.values.phone.trim()) return r.values.phone.trim().toLowerCase();
    if (typeof r.values.fld_phone === 'string' && r.values.fld_phone.trim()) return r.values.fld_phone.trim().toLowerCase();
    for (const [k, v] of Object.entries(r.values)) {
      if (k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel')) {
        if (typeof v === 'string' && v.trim()) return v.trim().toLowerCase();
      }
    }
  }
  if (typeof r.identityKey === 'string' && !r.identityKey.includes('@') && /^\+?\d/.test(r.identityKey.trim())) {
    return r.identityKey.trim().toLowerCase();
  }
  return '';
}

/**
 * Kiểm tra dữ liệu người tham dự gửi đăng ký theo dynamic fields
 */
export function validateRegistrationSubmission(
  values = {},
  formFields = [],
  existingRegistrations = [],
  isEventPast = false
) {
  const errors = {};

  if (isEventPast) {
    return {
      isValid: false,
      error: 'Sự kiện đã kết thúc, không thể tiếp nhận thêm đơn đăng ký.',
      errors: { general: 'Sự kiện đã kết thúc.' },
    };
  }

  const activeFields = formFields.filter((f) => !f.deleted);
  let identityKey = '';
  let displayName = '';
  let emailFieldKey = null;
  let emailValue = '';
  let phoneFieldKey = null;
  let phoneValue = '';
  let identityFieldKey = null;

  for (const field of activeFields) {
    const rawVal = values[field.key] || '';
    const cleanVal = normalizeText(String(rawVal));

    if (field.required && !cleanVal) {
      errors[field.key] = `${field.label} không được để trống.`;
      continue;
    }

    if (cleanVal) {
      if (field.type === FIELD_TYPES.EMAIL || (field.key && field.key.toLowerCase().includes('email'))) {
        emailFieldKey = field.key;
        emailValue = cleanVal.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
          errors[field.key] = 'Email chưa đúng định dạng. Vui lòng nhập dạng ten@vi-du.com.';
        }
      } else if (field.type === FIELD_TYPES.NUMBER) {
        if (!/^\d+$/.test(cleanVal)) {
          errors[field.key] = `${field.label} chỉ gồm các chữ số. Vui lòng bỏ ký tự khác.`;
        }
      } else if (field.type === FIELD_TYPES.TEL || (field.key && field.key.toLowerCase().includes('phone'))) {
        phoneFieldKey = field.key;
        phoneValue = cleanVal.trim();
        if (!isValidVietnamesePhone(phoneValue)) {
          errors[field.key] = 'Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng đầu số Việt Nam).';
        }
      }
    }

    if (field.role === FIELD_ROLES.DISPLAY_NAME) {
      displayName = cleanVal;
    }

    if (field.role === FIELD_ROLES.IDENTITY) {
      identityFieldKey = field.key;
      if (field.type === FIELD_TYPES.EMAIL) {
        identityKey = normalizeEmail(cleanVal);
      } else if (field.type === FIELD_TYPES.TEL) {
        identityKey = normalizePhone(cleanVal);
      } else {
        identityKey = cleanVal.toLowerCase();
      }
    }
  }

  // Chống đăng ký trùng lặp (email hoặc phone hoặc identityKey)
  const duplicateMsg = 'Email/Số điện thoại này đã được sử dụng để đăng ký sự kiện rồi.';
  let hasDuplicate = false;

  // 1. Kiểm tra trùng email
  if (emailValue && emailFieldKey && !errors[emailFieldKey]) {
    const isEmailDup = existingRegistrations.some((r) => {
      const e = getRecordEmail(r);
      return e && e === emailValue;
    });
    if (isEmailDup) {
      errors[emailFieldKey] = duplicateMsg;
      hasDuplicate = true;
    }
  }

  // 2. Kiểm tra trùng số điện thoại
  if (phoneValue && phoneFieldKey && !errors[phoneFieldKey]) {
    const normInputPhone = phoneValue.replace(/\D/g, '');
    const isPhoneDup = existingRegistrations.some((r) => {
      const p = getRecordPhone(r);
      if (!p) return false;
      if (p === phoneValue.toLowerCase()) return true;
      const normP = p.replace(/\D/g, '');
      return Boolean(normP && normInputPhone && normP === normInputPhone);
    });
    if (isPhoneDup) {
      errors[phoneFieldKey] = duplicateMsg;
      hasDuplicate = true;
    }
  }

  // 3. Kiểm tra trùng identityKey (nếu chưa phát hiện trùng qua email/phone)
  if (!hasDuplicate && identityKey) {
    const isIdDup = existingRegistrations.some(
      (r) => r.identityKey && r.identityKey.trim().toLowerCase() === identityKey.trim().toLowerCase()
    );
    if (isIdDup) {
      const targetKey = identityFieldKey || emailFieldKey || phoneFieldKey || 'identity';
      errors[targetKey] = duplicateMsg;
      hasDuplicate = true;
    }
  }

  const errorKeys = Object.keys(errors);
  const isValid = errorKeys.length === 0;

  let overallError = null;
  if (!isValid) {
    const firstMsg = errors[errorKeys[0]];
    overallError = hasDuplicate
      ? `${duplicateMsg} (đã đăng ký trước đó)`
      : firstMsg;
  }

  return {
    isValid,
    errors,
    error: overallError,
    identityKey,
    displayName: displayName || 'Người tham dự',
  };
}

/**
 * Backward compatibility functions
 */
export function validateEventInput(formData) {
  const errors = {};
  const name = normalizeText(formData.name);
  if (!name) {
    errors.name = 'Tên sự kiện không được để trống.';
  } else if (name.length < 3 || name.length > 120) {
    errors.name = 'Tên sự kiện phải từ 3 đến 120 ký tự.';
  }

  if (!formData.date) {
    errors.date = 'Vui lòng chọn ngày diễn ra sự kiện.';
  }
  if (!formData.time) {
    errors.time = 'Vui lòng chọn giờ diễn ra sự kiện.';
  }

  if (formData.date && formData.time) {
    const pastCheck = checkPastDateTime(formData.date, formData.time);
    if (pastCheck.isPastDate) {
      errors.date = 'Ngày diễn ra đã qua. Vui lòng chọn một ngày từ hôm nay trở đi.';
    } else if (pastCheck.isPastHourToday) {
      errors.time = 'Giờ bắt đầu sự kiện hôm nay đã trôi qua. Vui lòng chọn giờ sau thời điểm hiện tại.';
    } else if (!isFutureDateTime(formData.date, formData.time, 0)) {
      errors.date = 'Thời gian sự kiện đã qua. Vui lòng chọn ngày giờ sau thời điểm hiện tại.';
    }
  }

  const location = normalizeText(formData.location);
  if (!location) {
    errors.location = 'Địa điểm chưa có. Vui lòng nhập địa chỉ tổ chức hoặc link online (Zoom/Google Meet).';
  } else if (location.length > 200) {
    errors.location = 'Địa điểm không được vượt quá 200 ký tự.';
  }

  const speakerList = normalizeSpeakers(formData.speakers);
  if (speakerList.length === 0) {
    errors.speakers = 'Cần ít nhất một diễn giả. Nhập tên diễn giả (cách nhau bởi dấu phẩy).';
  } else if (speakerList.length > 6) {
    errors.speakers = 'Tối đa 6 diễn giả cho một sự kiện.';
  }

  const earlyBird = normalizeText(formData.earlyBird);
  if (!earlyBird) {
    errors.earlyBird = 'Nội dung ưu đãi đăng ký sớm không được để trống.';
  } else if (earlyBird.length > 300) {
    errors.earlyBird = 'Nội dung ưu đãi không vượt quá 300 ký tự.';
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : null,
  };
}

export function validateRegistration(regData, existingRegistrations = [], isEventPast = false) {
  const errors = {};

  if (isEventPast) {
    return {
      isValid: false,
      error: 'Sự kiện đã kết thúc, không thể tiếp nhận thêm đăng ký.',
      errors: { general: 'Sự kiện đã kết thúc.' },
    };
  }

  const fullName = normalizeText(regData.fullName || regData.name);
  if (!fullName) {
    errors.fullName = 'Họ và tên không được để trống.';
  } else if (fullName.length < 2 || fullName.length > 80) {
    errors.fullName = 'Họ và tên phải từ 2 đến 80 ký tự.';
  }

  const email = normalizeEmail(regData.email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email không được để trống.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Email không đúng định dạng. Vui lòng kiểm tra lại.';
  }

  const phone = normalizePhone(regData.phone);
  if (phone && !isValidVietnamesePhone(phone)) {
    errors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng đầu số Việt Nam).';
  }

  // Trùng lặp
  const duplicateMsg = 'Email/Số điện thoại này đã được sử dụng để đăng ký sự kiện rồi.';
  if (email && existingRegistrations.some((r) => {
    const e = getRecordEmail(r) || normalizeEmail(r.email);
    return e && e === email;
  })) {
    errors.email = duplicateMsg;
  }
  if (phone && existingRegistrations.some((r) => {
    const p = getRecordPhone(r) || normalizePhone(r.phone);
    if (!p) return false;
    if (p === phone) return true;
    const normInput = phone.replace(/\D/g, '');
    const normR = p.replace(/\D/g, '');
    return Boolean(normR && normInput && normR === normInput);
  })) {
    errors.phone = duplicateMsg;
  }

  const errorKeys = Object.keys(errors);
  const isValid = errorKeys.length === 0;

  return {
    isValid,
    error: isValid ? null : errors[errorKeys[0]],
    errors,
  };
}
