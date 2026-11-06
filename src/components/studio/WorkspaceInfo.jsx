import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './WorkspaceInfo.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import { validateProjectInfo } from '../../domain/validators.js';
import { compressImage } from '../../domain/imageCompressor.js';
import { createAssetImage, generateId, ASSET_ROLES } from '../../domain/elsSchema.js';
import { createDefaultSampleAssets } from '../../domain/sampleAssets.js';
import {
  UploadIcon,
  TrashIcon,
  PlusIcon,
  MoveUpIcon,
  MoveDownIcon,
  AlertCircleIcon,
  CheckIcon,
  CodeIcon,
  SparklesIcon,
  LockIcon,
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

  // Validation
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(() => {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  });
  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Hàm thực thi lưu dự án an toàn theo thời gian thực
  const performSave = useCallback((dataToSave = eventData) => {
    try {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const updatedProject = {
        ...project,
        name: dataToSave.eventName || project.name,
        event: dataToSave,
      };
      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      setIsDirty(false);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      setLastSavedTime(timeStr);
    } catch (err) {
      console.error('Lỗi autosave:', err);
      onSaveStatusChange?.('error');
    }
  }, [eventData, project, onUpdateProject, onSaveStatusChange]);

  // Debounced Autosave (400ms) - Tự động lưu liên tục theo thời gian thực
  useEffect(() => {
    if (!isDirty) return;

    onSaveStatusChange?.('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      performSave(eventData);
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [eventData, isDirty, performSave, onSaveStatusChange]);

  // Xử lý thay đổi trường đơn
  const handleFieldChange = (field, value) => {
    if (field === 'eventName') return; // Tên sự kiện không được thay đổi
    setEventData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
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
    setEventData((prev) => ({
      ...prev,
      speakers: prev.speakers.map((s) => (s.id === id ? { ...s, [key]: val } : s)),
    }));
    setIsDirty(true);
    if (errors.speakers) {
      setErrors((prev) => {
        const next = { ...prev };
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
    setEventData((prev) => ({
      ...prev,
      speakers: [...prev.speakers, { id: generateId('spk'), name: '', title: '' }],
    }));
    setIsDirty(true);
  };

  const handleRemoveSpeaker = (id) => {
    if (eventData.speakers.length <= 1) {
      onShowToast?.('Cần ít nhất 1 diễn giả cho sự kiện.', 'error');
      return;
    }
    setEventData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((s) => s.id !== id),
    }));
    setIsDirty(true);
  };

  // ==========================
  // XỬ LÝ CHƯƠNG TRÌNH (AGENDA)
  // ==========================
  const handleAgendaChange = (id, key, val) => {
    setEventData((prev) => ({
      ...prev,
      agenda: prev.agenda.map((item) => (item.id === id ? { ...item, [key]: val } : item)),
    }));
    setIsDirty(true);
    if (errors.agenda) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.agenda;
        return next;
      });
    }
  };

  const handleAddAgendaItem = () => {
    setEventData((prev) => ({
      ...prev,
      agenda: [...prev.agenda, { id: generateId('ag'), time: '10:00', title: '' }],
    }));
    setIsDirty(true);
  };

  const handleRemoveAgendaItem = (id) => {
    if (eventData.agenda.length <= 1) {
      onShowToast?.('Chương trình cần có ít nhất 1 mục.', 'error');
      return;
    }
    setEventData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((item) => item.id !== id),
    }));
    setIsDirty(true);
  };

  const handleMoveAgendaItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= eventData.agenda.length) return;
    const items = [...eventData.agenda];
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    setEventData((prev) => ({ ...prev, agenda: items }));
    setIsDirty(true);
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
      const updatedProject = {
        ...project,
        name: eventData.eventName,
        event: eventData,
      };
      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      setIsDirty(false);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      onShowToast?.('Đã lưu toàn bộ thông tin sự kiện thành công.', 'success');
    } catch (err) {
      onShowToast?.(`Không thể lưu: ${err.message}`, 'error');
    }
  };

  // ==============================================================
  // ĐIỀN DỮ LIỆU MẪU ĐẦY ĐỦ TỰ ĐỘNG (DEV MODE AUTO-FILL)
  // Gồm cả thông tin sự kiện, 3 diễn giả, và 6 ảnh mẫu chất lượng cao (AI)
  // ==============================================================
  const handleDevAutofill = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const projId = project?.id || 'default_project';

      // 1. Tạo ngày sự kiện trong tương lai (15 ngày tới)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const eventDateStr = futureDate.toISOString().split('T')[0];

      // Ngày hết hạn Early Bird (7 ngày tới)
      const earlyBirdDate = new Date();
      earlyBirdDate.setDate(earlyBirdDate.getDate() + 7);
      const earlyBirdStr = earlyBirdDate.toISOString().split('T')[0];

      const spk1Id = generateId('spk');
      const spk2Id = generateId('spk');
      const spk3Id = generateId('spk');

      const mockEvent = {
        eventName: 'Hội thảo AI & Vibe Coding Vietnam 2026: Kiến tạo tương lai',
        eventDate: eventDateStr,
        eventTime: '08:30',
        venue: 'Trung tâm Đổi mới Sáng tạo Quốc gia (NIC), Tòa nhà HITC, Cầu Giấy, Hà Nội',
        description: 'Hội thảo chuyên sâu về công nghệ lập trình trực quan (Vibe Coding) và thiết kế giao diện hiện đại với Generative AI dành cho sinh viên và lập trình viên trẻ.',
        speakers: [
          { id: spk1Id, name: 'TS. Nguyễn Văn An', title: 'Viện trưởng Viện Nghiên cứu Trí tuệ Nhân tạo' },
          { id: spk2Id, name: 'ThS. Trần Thị Mai Phương', title: 'Lead AI Architect @ TechCorp Global' },
          { id: spk3Id, name: 'Ông Lê Hoàng Minh', title: 'Chuyên gia Thiết kế Hệ thống & Vibe Coder' },
        ],
        earlyBirdOffer: 'Tặng bộ Ebook Vibe Coding trị giá 500.000đ & Áo thun độc quyền cho 50 vé đầu tiên',
        earlyBirdDeadline: earlyBirdStr,
        agenda: [
          { id: generateId('ag'), time: '08:30', title: 'Đón tiếp, Check-in & Trải nghiệm khu vực công nghệ Demo' },
          { id: generateId('ag'), time: '09:00', title: 'Khai mạc & Keynote: Kỷ nguyên mới của Vibe Coding và Lập trình Tự động' },
          { id: generateId('ag'), time: '10:30', title: 'Thực chiến: Xây dựng Landing Page đa nền tảng trong 15 phút' },
          { id: generateId('ag'), time: '11:30', title: 'Tọa đàm Q&A với các diễn giả & Rút thăm trúng thưởng' },
        ],
      };

      setEventData(mockEvent);
      setErrors({});
      setIsDirty(false);

      // 2. Điền bộ 6 ảnh mẫu AI (Poster, 3 Diễn giả, Hội trường NIC, Giải thưởng quà tặng)
      const sampleAssets = createDefaultSampleAssets(projId, [spk1Id, spk2Id, spk3Id]);
      elsRepository.saveAssets(projId, sampleAssets);
      setAssets(sampleAssets);

      // 3. Khởi tạo nội dung AI nếu chưa có
      const updatedAi = project?.ai?.headline ? project.ai : {
        headline: 'Chinh phục kỷ nguyên Vibe Coding cùng các chuyên gia đầu ngành',
        description: 'Khám phá phương pháp xây dựng landing page và ứng dụng hiện đại với tốc độ gấp 10 lần. Cơ hội kết nối và học hỏi thực chiến dành cho Marketer và Developer.',
        benefits: [
          'Học cách thiết kế và tối ưu module landing page thích ứng mọi thiết bị.',
          'Làm chủ quy trình phát triển sản phẩm với sự hỗ trợ của Generative AI.',
          'Nhận trọn bộ tài liệu thực hành và chứng nhận hoàn thành độc quyền.',
        ],
        source: 'mock',
        edited: true,
      };

      const updatedProject = {
        ...project,
        id: projId,
        name: mockEvent.eventName,
        event: mockEvent,
        ai: updatedAi,
        updatedAt: new Date().toISOString(),
      };

      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      onShowToast?.('Đã tự động điền thông tin sự kiện & 6 ảnh mẫu AI kèm mô tả!', 'success');
    } catch (err) {
      console.error('Lỗi khi điền mẫu:', err);
      onShowToast?.(`Lỗi: ${err.message}`, 'error');
    }
  };

  // Nạp riêng bộ 6 ảnh mẫu AI
  const handleLoadSampleImagesOnly = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const projId = project?.id || 'default_project';
      const speakerIds = eventData.speakers?.map((s) => s.id) || [];
      const sampleAssets = createDefaultSampleAssets(projId, speakerIds);
      elsRepository.saveAssets(projId, sampleAssets);
      setAssets(sampleAssets);
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      onSaveStatusChange?.('saved', timeStr);
      onShowToast?.('Đã nạp thành công 6 ảnh mẫu AI (Diễn giả, Poster, Hội trường, Giải thưởng)!', 'success');
    } catch (err) {
      console.error('Lỗi khi nạp ảnh mẫu:', err);
      onShowToast?.(`Lỗi khi nạp ảnh mẫu: ${err.message}`, 'error');
    }
  };

  // Tổng dung lượng ảnh
  const totalAssetsSizeKB = assets.reduce((sum, a) => sum + (a.sizeKB || 0), 0);

  return (
    <div className={styles.workspaceContainer}>
      {/* Thanh công cụ đỉnh Workspace 1 kèm nút Dev Mode */}
      <div className={styles.workspaceTopBar}>
        <div className={styles.workspaceTopBarLeft}>
          <h2 className={styles.workspaceMainTitle}>1. Thông tin dự án &amp; Sự kiện</h2>
          <span className={styles.workspaceSubDesc}>Nhập đầy đủ thông tin để sẵn sàng tạo Landing Page và Form đăng ký</span>
        </div>
        <button
          type="button"
          className={styles.btnDevAutofill}
          onClick={handleDevAutofill}
          title="Tự động điền đầy đủ dữ liệu mẫu sự kiện chuyên nghiệp để kiểm thử nhanh"
        >
          <CodeIcon size={16} />
          <span>Điền mẫu nhanh (Dev Mode)</span>
        </button>
      </div>

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

            {/* 1. Tên sự kiện (Cố định theo dự án, không được thay đổi) */}
            <div className={styles.formGroup} id="field-eventName">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label htmlFor="input-eventName" className={styles.label} style={{ margin: 0 }}>
                  Tên sự kiện <span className={styles.required}>*</span>
                </label>
                <span className={styles.badgeLocked}>
                  <LockIcon size={12} /> Cố định theo dự án
                </span>
              </div>
              <input
                id="input-eventName"
                type="text"
                className={`${styles.input} ${styles.inputLocked}`}
                placeholder="Tên sự kiện"
                value={eventData.eventName}
                readOnly
                disabled
                title="Tên sự kiện được cố định theo tên dự án ban đầu và không được thay đổi."
              />
              <span className={styles.helperText}>Tên sự kiện được khóa cố định theo dự án để đảm bảo tính nhất quán trên toàn bộ landing page.</span>
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
                  Giờ bắt đầu (UTC+7) <span className={styles.required}>*</span>
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
                placeholder="Ví dụ: Hội trường Grand Hall, Tầng 3, 227 Nguyễn Văn Cừ, Q.5, TP.HCM"
                value={eventData.venue}
                onChange={(e) => handleFieldChange('venue', e.target.value)}
                maxLength={200}
              />
              {errors.venue ? (
                <p className={styles.errorText}>{errors.venue}</p>
              ) : (
                <span className={styles.helperText}>Nhập địa chỉ hội trường trực tiếp hoặc link phòng họp online (Zoom, Google Meet).</span>
              )}
            </div>

            {/* Mô tả thêm / Ghi chú sự kiện (Không bắt buộc) */}
            <div className={styles.formGroup} id="field-description">
              <div className={styles.labelRow}>
                <label htmlFor="input-description" className={styles.label}>
                  Mô tả thêm / Ghi chú sự kiện
                </label>
                <span className={styles.badgeOptional}>Không bắt buộc</span>
              </div>
              <textarea
                id="input-description"
                rows={3}
                className={styles.textarea}
                placeholder="Nhập thêm chi tiết về chủ đề, mục tiêu, đối tượng người tham dự hoặc phong cách mong muốn để AI tự động chọn bố cục thiết kế phù hợp nhất..."
                value={eventData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                maxLength={1000}
              />
              <div className={styles.charCount}>
                {(eventData.description || '').length}/1000 ký tự
              </div>
              <span className={styles.helperText}>
                Hệ thống sẽ phân tích mô tả này cùng tên sự kiện để tự động chọn bố cục module (Tech Talk, Workshop, Community, Gala...) và màu sắc tối ưu nhất.
              </span>
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
                placeholder="Ví dụ: Tặng Ebook Prompt Engineering trị giá 500k và vé mời giao lưu VIP cho 50 người đăng ký đầu tiên."
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
              <h2 className={styles.cardTitle}>2. Danh sách Diễn giả ({eventData.speakers.length})</h2>
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
              <h2 className={styles.cardTitle}>3. Chương trình chi tiết ({eventData.agenda.length} mục)</h2>
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
              <button
                type="button"
                className={styles.btnDevAutofill}
                onClick={handleLoadSampleImagesOnly}
                title="Tự động nạp 6 ảnh mẫu AI (3 diễn giả, sự kiện, địa điểm, giải thưởng)"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}
              >
                <SparklesIcon size={14} />
                <span>Nạp 6 ảnh mẫu AI</span>
              </button>
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
                    <span className={styles.dropzoneSub}>Tối đa 5MB/ảnh (JPG, PNG, WebP) — Tự động resize ≤1280px</span>
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
                          Mô tả ảnh <span className={styles.required}>* (Bắt buộc cho AI)</span>
                        </label>
                        <input
                          type="text"
                          className={styles.inputSmall}
                          placeholder="Ví dụ: Diễn giả 1 — TS. Nguyễn Văn A"
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
            <span><strong>Tự động lưu:</strong> Mọi thay đổi thông tin đều được tự động lưu liên tục theo thời gian thực (không cần nhấn lưu).</span>
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

