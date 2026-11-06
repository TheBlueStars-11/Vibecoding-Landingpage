import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styles from './WorkspaceForm.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import { validateFormFields } from '../../domain/validators.js';
import {
  createDefaultFormFields,
  FIELD_TYPES,
  FIELD_ROLES,
  generateId,
} from '../../domain/elsSchema.js';
import {
  PlusIcon,
  TrashIcon,
  MoveUpIcon,
  MoveDownIcon,
  AlertCircleIcon,
  CheckIcon,
  RefreshCwIcon,
  EyeIcon,
} from '../ui/Icons.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';

export function WorkspaceForm({ project, onUpdateProject, onSaveStatusChange, onShowToast }) {
  const [fields, setFields] = useState(() => project.formFields || createDefaultFormFields());
  const [isDirty, setIsDirty] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [lastSavedTime, setLastSavedTime] = useState(() => {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  });
  const saveTimeoutRef = useRef(null);

  // Validate mỗi khi fields thay đổi
  const validationResult = useMemo(() => validateFormFields(fields), [fields]);

  // Hàm thực thi lưu cấu hình form theo thời gian thực
  const performSave = useCallback((fieldsToSave = fields) => {
    try {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const updatedProject = {
        ...project,
        formFields: fieldsToSave,
      };
      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      setIsDirty(false);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      setLastSavedTime(timeStr);
    } catch (err) {
      console.error('Lỗi autosave form fields:', err);
      onSaveStatusChange?.('error');
    }
  }, [fields, project, onUpdateProject, onSaveStatusChange]);

  // Debounced Autosave (400ms) - Tự động lưu form liên tục theo thời gian thực
  useEffect(() => {
    if (!isDirty) return;

    onSaveStatusChange?.('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      performSave(fields);
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [fields, isDirty, performSave, onSaveStatusChange]);

  const activeFields = fields.filter((f) => !f.deleted);

  // Thay đổi thuộc tính của 1 trường
  const handleUpdateField = (key, prop, value) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f;
        const updated = { ...f, [prop]: value };

        // Nếu đặt role là displayName -> các trường khác bỏ displayName
        if (prop === 'role' && value === FIELD_ROLES.DISPLAY_NAME) {
          prev.forEach((other) => {
            if (other.key !== key && other.role === FIELD_ROLES.DISPLAY_NAME) {
              other.role = null;
            }
          });
        }
        return updated;
      })
    );
    setIsDirty(true);
  };

  // Thêm trường mới
  const handleAddField = () => {
    if (activeFields.length >= 8) {
      onShowToast?.('Form đã đạt giới hạn tối đa 8 trường.', 'error');
      return;
    }

    const newField = {
      key: generateId('fld'),
      label: `Trường mới ${activeFields.length + 1}`,
      type: FIELD_TYPES.TEXT,
      required: false,
      role: null,
      hint: '',
      deleted: false,
    };

    setFields((prev) => [...prev, newField]);
    setIsDirty(true);
    onShowToast?.('Đã thêm trường mới. Hãy đặt tên và kiểu dữ liệu.', 'info');
  };

  // Xóa trường (Soft delete theo FDD mục 6.2.5 để giữ an toàn cho đơn đăng ký cũ)
  const handleDeleteField = (key) => {
    if (activeFields.length <= 1) {
      onShowToast?.('Form phải có ít nhất 1 trường.', 'error');
      return;
    }

    const target = fields.find((f) => f.key === key);
    if (target?.role === FIELD_ROLES.DISPLAY_NAME) {
      onShowToast?.('Không thể xóa trường tên hiển thị chính. Hãy đổi vai trò cho trường khác trước.', 'error');
      return;
    }
    if (target?.role === FIELD_ROLES.IDENTITY) {
      const otherIdentities = activeFields.filter((f) => f.key !== key && f.role === FIELD_ROLES.IDENTITY);
      if (otherIdentities.length === 0) {
        onShowToast?.('Không thể xóa trường định danh duy nhất. Hãy gán vai trò định danh cho trường khác trước.', 'error');
        return;
      }
    }

    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, deleted: true } : f)));
    setIsDirty(true);
    onShowToast?.(`Đã gỡ trường "${target?.label}". Dữ liệu các đơn cũ vẫn được bảo lưu an toàn.`, 'info');
  };

  // Di chuyển thứ tự trường
  const handleMoveField = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= activeFields.length) return;

    // Lấy key của 2 trường cần đổi
    const keyA = activeFields[index].key;
    const keyB = activeFields[targetIdx].key;

    setFields((prev) => {
      const idxA = prev.findIndex((f) => f.key === keyA);
      const idxB = prev.findIndex((f) => f.key === keyB);
      const copy = [...prev];
      const temp = copy[idxA];
      copy[idxA] = copy[idxB];
      copy[idxB] = temp;
      return copy;
    });
    setIsDirty(true);
  };

  // Khôi phục mặc định
  const handleRestoreDefaults = () => {
    setFields(createDefaultFormFields());
    setIsDirty(true);
    setIsRestoreConfirmOpen(false);
    onShowToast?.('Đã khôi phục bộ 3 trường mặc định (Họ và tên, Email, Số điện thoại).', 'success');
  };

  // Lưu thủ công
  const handleManualSave = () => {
    if (!validationResult.isValid) {
      onShowToast?.('Cấu hình form chưa hợp lệ. Vui lòng xem thông báo lỗi.', 'error');
      return;
    }

    try {
      const updatedProject = {
        ...project,
        formFields: fields,
      };
      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      setIsDirty(false);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      onShowToast?.('Đã lưu cấu hình form thành công.', 'success');
    } catch (err) {
      onShowToast?.(`Lỗi lưu: ${err.message}`, 'error');
    }
  };

  return (
    <div className={styles.workspaceContainer}>
      {/* Cảnh báo / Lỗi nếu có */}
      {validationResult.errors.length > 0 && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircleIcon size={18} />
          <div>
            <strong>Cần khắc phục các lỗi sau để form hoạt động:</strong>
            <ul className={styles.errorList}>
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validationResult.warnings.length > 0 && (
        <div className={styles.warningBanner} role="status">
          <AlertCircleIcon size={18} />
          <div>
            <strong>Lưu ý bảo vệ quyền riêng tư người tham dự:</strong>
            <ul className={styles.warningList}>
              {validationResult.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tabs điều hướng trên Mobile (Chỉnh sửa <-> Xem trước) */}
      <div className={styles.mobileTabNav}>
        <button
          type="button"
          className={`${styles.tabNavBtn} ${mobileTab === 'editor' ? styles.activeTabNav : ''}`}
          onClick={() => setMobileTab('editor')}
        >
          Trình chỉnh sửa trường ({activeFields.length})
        </button>
        <button
          type="button"
          className={`${styles.tabNavBtn} ${mobileTab === 'preview' ? styles.activeTabNav : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          <EyeIcon size={16} />
          <span>Xem trước form</span>
        </button>
      </div>

      <div className={styles.layoutTwoColumns}>
        {/* ============================================================ */}
        {/* CỘT TRÁI: DANH SÁCH & TRÌNH CHỈNH SỬA TRƯỜNG                 */}
        {/* ============================================================ */}
        <div className={`${styles.editorColumn} ${mobileTab === 'preview' ? styles.hideOnMobile : ''}`}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Danh sách trường đăng ký ({activeFields.length}/8)</h2>
                <p className={styles.cardSubtitle}>
                  Tùy chỉnh các thông tin bạn muốn người tham dự điền trên landing page.
                </p>
              </div>
              <div className={styles.headerBtnGroup}>
                <button
                  type="button"
                  className={styles.btnSecondarySmall}
                  onClick={() => setIsRestoreConfirmOpen(true)}
                  title="Khôi phục 3 trường mặc định"
                >
                  <RefreshCwIcon size={13} />
                  <span>Mặc định</span>
                </button>
                <button
                  type="button"
                  className={styles.btnAddField}
                  onClick={handleAddField}
                  disabled={activeFields.length >= 8}
                >
                  <PlusIcon size={15} />
                  <span>Thêm trường</span>
                </button>
              </div>
            </div>

            <div className={styles.fieldsList}>
              {activeFields.map((field, index) => {
                const isDisplayName = field.role === FIELD_ROLES.DISPLAY_NAME;
                const isIdentity = field.role === FIELD_ROLES.IDENTITY;

                return (
                  <div key={field.key} className={styles.fieldCard}>
                    <div className={styles.fieldCardHeader}>
                      <div className={styles.reorderButtons}>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveField(index, -1)}
                          className={styles.btnReorder}
                          title="Di chuyển lên"
                          aria-label="Di chuyển trường lên"
                        >
                          <MoveUpIcon size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={index === activeFields.length - 1}
                          onClick={() => handleMoveField(index, 1)}
                          className={styles.btnReorder}
                          title="Di chuyển xuống"
                          aria-label="Di chuyển trường xuống"
                        >
                          <MoveDownIcon size={14} />
                        </button>
                      </div>

                      <span className={styles.fieldIndex}>#{index + 1}</span>

                      <div className={styles.fieldNameBox}>
                        <input
                          type="text"
                          className={styles.fieldLabelInput}
                          placeholder="Tên trường (ví dụ: Họ và tên) *"
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.key, 'label', e.target.value)}
                        />
                      </div>

                      <div className={styles.fieldTypeBox}>
                        <select
                          className={styles.selectType}
                          value={field.type}
                          onChange={(e) => handleUpdateField(field.key, 'type', e.target.value)}
                          aria-label="Loại trường"
                        >
                          <option value={FIELD_TYPES.TEXT}>Văn bản (Text)</option>
                          <option value={FIELD_TYPES.NUMBER}>Số (Number)</option>
                          <option value={FIELD_TYPES.EMAIL}>Email</option>
                          <option value={FIELD_TYPES.TEL}>Số điện thoại (Tel)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        className={styles.btnTrashField}
                        onClick={() => handleDeleteField(field.key)}
                        title="Xóa trường này"
                        aria-label={`Xóa trường ${field.label}`}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    <div className={styles.fieldCardDetails}>
                      <div className={styles.rowToggles}>
                        {/* Công tắc Bắt buộc */}
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(field.key, 'required', e.target.checked)}
                          />
                          <span>{field.required ? 'Bắt buộc điền' : 'Không bắt buộc'}</span>
                        </label>

                        {/* Vai trò đặc biệt */}
                        <div className={styles.roleGroup}>
                          <label className={styles.roleRadio}>
                            <input
                              type="radio"
                              name={`role-${field.key}`}
                              checked={isDisplayName}
                              onChange={() => handleUpdateField(field.key, 'role', FIELD_ROLES.DISPLAY_NAME)}
                            />
                            <span>Tên hiển thị (Display Name)</span>
                          </label>

                          <label className={styles.roleRadio}>
                            <input
                              type="radio"
                              name={`role-${field.key}`}
                              checked={isIdentity}
                              onChange={() => handleUpdateField(field.key, 'role', FIELD_ROLES.IDENTITY)}
                            />
                            <span>Định danh chống trùng (Identity)</span>
                          </label>

                          <label className={styles.roleRadio}>
                            <input
                              type="radio"
                              name={`role-${field.key}`}
                              checked={!isDisplayName && !isIdentity}
                              onChange={() => handleUpdateField(field.key, 'role', null)}
                            />
                            <span>Thông thường</span>
                          </label>
                        </div>
                      </div>

                      {/* Gợi ý nhập liệu */}
                      <div className={styles.hintBox}>
                        <input
                          type="text"
                          className={styles.hintInput}
                          placeholder="Văn bản gợi ý nhập (ví dụ: Nhập chính xác email để nhận vé)"
                          value={field.hint || ''}
                          onChange={(e) => handleUpdateField(field.key, 'hint', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CỘT PHẢI: XEM TRƯỚC FORM ĐIỀN TRỰC TIẾP (LIVE PREVIEW)        */}
        {/* ============================================================ */}
        <div className={`${styles.previewColumn} ${mobileTab === 'editor' ? styles.hideOnMobile : ''}`}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <EyeIcon size={16} />
              <h3 className={styles.previewTitle}>Xem trước Form đăng ký (Live)</h3>
            </div>
            <p className={styles.previewDesc}>
              Đây là giao diện biểu mẫu mà người tham dự sẽ nhìn thấy và điền trên landing page.
            </p>

            <form className={styles.simulatedForm} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.simulatedEventName}>
                {project.event?.eventName || project.name}
              </div>

              {activeFields.map((field) => (
                <div key={field.key} className={styles.simulatedGroup}>
                  <label className={styles.simulatedLabel}>
                    {field.label}
                    {field.required && (
                      <span className={styles.requiredStar}> * (bắt buộc)</span>
                    )}
                  </label>
                  <input
                    type={field.type}
                    inputMode={field.type === FIELD_TYPES.NUMBER ? 'numeric' : field.type === FIELD_TYPES.TEL ? 'tel' : 'text'}
                    placeholder={field.hint || `Nhập ${field.label.toLowerCase()}...`}
                    className={styles.simulatedInput}
                    disabled
                  />
                  {field.hint && <span className={styles.simulatedHint}>{field.hint}</span>}
                </div>
              ))}

              <button type="button" className={styles.simulatedSubmitBtn} disabled>
                Đăng ký tham gia ngay
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Thanh trạng thái tự động lưu liên tục */}
      <div className={styles.actionBar}>
        <div className={styles.saveNotice}>
          <div className={styles.autoSaveBadge}>
            <span className={styles.savePulseDot} />
            <span><strong>Tự động lưu:</strong> Cấu hình form được lưu liên tục theo thời gian thực (không cần nhấn lưu).</span>
          </div>
          <span className={styles.lastSavedText}>Lần lưu gần nhất: {lastSavedTime}</span>
        </div>
        <button
          type="button"
          className={styles.btnSaveSecondary}
          onClick={handleManualSave}
          title="Hệ thống đã tự động lưu toàn bộ trường form. Bạn có thể bấm để đồng bộ ngay lập tức nếu muốn."
        >
          <CheckIcon size={16} />
          <span>Đã lưu an toàn</span>
        </button>
      </div>

      {/* Dialog Xác nhận Khôi phục Mặc định */}
      <ConfirmDialog
        isOpen={isRestoreConfirmOpen}
        title="Khôi phục bộ trường mặc định?"
        message="Thao tác này sẽ đặt lại form về 3 trường tiêu chuẩn: Họ và tên, MSV và Email. Các trường tự tạo thêm sẽ được lưu trữ an toàn."
        confirmLabel="Khôi phục mặc định"
        cancelLabel="Hủy"
        onConfirm={handleRestoreDefaults}
        onCancel={() => setIsRestoreConfirmOpen(false)}
      />
    </div>
  );
}
