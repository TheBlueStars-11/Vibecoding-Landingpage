import React, { useState, useRef, useCallback } from 'react';
import styles from './WorkspaceInfo.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import { validateProjectInfo } from '../../domain/validators.js';
import { compressImage } from '../../domain/imageCompressor.js';
import { createAssetImage, generateId, ASSET_ROLES } from '../../domain/elsSchema.js';
import {
  UploadIcon,
  TrashIcon,
  PlusIcon,
  MoveUpIcon,
  MoveDownIcon,
  AlertCircleIcon,
  CheckIcon,
} from '../ui/Icons.jsx';

export function WorkspaceInfo({ project, onUpdateProject, onSaveStatusChange, onShowToast }) {
  // Trạng thái form sự kiện
  const [eventData, setEventData] = useState(() => ({
    eventName: project.event?.eventName || project.name || '',
    eventDate: project.event?.eventDate || '',
    eventTime: project.event?.eventTime || '09:00',
    venue: project.event?.venue || '',
    description: project.event?.description || '',
    speakers: project.event?.speakers?.length
      ? project.event.speakers
      : [{ id: generateId('spk'), name: '', title: '' }],
    earlyBirdOffer: project.event?.earlyBirdOffer || '',
    earlyBirdDeadline: project.event?.earlyBirdDeadline || '',
    agenda: project.event?.agenda?.length
      ? project.event.agenda
      : [
          { id: generateId('ag'), time: '09:00', title: 'Đón tiếp & Check-in' },
          { id: generateId('ag'), time: '09:30', title: 'Khai mạc & Nội dung chính' },
        ],
  }));

  // Thư viện ảnh nguồn
  const [assets, setAssets] = useState(() => elsRepository.getAssets(project.id));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Validation & Auto-save tức thì (kể cả khi chuyển sang Workspace khác ngay lập tức)
  const [errors, setErrors] = useState({});
  const [lastSavedTime, setLastSavedTime] = useState(() => {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  });
  const fileInputRef = useRef(null);

  // Hàm thực thi lưu dự án tức thì vào LocalStorage và đồng bộ ngay state ứng dụng
  const performSave = useCallback((dataToSave) => {
    try {
      const exactName = dataToSave.eventName || project.name;
      const updatedProject = {
        ...project,
        name: exactName,
        event: dataToSave,
        ...(project.ai ? { ai: { ...project.ai, headline: exactName } } : {}),
      };
      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      setLastSavedTime(timeStr);
    } catch (err) {
      console.error('Lỗi autosave:', err);
      onSaveStatusChange?.('error');
    }
  }, [project, onUpdateProject, onSaveStatusChange]);

  // Xử lý thay đổi trường đơn (Lưu tự động tức thì)
  const handleFieldChange = (field, value) => {
    const nextData = { ...eventData, [field]: value };
    setEventData(nextData);
    performSave(nextData);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ==========================
  // XỬ LÝ DIỄN GIẢ
  // ==========================
  const handleSpeakerChange = (id, key, val) => {
    const nextData = {
      ...eventData,
      speakers: eventData.speakers.map((s) => (s.id === id ? { ...s, [key]: val } : s)),
    };
    setEventData(nextData);
    performSave(nextData);
    if (errors.speakers) {
      setErrors((prevErr) => {
        const next = { ...prevErr };
        delete next.speakers;
        return next;
      });
    }
  };

  const handleAddSpeaker = () => {
    if (eventData.speakers.length >= 8) {
      onShowToast?.('Tối đa 8 diễn giả cho một sự kiện.', 'error');
      return;
    }
    const nextData = {
      ...eventData,
      speakers: [...eventData.speakers, { id: generateId('spk'), name: '', title: '' }],
    };
    setEventData(nextData);
    performSave(nextData);
  };

  const handleRemoveSpeaker = (id) => {
    if (eventData.speakers.length <= 1) {
      onShowToast?.('Cần ít nhất 1 diễn giả cho sự kiện.', 'error');
      return;
    }
    const nextData = {
      ...eventData,
      speakers: eventData.speakers.filter((s) => s.id !== id),
    };
    setEventData(nextData);
    performSave(nextData);
  };

  // ==========================
  // XỬ LÝ CHƯƠNG TRÌNH (AGENDA)
  // ==========================
  const handleAgendaChange = (id, key, val) => {
    const nextData = {
      ...eventData,
      agenda: eventData.agenda.map((item) => (item.id === id ? { ...item, [key]: val } : item)),
    };
    setEventData(nextData);
    performSave(nextData);
    if (errors.agenda) {
      setErrors((prevErr) => {
        const next = { ...prevErr };
        delete next.agenda;
        return next;
      });
    }
  };

  const handleAddAgendaItem = () => {
    const nextData = {
      ...eventData,
      agenda: [...eventData.agenda, { id: generateId('ag'), time: '10:00', title: '' }],
    };
    setEventData(nextData);
    performSave(nextData);
  };

  const handleRemoveAgendaItem = (id) => {
    if (eventData.agenda.length <= 1) {
      onShowToast?.('Chương trình cần có ít nhất 1 mục.', 'error');
      return;
    }
    const nextData = {
      ...eventData,
      agenda: eventData.agenda.filter((item) => item.id !== id),
    };
    setEventData(nextData);
    performSave(nextData);
  };

  const handleMoveAgendaItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= eventData.agenda.length) return;
    const items = [...eventData.agenda];
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    const nextData = { ...eventData, agenda: items };
    setEventData(nextData);
    performSave(nextData);
  };

  // ==========================
  // XỬ LÝ THƯ VIỆN ẢNH (ASSETS)
  // ==========================
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    if (assets.length >= 8) {
      setUploadError('Đã đạt giới hạn tối đa 8 ảnh cho sự kiện.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const file = files[0];
      const compressed = await compressImage(file);
      const newAsset = createAssetImage({
        projectId: project.id,
        dataUrl: compressed.dataUrl,
        caption: file.name.replace(/\.[^/.]+$/, ''), // Gợi ý tên file làm mô tả ban đầu
        role: ASSET_ROLES.OTHER,
        width: compressed.width,
        height: compressed.height,
        sizeKB: compressed.sizeKB,
      });

      elsRepository.saveAsset(project.id, newAsset);
      const updatedAssets = elsRepository.getAssets(project.id);
      setAssets(updatedAssets);
      onShowToast?.(`Đã tải ảnh lên thành công (${compressed.sizeKB} KB). Vui lòng kiểm tra mô tả ảnh.`, 'success');
    } catch (err) {
      setUploadError(err.message || 'Lỗi khi xử lý ảnh.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateAsset = (id, key, val) => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    const updated = { ...asset, [key]: val };
    elsRepository.saveAsset(project.id, updated);
    setAssets(elsRepository.getAssets(project.id));
  };

  const handleDeleteAsset = (id) => {
    elsRepository.deleteAsset(project.id, id);
    setAssets(elsRepository.getAssets(project.id));
    onShowToast?.('Đã xóa ảnh.', 'info');
  };

  // ==========================
  // LƯU THỦ CÔNG & KIỂM TRA ĐẦY ĐỦ
  // ==========================
  const handleManualSave = () => {
    const val = validateProjectInfo(eventData, assets);
    setErrors(val.errors);

    if (!val.isValid) {
      onShowToast?.('Vui lòng hoàn thiện các trường thông tin còn thiếu.', 'error');
      // Scroll to first error
      if (val.firstErrorField) {
        const el = document.getElementById(`field-${val.firstErrorField}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      const exactName = eventData.eventName || project.name;
      const updatedProject = {
        ...project,
        name: exactName,
        event: eventData,
        ...(project.ai ? { ai: { ...project.ai, headline: exactName } } : {}),
      };
      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      onShowToast?.('Đã lưu toàn bộ thông tin sự kiện thành công.', 'success');
    } catch (err) {
      onShowToast?.(`Không thể lưu: ${err.message}`, 'error');
    }
  };

  // Tổng dung lượng ảnh
  const totalAssetsSizeKB = assets.reduce((sum, a) => sum + (a.sizeKB || 0), 0);

  return (
    <div className={styles.workspaceContainer}>
      {/* Tóm tắt lỗi nếu có */}
      {Object.keys(errors).length > 0 && (
        <div className={styles.errorSummary} role="alert">
          <div className={styles.errorSummaryHeader}>
            <AlertCircleIcon size={18} />
            <strong>Vui lòng kiểm tra lại {Object.keys(errors).length} thông tin:</strong>
          </div>
          <ul className={styles.errorList}>
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key}>
                <a href={`#field-${key}`} className={styles.errorLink}>{msg}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.layoutTwoColumns}>
        {/* ============================================================ */}
        {/* CỘT TRÁI: FORM 7 TRƯỜNG THÔNG TIN SỰ KIỆN                     */}
        {/* ============================================================ */}
        <div className={styles.formColumn}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>1. Thông tin chung sự kiện</h2>
              <span className={styles.badgeRequired}>* Bắt buộc</span>
            </div>

            {/* 1. Tên sự kiện */}
            <div className={styles.formGroup} id="field-eventName">
              <label htmlFor="input-eventName" className={styles.label}>
                Tên sự kiện <span className={styles.required}>*</span>
              </label>
              <input
                id="input-eventName"
                type="text"
                className={`${styles.input} ${errors.eventName ? styles.inputError : ''}`}
                placeholder="Nhập tên sự kiện"
                value={eventData.eventName}
                onChange={(e) => handleFieldChange('eventName', e.target.value)}
                maxLength={120}
              />
              {errors.eventName && (
                <span className={styles.errorMessage}>
                  <AlertCircleIcon size={14} /> {errors.eventName}
                </span>
              )}
            </div>

            {/* 2 & 3. Ngày và Giờ */}
            <div className={styles.rowTwoCols}>
              <div className={styles.formGroup} id="field-eventDate">
                <label htmlFor="input-eventDate" className={styles.label}>
                  Ngày diễn ra <span className={styles.required}>*</span>
                </label>
                <input
                  id="input-eventDate"
                  type="date"
                  className={`${styles.input} ${errors.eventDate ? styles.inputError : ''}`}
                  value={eventData.eventDate}
                  onChange={(e) => handleFieldChange('eventDate', e.target.value)}
                />
                {errors.eventDate && <p className={styles.errorText}>{errors.eventDate}</p>}
              </div>

              <div className={styles.formGroup} id="field-eventTime">
                <label htmlFor="input-eventTime" className={styles.label}>
                  Giờ bắt đầu <span className={styles.required}>*</span>
                </label>
                <input
                  id="input-eventTime"
                  type="time"
                  className={`${styles.input} ${errors.eventTime ? styles.inputError : ''}`}
                  value={eventData.eventTime}
                  onChange={(e) => handleFieldChange('eventTime', e.target.value)}
                />
                {errors.eventTime && <p className={styles.errorText}>{errors.eventTime}</p>}
              </div>
            </div>

            {/* 4. Địa điểm */}
            <div className={styles.formGroup} id="field-venue">
              <label htmlFor="input-venue" className={styles.label}>
                Địa điểm tổ chức <span className={styles.required}>*</span>
              </label>
              <input
                id="input-venue"
                type="text"
                className={`${styles.input} ${errors.venue ? styles.inputError : ''}`}
                placeholder="Nhập địa chỉ tổ chức sự kiện hoặc link phòng họp online"
                value={eventData.venue}
                onChange={(e) => handleFieldChange('venue', e.target.value)}
                maxLength={200}
              />
              {errors.venue && (
                <p className={styles.errorText}>{errors.venue}</p>
              )}
            </div>

            {/* Mô tả thêm sự kiện (Không bắt buộc) */}
            <div className={styles.formGroup} id="field-description">
              <div className={styles.labelRow}>
                <label htmlFor="input-description" className={styles.label}>
                  Mô tả thêm sự kiện
                </label>
                <span className={styles.badgeOptional}>Không bắt buộc</span>
              </div>
              <textarea
                id="input-description"
                rows={3}
                className={styles.textarea}
                placeholder="Nhập thêm chi tiết về chủ đề, mục tiêu hoặc phong cách mong muốn..."
                value={eventData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                maxLength={1000}
              />
              <div className={styles.charCount}>
                {(eventData.description || '').length}/1000 ký tự
              </div>
            </div>

            {/* 6. Ưu đãi đăng ký sớm */}
            <div className={styles.formGroup} id="field-earlyBirdOffer">
              <label htmlFor="input-earlyBird" className={styles.label}>
                Ưu đãi đăng ký sớm <span className={styles.required}>*</span>
              </label>
              <textarea
                id="input-earlyBird"
                rows={2}
                className={`${styles.textarea} ${errors.earlyBirdOffer ? styles.inputError : ''}`}
                placeholder="Nhập ưu đãi dành cho người đăng ký sớm"
                value={eventData.earlyBirdOffer}
                onChange={(e) => handleFieldChange('earlyBirdOffer', e.target.value)}
                maxLength={300}
              />
              <div className={styles.charCount}>
                {eventData.earlyBirdOffer.length}/300 ký tự
              </div>
              {errors.earlyBirdOffer && <p className={styles.errorText}>{errors.earlyBirdOffer}</p>}
            </div>
          </div>

          {/* 5. Danh sách Diễn giả */}
          <div className={styles.sectionCard} id="field-speakers">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>2. Danh sách Diễn giả</h2>
              <button
                type="button"
                className={styles.btnAddSmall}
                onClick={handleAddSpeaker}
              >
                <PlusIcon size={14} />
                <span>Thêm diễn giả</span>
              </button>
            </div>

            {errors.speakers && <p className={styles.errorText}>{errors.speakers}</p>}

            <div className={styles.speakerList}>
              {eventData.speakers.map((speaker, index) => (
                <div key={speaker.id} className={styles.speakerRow}>
                  <span className={styles.indexCircle}>{index + 1}</span>
                  <div className={styles.speakerInputs}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Họ và tên diễn giả *"
                      value={speaker.name}
                      onChange={(e) => handleSpeakerChange(speaker.id, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Chức danh / Đơn vị công tác"
                      value={speaker.title || ''}
                      onChange={(e) => handleSpeakerChange(speaker.id, 'title', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.btnTrash}
                    onClick={() => handleRemoveSpeaker(speaker.id)}
                    title="Xóa diễn giả"
                    aria-label={`Xóa diễn giả ${speaker.name || index + 1}`}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Chương trình sự kiện (Agenda) */}
          <div className={styles.sectionCard} id="field-agenda">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>3. Chương trình chi tiết</h2>
              <button
                type="button"
                className={styles.btnAddSmall}
                onClick={handleAddAgendaItem}
              >
                <PlusIcon size={14} />
                <span>Thêm mốc giờ</span>
              </button>
            </div>

            {errors.agenda && <p className={styles.errorText}>{errors.agenda}</p>}

            <div className={styles.agendaList}>
              {eventData.agenda.map((item, index) => (
                <div key={item.id} className={styles.agendaRow}>
                  <div className={styles.reorderButtons}>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveAgendaItem(index, -1)}
                      className={styles.btnReorder}
                      title="Di chuyển lên"
                      aria-label="Di chuyển lên"
                    >
                      <MoveUpIcon size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === eventData.agenda.length - 1}
                      onClick={() => handleMoveAgendaItem(index, 1)}
                      className={styles.btnReorder}
                      title="Di chuyển xuống"
                      aria-label="Di chuyển xuống"
                    >
                      <MoveDownIcon size={14} />
                    </button>
                  </div>

                  <input
                    type="time"
                    className={styles.agendaTimeInput}
                    value={item.time}
                    onChange={(e) => handleAgendaChange(item.id, 'time', e.target.value)}
                  />

                  <input
                    type="text"
                    className={styles.agendaTitleInput}
                    placeholder="Nội dung chương trình *"
                    value={item.title}
                    onChange={(e) => handleAgendaChange(item.id, 'title', e.target.value)}
                  />

                  <button
                    type="button"
                    className={styles.btnTrash}
                    onClick={() => handleRemoveAgendaItem(item.id)}
                    title="Xóa mục này"
                    aria-label="Xóa mục chương trình"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CỘT PHẢI: KHU NHẬP ẢNH NGUỒN (ASSET LIBRARY)                  */}
        {/* ============================================================ */}
        <div className={styles.assetsColumn}>
          <div className={styles.sectionCard} id="field-assets">
            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 className={styles.cardTitle}>Thư viện ảnh nguồn</h2>
                <p className={styles.cardSubtitle}>
                  Đã tải {assets.length}/8 ảnh · {(totalAssetsSizeKB / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>

            {/* Vùng Dropzone Upload */}
            <div
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.hiddenFileInput}
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={isUploading || assets.length >= 8}
              />
              <UploadIcon size={28} className={styles.uploadIcon} />
              <p className={styles.dropzoneText}>
                {isUploading ? (
                  <strong>Đang nén và tối ưu ảnh qua Canvas...</strong>
                ) : assets.length >= 8 ? (
                  <span>Đã đạt tối đa 8 ảnh. Hãy xóa bớt để thêm ảnh mới.</span>
                ) : (
                  <>
                    <strong>Nhấn để chọn ảnh</strong> hoặc kéo thả vào đây
                    <br />
                    <span className={styles.dropzoneSub}>Tối đa 5MB/ảnh</span>
                  </>
                )}
              </p>
            </div>

            {uploadError && <p className={styles.errorText}>{uploadError}</p>}
            {errors.assets && <p className={styles.errorText}>{errors.assets}</p>}

            {/* Danh sách ảnh đã upload */}
            <div className={styles.assetList}>
              {assets.length === 0 ? (
                <div className={styles.emptyAssets}>
                  <p>Chưa có ảnh nào được tải lên.</p>
                  <span>Tải ảnh diễn giả, địa điểm hoặc phần quà để hiển thị trực quan trên landing page.</span>
                </div>
              ) : (
                assets.map((asset) => (
                  <div key={asset.id} className={styles.assetItem}>
                    <div className={styles.assetThumbWrapper}>
                      <img
                        src={asset.dataUrl}
                        alt={asset.caption || 'Ảnh nguồn sự kiện'}
                        className={styles.assetThumb}
                      />
                      <span className={styles.assetSizeTag}>{asset.sizeKB} KB</span>
                    </div>

                    <div className={styles.assetDetails}>
                      <div className={styles.formGroup}>
                        <label className={styles.labelSmall}>
                          Mô tả ảnh <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          className={styles.inputSmall}
                          placeholder="Mô tả ảnh"
                          value={asset.caption}
                          onChange={(e) => handleUpdateAsset(asset.id, 'caption', e.target.value)}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.labelSmall}>Vai trò ảnh</label>
                        <div className={styles.roleRadios}>
                          <label className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`role-${asset.id}`}
                              checked={asset.role === ASSET_ROLES.SPEAKER}
                              onChange={() => handleUpdateAsset(asset.id, 'role', ASSET_ROLES.SPEAKER)}
                            />
                            <span>Diễn giả</span>
                          </label>
                          <label className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`role-${asset.id}`}
                              checked={asset.role === ASSET_ROLES.VENUE}
                              onChange={() => handleUpdateAsset(asset.id, 'role', ASSET_ROLES.VENUE)}
                            />
                            <span>Địa điểm</span>
                          </label>
                          <label className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`role-${asset.id}`}
                              checked={asset.role === ASSET_ROLES.GIFT}
                              onChange={() => handleUpdateAsset(asset.id, 'role', ASSET_ROLES.GIFT)}
                            />
                            <span>Quà tặng</span>
                          </label>
                          <label className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`role-${asset.id}`}
                              checked={asset.role === ASSET_ROLES.OTHER}
                              onChange={() => handleUpdateAsset(asset.id, 'role', ASSET_ROLES.OTHER)}
                            />
                            <span>Khác</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.btnDeleteAsset}
                      onClick={() => handleDeleteAsset(asset.id)}
                      title="Xóa ảnh"
                      aria-label="Xóa ảnh này"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh trạng thái tự động lưu liên tục */}
      <div className={styles.actionBar}>
        <div className={styles.saveNotice}>
          <div className={styles.autoSaveBadge}>
            <span className={styles.savePulseDot} />
            <span><strong>Tự động lưu:</strong> Mọi thay đổi thông tin đều được tự động lưu theo thời gian thực.</span>
          </div>
          <span className={styles.lastSavedText}>Lần lưu gần nhất: {lastSavedTime}</span>
        </div>
        <button
          type="button"
          className={styles.btnSaveSecondary}
          onClick={handleManualSave}
          title="Hệ thống đã tự động lưu toàn bộ dữ liệu. Bạn có thể bấm để đồng bộ ngay lập tức nếu muốn."
        >
          <CheckIcon size={16} />
          <span>Đã lưu an toàn</span>
        </button>
      </div>
    </div>
  );
}

