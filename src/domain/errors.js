/**
 * @file src/domain/errors.js
 * Định nghĩa cấu trúc lỗi chuẩn hóa (Domain Error) cho Event Landing Studio.
 * Phục vụ báo cáo lỗi thân thiện, phân loại và hỗ trợ Error Boundary / Recovery Action.
 */

export const ERROR_CODES = {
  VALIDATION_FAILED: 'ERR_VALIDATION',
  STORAGE_QUOTA: 'ERR_STORAGE_QUOTA',
  STORAGE_CORRUPT: 'ERR_STORAGE_CORRUPT',
  DUPLICATE_REGISTRATION: 'ERR_DUPLICATE',
  CAPACITY_EXCEEDED: 'ERR_CAPACITY_FULL',
  PAST_EVENT: 'ERR_PAST_EVENT',
  AI_NETWORK_ERROR: 'ERR_AI_NETWORK',
  AI_SCHEMA_INVALID: 'ERR_AI_SCHEMA',
  FACT_GUARD_VIOLATION: 'ERR_FACT_GUARD',
  UNKNOWN: 'ERR_UNKNOWN',
};

export const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  STORAGE: 'storage',
  NETWORK: 'network',
  BUSINESS: 'business',
  SYSTEM: 'system',
};

export class ElsError extends Error {
  /**
   * @param {string} message - Thông điệp lỗi hiển thị cho người dùng
   * @param {string} code - Mã lỗi chuẩn hóa từ ERROR_CODES
   * @param {string} category - Danh mục lỗi từ ERROR_CATEGORIES
   * @param {string} [recoveryAction] - Gợi ý hành động khắc phục cho người dùng
   * @param {any} [details] - Chi tiết kỹ thuật bổ sung
   */
  constructor(message, code = ERROR_CODES.UNKNOWN, category = ERROR_CATEGORIES.SYSTEM, recoveryAction = null, details = null) {
    super(message);
    this.name = 'ElsError';
    this.code = code;
    this.category = category;
    this.recoveryAction = recoveryAction;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export function isElsError(err) {
  return err instanceof ElsError || (err && err.name === 'ElsError');
}

export function createElsError(message, code, category, recoveryAction, details) {
  return new ElsError(message, code, category, recoveryAction, details);
}
