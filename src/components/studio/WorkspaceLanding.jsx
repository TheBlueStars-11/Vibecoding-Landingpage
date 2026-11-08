import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './WorkspaceLanding.module.css';
import { copyToClipboard } from '../../lib/clipboard.js';
import { elsRepository } from '../../services/elsRepository.js';
import { validateProjectInfo, validateFormFields } from '../../domain/validators.js';
import { generateMockContent } from '../../services/mockAi.js';
import { generateAiContent } from '../../services/aiClient.js';
import { PROJECT_STATUS } from '../../domain/elsSchema.js';
import { createPresetModuleTree, PRESET_TEMPLATES, COLOR_THEMES, inferPresetAndTheme, getSafeVariant, getDeletedModuleTypes } from '../../domain/moduleSchema.js';
import { LandingView } from '../landing/LandingView.jsx';
import {
  SparklesIcon,
  LaptopIcon,
  PhoneIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  CheckIcon,
  AlertCircleIcon,
  CopyIcon,
  PaletteIcon,
  RocketIcon,
  PencilIcon,
  PlusIcon,
} from '../ui/Icons.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { publishProjectToSync } from '../../services/realtimeSync.js';

// Trợ giúp khởi tạo giá trị nội dung AI với fallback thông minh
function getInitialAiValues(project) {
  const rawBenefits = Array.isArray(project?.ai?.benefits) ? project.ai.benefits : [];
  const hasValidBenefits = rawBenefits.some((b) => typeof b === 'string' && b.trim().length > 0);
  const defaultBenefits = [
    project?.event?.earlyBirdOffer
      ? `Ưu đãi đăng ký sớm: ${project.event.earlyBirdOffer}`
      : 'Tiếp cận tri thức và kinh nghiệm thực chiến từ chuyên gia.',
    Array.isArray(project?.event?.speakers) && project.event.speakers.length > 0
      ? `Giao lưu và kết nối trực tiếp cùng ${project.event.speakers.map((s) => s.name).filter(Boolean).slice(0, 2).join(', ')}.`
      : 'Mở rộng mạng lưới quan hệ chất lượng cao trong ngành.',
    'Nhận trọn bộ tài liệu chuyên sâu và chứng nhận tham gia.',
  ];
  return {
    headline: project?.ai?.headline || project?.event?.eventName || project?.name || '',
    description: project?.ai?.description || 'Tham gia cùng chúng tôi để kết nối và tiếp cận những nội dung giá trị nhất.',
    benefits: hasValidBenefits
      ? rawBenefits.map((b, idx) => (b && typeof b === 'string' && b.trim() ? b.trim() : defaultBenefits[idx] || ''))
      : defaultBenefits,
  };
}

export function WorkspaceLanding({ project, onUpdateProject, onSaveStatusChange, onShowToast, onNavigate }) {
  const [deviceMode, setDeviceMode] = useState('laptop'); // 'laptop' (1280px) | 'phone' (375px)
  const [previewKey, setPreviewKey] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Trạng thái chỉnh sửa AI thủ công
  const [editableAi, setEditableAi] = useState(() => getInitialAiValues(project));
  const [hasUnappliedEdits, setHasUnappliedEdits] = useState(false);
  const [prevProject, setPrevProject] = useState(project);

  // Đồng bộ lại khi project prop thay đổi mà không có chỉnh sửa dở dang (pattern React chuẩn)
  if (project !== prevProject) {
    setPrevProject(project);
    if (!hasUnappliedEdits) {
      setEditableAi(getInitialAiValues(project));
    }
  }

  // Dialog Xuất bản / Chia sẻ link
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUnpublishConfirmOpen, setIsUnpublishConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleConfirmResetPage = () => {
    setIsResetConfirmOpen(false);
    const newPrj = elsRepository.createProject({
      name: 'Sự kiện mới 2026',
    });
    elsRepository.setLastOpenProjectId(newPrj.id);
    if (onNavigate) {
      onNavigate(`p/${newPrj.id}/info`);
    } else {
      window.location.hash = `#/p/${newPrj.id}/info`;
    }
  };

  // Đo kích thước vùng hiển thị mô phỏng để tính tỷ lệ thu nhỏ Laptop trên màn hình điện thoại
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));

  useEffect(() => {
    const handleResize = () => {
      if (viewportRef.current) {
        setViewportWidth(viewportRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        setViewportWidth(window.innerWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tính toán thu nhỏ Laptop (1280x720) theo chiều ngang của màn hình điện thoại
  const isMobileScreen = viewportWidth > 0 && viewportWidth < 768;
  const isMobileLaptopScale = isMobileScreen && deviceMode === 'laptop';
  const availableMiniWidth = Math.max(260, Math.min(460, viewportWidth - 24));
  const laptopScale = Number((availableMiniWidth / 1280).toFixed(4));
  const scaledLaptopWidth = Math.round(1280 * laptopScale);
  const scaledLaptopHeight = Math.round(720 * laptopScale);

  const assets = useMemo(() => elsRepository.getAssets(project.id), [project.id]);

  // Phân tích tự động chủ đề sự kiện để chọn bố cục và phương pháp thiết kế tối ưu
  const autoRecommendation = useMemo(() => {
    return inferPresetAndTheme(project.event || { name: project.name });
  }, [project.event, project.name]);

  const activePresetId = project.modulePreset || autoRecommendation.presetId;

  // Pre-flight check: Kiểm tra dữ liệu đầu vào WS1 + WS2
  const preflight = useMemo(() => {
    const infoVal = validateProjectInfo(project.event, assets);
    const formVal = validateFormFields(project.formFields);

    const issues = [];
    if (!infoVal.isValid) {
      Object.values(infoVal.errors).forEach((e) => issues.push(e));
    }
    if (!formVal.isValid) {
      formVal.errors.forEach((e) => issues.push(e));
    }

    return {
      isReady: issues.length === 0,
      issues,
    };
  }, [project.event, project.formFields, assets]);

  // Xử lý tạo landing bằng AI (tự động phân tích bố cục & màu sắc phù hợp)
  const handleGenerateAi = async () => {
    if (isGenerating) return;

    if (!preflight.isReady) {
      onShowToast?.('Chưa đủ thông tin đầu vào. Vui lòng hoàn thiện WS1 và WS2.', 'error');
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    onSaveStatusChange?.('saving');

    try {
      const eventData = {
        name: project.event?.eventName || project.name,
        eventName: project.event?.eventName || project.name,
        date: project.event?.eventDate,
        time: project.event?.eventTime,
        datetime: `${project.event?.eventDate} ${project.event?.eventTime}`,
        location: project.event?.venue,
        venue: project.event?.venue,
        description: project.event?.description || '',
        speakers: (project.event?.speakers || []).map((s) => s.name).filter(Boolean).join(', '),
        earlyBird: project.event?.earlyBirdOffer,
        earlyBirdOffer: project.event?.earlyBirdOffer,
        imageCaptions: assets.map((a) => a.caption).filter(Boolean),
      };

      // Gọi AI thật (ADR-3, ADR-4: Không fallback Mock âm thầm khi lỗi)
      const aiResult = await generateAiContent(eventData, assets);
      applyAiResult(aiResult);
      onShowToast?.('Đã tạo nội dung bằng AI thật thành công!', 'success');
    } catch (err) {
      console.warn('[WorkspaceLanding] AI generation error:', err);
      setAiError(err.message || 'Lỗi khi kết nối dịch vụ AI. Dữ liệu của bạn được giữ nguyên.');
      onSaveStatusChange?.('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Người dùng chủ động chọn Dùng dữ liệu mô phỏng AI khi AI thật không khả dụng (ADR-3, TC-06)
  const handleUseMock = () => {
    setAiError(null);
    setIsGenerating(true);
    try {
      const eventData = {
        name: project.event?.eventName || project.name,
        eventName: project.event?.eventName || project.name,
        date: project.event?.eventDate,
        time: project.event?.eventTime,
        datetime: `${project.event?.eventDate} ${project.event?.eventTime}`,
        location: project.event?.venue,
        venue: project.event?.venue,
        description: project.event?.description || '',
        speakers: (project.event?.speakers || []).map((s) => s.name).filter(Boolean).join(', '),
        earlyBird: project.event?.earlyBirdOffer,
        earlyBirdOffer: project.event?.earlyBirdOffer,
        imageCaptions: assets.map((a) => a.caption).filter(Boolean),
      };
      const mockResult = generateMockContent(eventData, assets);
      applyAiResult(mockResult);
      onShowToast?.('Đã nạp dữ liệu mô phỏng AI (Bản demo vòng loại)', 'info');
    } catch (err) {
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Áp dụng kết quả AI hoặc Mock vào Landing Page & Module Tree
  const applyAiResult = (aiResult) => {
    const eventData = {
      name: project.event?.eventName || project.name,
      eventName: project.event?.eventName || project.name,
      date: project.event?.eventDate,
      time: project.event?.eventTime,
      datetime: `${project.event?.eventDate} ${project.event?.eventTime}`,
      location: project.event?.venue,
      venue: project.event?.venue,
      description: project.event?.description || '',
      speakers: (project.event?.speakers || []).map((s) => s.name).filter(Boolean).join(', '),
      earlyBird: project.event?.earlyBirdOffer,
      earlyBirdOffer: project.event?.earlyBirdOffer,
      imageCaptions: assets.map((a) => a.caption).filter(Boolean),
    };

    const inferredDesign = inferPresetAndTheme(eventData);
    const chosenPreset = aiResult.recommendedPreset || inferredDesign.presetId;
    const chosenColorTheme = aiResult.colorTheme || project.colorTheme || inferredDesign.colorTheme;
    const chosenReasoning = aiResult.designReasoning || inferredDesign.reasoning;
    const speakerCount = (project.event?.speakers || []).length;
    const chosenSpeakerVariant = getSafeVariant('speakers', aiResult.recommendedSpeakerVariant ||
      (speakerCount === 1 ? 'solo-spotlight' : 'portrait-cards'));

    const baseTree = createPresetModuleTree(chosenPreset);
    const deletedTypes = getDeletedModuleTypes();
    const enrichedTree = baseTree
      .filter((m) => !deletedTypes.includes(m.type))
      .map((m) => {
        const enriched = { ...m, variant: getSafeVariant(m.type, m.variant) };
        if (m.type === 'speakers') {
          enriched.variant = chosenSpeakerVariant;
        } else if (m.type === 'hero' && aiResult.imageAssignments?.heroImageId) {
          enriched.customContent = { ...enriched.customContent, heroImageId: aiResult.imageAssignments.heroImageId };
        } else if (m.type === 'venue' && aiResult.imageAssignments?.venueImageId) {
          enriched.customContent = { ...enriched.customContent, venueImageId: aiResult.imageAssignments.venueImageId };
        } else if (m.type === 'offer_banner') {
          if (aiResult.imageAssignments?.giftImageId) {
            enriched.customContent = { ...enriched.customContent, giftImageId: aiResult.imageAssignments.giftImageId };
          }
          if (aiResult.earlyBirdOffer || aiResult.couponCode) {
            enriched.customContent = {
              ...enriched.customContent,
              offer: aiResult.earlyBirdOffer || project.event?.earlyBirdOffer,
              code: aiResult.couponCode || '',
            };
          }
        } else if (m.type === 'faq' && Array.isArray(aiResult.faq) && aiResult.faq.length > 0) {
          enriched.customContent = { ...enriched.customContent, items: aiResult.faq };
        } else if (m.type === 'stats' && Array.isArray(aiResult.stats) && aiResult.stats.length > 0) {
          enriched.customContent = { ...enriched.customContent, stats: aiResult.stats };
        } else if (m.type === 'image_content' && aiResult.imageAssignments?.contentImageId) {
          enriched.customContent = { ...enriched.customContent, contentImageId: aiResult.imageAssignments.contentImageId };
        }
        return enriched;
      });

    const updatedProject = {
      ...project,
      ai: {
        ...aiResult,
        source: aiResult.source || 'mock',
        generatedAt: new Date().toISOString(),
        headline: aiResult.headline,
        description: aiResult.description,
        benefits: aiResult.benefits || aiResult.bullets || ['', '', ''],
        designReasoning: chosenReasoning,
        edited: false,
      },
      modulePreset: chosenPreset,
      colorTheme: chosenColorTheme,
      moduleLayout: enrichedTree,
    };

    elsRepository.saveProject(updatedProject);
    onUpdateProject?.(updatedProject);
    setEditableAi({
      headline: aiResult.headline,
      description: aiResult.description,
      benefits: aiResult.benefits || aiResult.bullets || ['', '', ''],
    });
    setHasUnappliedEdits(false);
    setPreviewKey((k) => k + 1);

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    onSaveStatusChange?.('saved', timeStr);
  };

  // Người dùng chủ động chọn Mẫu bố cục & Trường hợp sử dụng
  const handleSelectPreset = (presetId) => {
    const template = PRESET_TEMPLATES[presetId];
    if (!template) return;
    const baseTree = createPresetModuleTree(presetId);
    const deletedTypes = getDeletedModuleTypes();
    const enrichedTree = baseTree
      .filter((m) => !deletedTypes.includes(m.type))
      .map((m) => {
        const enriched = { ...m, variant: getSafeVariant(m.type, m.variant) };
        if (m.type === 'hero' && project.ai?.imageAssignments?.heroImageId) {
          enriched.customContent = { ...enriched.customContent, heroImageId: project.ai.imageAssignments.heroImageId };
        } else if (m.type === 'venue' && project.ai?.imageAssignments?.venueImageId) {
          enriched.customContent = { ...enriched.customContent, venueImageId: project.ai.imageAssignments.venueImageId };
        } else if (m.type === 'offer_banner' && project.ai?.imageAssignments?.giftImageId) {
          enriched.customContent = { ...enriched.customContent, giftImageId: project.ai.imageAssignments.giftImageId };
        } else if (m.type === 'image_content' && project.ai?.imageAssignments?.contentImageId) {
          enriched.customContent = { ...enriched.customContent, contentImageId: project.ai.imageAssignments.contentImageId };
        }
        return enriched;
      });

    const updated = {
      ...project,
      modulePreset: presetId,
      moduleLayout: enrichedTree,
    };
    elsRepository.saveProject(updated);
    onUpdateProject?.(updated);
    setPreviewKey((k) => k + 1);
    onShowToast?.(`Đã kích hoạt trường hợp sử dụng: ${template.name}`, 'success');
  };

  // Tự động phân tích lại bố cục và phương pháp thiết kế theo chủ đề sự kiện
  const handleAutoReanalyzeLayout = () => {
    const eventInfo = {
      ...(project.event || {}),
      name: project.event?.eventName || project.name,
      description: project.event?.description || '',
    };
    const inferred = inferPresetAndTheme(eventInfo);
    const baseTree = createPresetModuleTree(inferred.presetId);
    const deletedTypes = getDeletedModuleTypes();
    const enrichedTree = baseTree
      .filter((m) => !deletedTypes.includes(m.type))
      .map((m) => {
        const enriched = { ...m, variant: getSafeVariant(m.type, m.variant) };
        if (m.type === 'hero' && project.ai?.imageAssignments?.heroImageId) {
          enriched.customContent = { ...enriched.customContent, heroImageId: project.ai.imageAssignments.heroImageId };
        } else if (m.type === 'venue' && project.ai?.imageAssignments?.venueImageId) {
          enriched.customContent = { ...enriched.customContent, venueImageId: project.ai.imageAssignments.venueImageId };
        } else if (m.type === 'offer_banner' && project.ai?.imageAssignments?.giftImageId) {
          enriched.customContent = { ...enriched.customContent, giftImageId: project.ai.imageAssignments.giftImageId };
        } else if (m.type === 'image_content' && project.ai?.imageAssignments?.contentImageId) {
          enriched.customContent = { ...enriched.customContent, contentImageId: project.ai.imageAssignments.contentImageId };
        }
        return enriched;
      });

    const updated = {
      ...project,
      modulePreset: inferred.presetId,
      colorTheme: inferred.colorTheme,
      moduleLayout: enrichedTree,
      ai: {
        ...(project.ai || {}),
        designReasoning: inferred.reasoning,
      },
    };
    elsRepository.saveProject(updated);
    onUpdateProject?.(updated);
    setPreviewKey((k) => k + 1);
    onShowToast?.(`Đã tự động tối ưu bố cục theo chủ đề: ${PRESET_TEMPLATES[inferred.presetId]?.name}`, 'success');
  };

  // Chọn màu chủ đạo cho Landing Page
  const handleSelectColorTheme = (themeId) => {
    const updated = {
      ...project,
      colorTheme: themeId,
    };
    elsRepository.saveProject(updated);
    onUpdateProject?.(updated);
    setPreviewKey((k) => k + 1);
    const themeName = COLOR_THEMES.find((t) => t.id === themeId)?.name || themeId;
    onShowToast?.(`Đã đổi màu chủ đạo: ${themeName}`, 'success');
  };

  // Áp dụng chỉnh sửa AI thủ công
  const handleApplyEdits = () => {
    try {
      const updatedProject = {
        ...project,
        ai: {
          ...project.ai,
          headline: editableAi.headline,
          description: editableAi.description,
          benefits: editableAi.benefits,
          edited: true,
          updatedAt: new Date().toISOString(),
        },
      };
      elsRepository.saveProject(updatedProject);
      onUpdateProject?.(updatedProject);
      setHasUnappliedEdits(false);
      setPreviewKey((k) => k + 1);
      onShowToast?.('Đã áp dụng thay đổi nội dung vào landing page.', 'success');
    } catch (err) {
      onShowToast?.(`Lỗi lưu: ${err.message}`, 'error');
    }
  };

  // Xuất bản / Gỡ xuất bản
  const handleTogglePublish = () => {
    if (project.status === PROJECT_STATUS.PUBLISHED) {
      setIsUnpublishConfirmOpen(true);
    } else {
      if (!project.ai?.headline) {
        onShowToast?.('Vui lòng tạo nội dung AI trước khi xuất bản.', 'error');
        return;
      }
      try {
        const updated = { ...project, status: PROJECT_STATUS.PUBLISHED };
        elsRepository.saveProject(updated);
        onUpdateProject?.(updated);
        publishProjectToSync(updated, assets).catch(() => { });
        setIsShareModalOpen(true);
        onShowToast?.('Đã xuất bản landing page thành công!', 'success');
      } catch (err) {
        onShowToast?.(`Lỗi xuất bản: ${err.message}`, 'error');
      }
    }
  };

  const handleConfirmUnpublish = () => {
    try {
      const updated = { ...project, status: PROJECT_STATUS.DRAFT };
      elsRepository.saveProject(updated);
      onUpdateProject?.(updated);
      setIsUnpublishConfirmOpen(false);
      onShowToast?.('Đã chuyển về Bản nháp (ngừng nhận đơn công khai).', 'info');
    } catch (err) {
      onShowToast?.(`Lỗi: ${err.message}`, 'error');
    }
  };

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#/e/${project.slug}`
    : `#/e/${project.slug}`;

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopiedLink(true);
      onShowToast?.('Đã sao chép link Landing Page!', 'info');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isMock = project.ai?.source === 'mock' || !project.ai?.source;

  return (
    <div className={styles.workspaceContainer}>
      {/* ============================================================ */}
      {/* 1. PANEL ĐỈNH: KIỂM TRA ĐẦU VÀO (PRE-FLIGHT) & TẠO AI         */}
      {/* ============================================================ */}
      <section className={styles.topPreflightPanel} aria-label="Kiểm tra đầu vào và tạo AI">
        <div className={styles.topPreflightContent}>
          <div className={styles.topPreflightLeft}>
            <div className={styles.topPreflightTitleGroup}>
              <h3 className={styles.topPreflightTitle}>
                <span>Kiểm tra đầu vào</span>
              </h3>
              <span className={styles.topPreflightSub}>
                Xác thực dữ liệu từ WS1 và WS2
              </span>
            </div>

            <div className={styles.topPreflightStatus}>
              {preflight.isReady ? (
                <div className={styles.preflightPassedBadge}>
                  <CheckIcon size={16} />
                  <span>Đã đủ thông tin từ WS1 &amp; WS2!</span>
                </div>
              ) : (
                <div className={styles.preflightFailedBadge}>
                  <AlertCircleIcon size={16} />
                  <span>Còn thiếu {preflight.issues.length} thông tin</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.topPreflightRight}>
            {/* Nhãn minh bạch AI bắt buộc theo quy chế FDD mục 6.3.7 */}
            {isMock && (
              <div className={styles.aiNoticeBadge}>
                <span className={styles.aiDot} />
                <strong>Bản demo vòng loại - Dữ liệu mô phỏng AI</strong>
              </div>
            )}

            <button
              type="button"
              className={styles.btnGenerateAiTop}
              onClick={handleGenerateAi}
              disabled={isGenerating || !preflight.isReady}
              aria-busy={isGenerating}
            >
              <SparklesIcon size={18} />
              <span>
                {isGenerating
                  ? 'Đang xử lý nội dung AI...'
                  : project.ai?.headline
                    ? 'Tạo lại nội dung bằng AI'
                    : 'Tạo landing bằng AI'}
              </span>
            </button>
          </div>
        </div>

        {/* Danh sách lỗi chi tiết nếu chưa đủ điều kiện */}
        {!preflight.isReady && (
          <div className={styles.topPreflightIssues}>
            <strong>Vui lòng hoàn thiện các mục sau trước khi tạo Landing Page:</strong>
            <ul>
              {preflight.issues.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {aiError && (
          <div className={styles.aiErrorBox} role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircleIcon size={18} />
              <strong style={{ fontSize: '0.95rem' }}>Không thể tạo nội dung bằng AI</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
              {typeof aiError === 'string' ? aiError : aiError.message}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <button
                type="button"
                className={styles.btnGenerateAiTop}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={handleGenerateAi}
                disabled={isGenerating}
              >
                <SparklesIcon size={15} /> Thử lại
              </button>
              <button
                type="button"
                className={styles.btnPresetOption}
                style={{ padding: '6px 14px', fontSize: '0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b' }}
                onClick={handleUseMock}
                disabled={isGenerating}
              >
                Dùng dữ liệu mô phỏng (Demo vòng loại)
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 2. KHUNG XEM TRƯỚC (RESPONSIVE PREVIEW) - CHIẾM TRỌN BỀ NGANG  */}
      {/* ============================================================ */}
      <main className={styles.previewMain} aria-label="Xem trước landing page">
        {/* Thanh công cụ chuyển thiết bị */}
        <div className={styles.previewToolbar}>
          <div className={styles.deviceSwitcher} role="group" aria-label="Chọn thiết bị xem trước">
            <button
              type="button"
              className={`${styles.deviceBtn} ${deviceMode === 'laptop' ? styles.activeDevice : ''}`}
              onClick={() => setDeviceMode('laptop')}
            >
              <LaptopIcon size={16} />
              <span className={styles.btnFullText}>Laptop</span>
              <span className={styles.btnShortText}>Laptop</span>
            </button>
            <button
              type="button"
              className={`${styles.deviceBtn} ${deviceMode === 'phone' ? styles.activeDevice : ''}`}
              onClick={() => setDeviceMode('phone')}
            >
              <PhoneIcon size={16} />
              <span className={styles.btnFullText}>Điện thoại</span>
              <span className={styles.btnShortText}>Điện thoại</span>
            </button>
          </div>

          <div className={styles.previewActions}>
            <button
              type="button"
              className={styles.btnResetPage}
              onClick={() => setIsResetConfirmOpen(true)}
              title="Khởi tạo landing page sự kiện mới"
            >
              <PlusIcon size={14} />
              <span className={styles.btnFullText}>Tạo trang mới</span>
              <span className={styles.btnShortText}>Tạo mới</span>
            </button>

            <button
              type="button"
              className={styles.toolbarIconBtn}
              title="Tải lại khung xem trước"
              aria-label="Tải lại preview"
              onClick={() => setPreviewKey((k) => k + 1)}
            >
              <RefreshCwIcon size={15} />
            </button>

            {project.status === PROJECT_STATUS.PUBLISHED && (
              <a
                href={`#/e/${project.slug}`}
                target="_blank"
                rel="noreferrer"
                className={styles.toolbarLinkBtn}
              >
                <ExternalLinkIcon size={13} />
                <span className={styles.btnFullText}>Mở tab công khai</span>
                <span className={styles.btnShortText}>Mở tab</span>
              </a>
            )}
          </div>
        </div>

        {/* Khung thiết bị mô phỏng */}
        <div className={styles.deviceViewportContainer} ref={viewportRef}>
          {isMobileLaptopScale ? (
            <div className={styles.miniLaptopContainer} key={previewKey}>
              <div className={styles.miniLaptopChassis} style={{ width: scaledLaptopWidth }}>
                <div className={styles.miniLaptopTopBezel}>
                  <span className={styles.miniLaptopCamera} />
                </div>
                <div
                  className={styles.miniLaptopScreenViewport}
                  style={{ width: scaledLaptopWidth, height: scaledLaptopHeight }}
                >
                  <div
                    className={styles.miniLaptopInnerCanvas}
                    style={{
                      width: 1280,
                      height: 720,
                      transform: `scale(${laptopScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <div className={styles.landingScrollWrapper}>
                      <LandingView
                        project={project}
                        assets={assets}
                        isInteractive={true}
                        source="preview"
                        deviceMode="laptop"
                        onRegistrationSuccess={() => {
                          onShowToast?.('Đã lưu đơn đăng ký thử nghiệm! Bạn có thể xem ngay tại WS4.', 'success');
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.miniLaptopBottomBase}>
                  <div className={styles.miniLaptopHinge} />
                </div>
              </div>
              <div className={styles.miniLaptopInfoTag}>
                <LaptopIcon size={12} />
                <span>Màn hình Laptop 1280px thu nhỏ ({Math.round(laptopScale * 100)}%)</span>
              </div>
            </div>
          ) : (
            <div
              key={previewKey}
              className={`${styles.deviceFrame} ${deviceMode === 'phone' ? styles.phoneFrame : styles.laptopFrame}`}
            >
              {/* Notch giả cho điện thoại */}
              {deviceMode === 'phone' && (
                <div className={styles.phoneNotch}>
                  <div className={styles.notchSpeaker} />
                  <div className={styles.notchCamera} />
                </div>
              )}

              {/* Nội dung landing page thực tế (tương tác trực tiếp) */}
              <div className={styles.landingScrollWrapper}>
                <LandingView
                  project={project}
                  assets={assets}
                  isInteractive={true}
                  source="preview"
                  deviceMode={deviceMode}
                  onRegistrationSuccess={() => {
                    onShowToast?.('Đã lưu đơn đăng ký thử nghiệm! Bạn có thể xem ngay tại WS4.', 'success');
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* 3. DƯỚI PREVIEW: TRẠNG THÁI XUẤT BẢN & BỐ CỤC LANDING PAGE     */}
      {/* ============================================================ */}
      <section className={styles.bottomConfigSection} aria-label="Cấu hình bố cục và giao diện">
        <div className={styles.bottomConfigLayout}>
          {/* HÀNG 1: TRẠNG THÁI XUẤT BẢN & TẠO LẠI NỘI DUNG AI (NẰM NGAY DƯỚI PREVIEW) */}
          <div className={`${styles.sidebarCard} ${styles.cardFullWidth} ${styles.publishCardHorizontal}`}>
            <div className={styles.publishCardLeft}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <RocketIcon size={16} />
                  <span>Trạng thái xuất bản</span>
                </h3>
              </div>
              <div className={styles.publishStatusRow}>
                <span className={project.status === PROJECT_STATUS.PUBLISHED ? styles.publishStatusBadgeGreen : styles.publishStatusBadgeGray}>
                  <span className={styles.pulseDot} />
                  {project.status === PROJECT_STATUS.PUBLISHED ? 'Đã xuất bản công khai' : 'Bản nháp (Chưa xuất bản)'}
                </span>
                <p className={styles.publishNoticeClean}>
                  {project.status === PROJECT_STATUS.PUBLISHED
                    ? 'Landing page đang hoạt động công khai và sẵn sàng nhận đơn qua link và mã QR.'
                    : 'Trang đang ở chế độ Bản nháp. Bạn có thể xuất bản trang để chia sẻ link công khai cho mọi người truy cập.'}
                </p>
              </div>
            </div>

            <div className={styles.publishCardRight}>
              {/* Nút Tạo lại nội dung bằng AI đặt ngay trong panel trạng thái xuất bản */}
              <button
                type="button"
                className={styles.btnRegenerateAi}
                onClick={handleGenerateAi}
                disabled={isGenerating || !preflight.isReady}
                aria-busy={isGenerating}
                title="Tự động phân tích lại sự kiện và sinh nội dung mới bằng AI"
              >
                {isGenerating ? (
                  <RefreshCwIcon size={15} className={styles.spinIcon} />
                ) : (
                  <SparklesIcon size={15} />
                )}
                <span>
                  {isGenerating
                    ? 'Đang tạo AI...'
                    : project.ai?.headline
                      ? 'Tạo lại nội dung bằng AI'
                      : 'Tạo nội dung bằng AI'}
                </span>
              </button>

              <button
                type="button"
                className={project.status === PROJECT_STATUS.PUBLISHED ? styles.btnUnpublish : styles.btnPublish}
                onClick={handleTogglePublish}
              >
                {project.status === PROJECT_STATUS.PUBLISHED ? 'Gỡ xuất bản (về Draft)' : 'Xuất bản trang (Published)'}
              </button>

              {project.status === PROJECT_STATUS.PUBLISHED && (
                <button
                  type="button"
                  className={styles.btnOpenShare}
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <ExternalLinkIcon size={14} />
                  <span>Xem link &amp; Chia sẻ</span>
                </button>
              )}
            </div>
          </div>

          {/* HÀNG 2: MẪU BỐ CỤC (GỌN GÀNG, 3 BIẾN THỂ NGẮN GỌN) */}
          <div className={`${styles.sidebarCard} ${styles.cardFullWidth}`} style={{ padding: '16px 20px' }}>
            <div className={styles.cardHeader} style={{ marginBottom: 10 }}>
              <div className={styles.cardHeaderTitleWrap}>
                <span className={styles.autoAiBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <SparklesIcon size={12} /> Tự động tối ưu
                </span>
                <h3 className={styles.cardTitle}>Mẫu bố cục</h3>
              </div>
              <span className={styles.moduleCountBadge}>
                {(project.moduleLayout || createPresetModuleTree(activePresetId)).length} modules
              </span>
            </div>

            {/* 3 Biến thể ngắn gọn theo yêu cầu */}
            <div className={styles.compactPresetPillRow}>
              {[
                { id: 'workshop', label: 'Hội thảo', icon: '🎓' },
                { id: 'techtalk', label: 'Tech Talk', icon: '⚡' },
                { id: 'gala', label: 'Gala VIP', icon: '👑' },
              ].map((opt) => {
                const isSelected = activePresetId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${styles.btnCompactPresetPill} ${isSelected ? styles.btnCompactPresetPillActive : ''}`}
                    onClick={() => handleSelectPreset(opt.id)}
                  >
                    <span className={styles.compactPresetPillIcon}>{opt.icon}</span>
                    <span className={styles.compactPresetPillLabel}>{opt.label}</span>
                    {isSelected && <span className={styles.compactPresetActiveDot}>✓</span>}
                  </button>
                );
              })}
            </div>

            <div className={styles.autoPresetActions} style={{ marginTop: 8 }}>
              <button
                type="button"
                className={styles.btnReanalyze}
                onClick={handleAutoReanalyzeLayout}
                title="Tự động phân tích lại thông tin chủ đề để cập nhật bố cục và màu sắc phù hợp nhất"
              >
                <RefreshCwIcon size={14} />
                <span>Cập nhật theo chủ đề</span>
              </button>
            </div>
          </div>

          {/* HÀNG 3: 2 CỘT Ở DƯỚI (NỘI DUNG AI + MÀU SẮC & GIAO DIỆN) */}
          <div className={styles.twoColRow}>
            {/* CỘT 1: NỘI DUNG AI */}
            <div className={styles.sidebarCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <PencilIcon size={16} />
                  <span>Nội dung AI</span>
                </h3>
              </div>

              {!project.ai?.headline && (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SparklesIcon size={16} style={{ color: 'var(--theme-primary, #e11d48)', flexShrink: 0 }} />
                  <span>Nội dung đang tạo tự động từ thông tin sự kiện. Bạn có thể nhấn <strong>&ldquo;Tạo nội dung bằng AI&rdquo;</strong> ở trên hoặc chỉnh sửa trực tiếp bên dưới rồi bấm <strong>&ldquo;Áp dụng vào Preview&rdquo;</strong>.</span>
                </div>
              )}

              <div className={styles.editGroup}>
                <label className={styles.editLabel}>Tiêu đề</label>
                <input
                  type="text"
                  className={styles.editInput}
                  value={editableAi.headline}
                  onChange={(e) => {
                    setEditableAi((p) => ({ ...p, headline: e.target.value }));
                    setHasUnappliedEdits(true);
                  }}
                />
              </div>

              <div className={styles.editGroup}>
                <label className={styles.editLabel}>Đoạn mô tả ngắn</label>
                <textarea
                  rows={3}
                  className={styles.editTextarea}
                  value={editableAi.description}
                  onChange={(e) => {
                    setEditableAi((p) => ({ ...p, description: e.target.value }));
                    setHasUnappliedEdits(true);
                  }}
                />
              </div>

              <div className={styles.editGroup}>
                <label className={styles.editLabel}>3 Lợi ích cốt lõi</label>
                {editableAi.benefits.map((b, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className={`${styles.editInput} ${styles.benefitInput}`}
                    placeholder={`Lợi ích ${idx + 1}`}
                    value={b}
                    onChange={(e) => {
                      const copy = [...editableAi.benefits];
                      copy[idx] = e.target.value;
                      setEditableAi((p) => ({ ...p, benefits: copy }));
                      setHasUnappliedEdits(true);
                    }}
                  />
                ))}
              </div>

              {hasUnappliedEdits && (
                <button
                  type="button"
                  className={styles.btnApplyEdits}
                  onClick={handleApplyEdits}
                >
                  <CheckIcon size={16} />
                  <span>Áp dụng vào Preview</span>
                </button>
              )}
            </div>

            {/* CỘT 2: MÀU SẮC & GIAO DIỆN (ĐÃ XÓA CHECKBOX XEN KẼ MÀU NỀN THEO YÊU CẦU) */}
            <div className={styles.sidebarCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <PaletteIcon size={16} />
                  <span>Màu sắc &amp; Giao diện</span>
                </h3>
              </div>
              <p className={styles.presetHelpText}>
                Chọn bảng màu chủ đạo phù hợp nhận diện thương hiệu sự kiện:
              </p>

              {/* Bảng màu cơ bản */}
              <div className={styles.themePaletteGrid}>
                {COLOR_THEMES.map((th) => {
                  const isSelected = (project.colorTheme || 'purple') === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      className={`${styles.themeColorBtn} ${isSelected ? styles.themeColorBtnActive : ''}`}
                      onClick={() => handleSelectColorTheme(th.id)}
                      title={`${th.name}: ${th.desc}`}
                    >
                      <span
                        className={styles.themeSwatch}
                        style={{ backgroundColor: th.hex }}
                      />
                      <span className={styles.themeName}>{th.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dialog Chia sẻ liên kết */}
      {isShareModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalBox}>
            <h3 className={styles.modalTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <SparklesIcon size={20} />
              <span>Landing page đã xuất bản!</span>
            </h3>
            <p className={styles.modalDesc}>
              Bất kỳ ai có liên kết này đều có thể truy cập landing page và gửi đơn đăng ký sự kiện của bạn.
            </p>

            <div className={styles.linkShareBox}>
              <input
                type="text"
                readOnly
                value={publicUrl}
                className={styles.linkInput}
              />
              <button
                type="button"
                className={styles.btnCopy}
                onClick={handleCopyLink}
              >
                {copiedLink ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className={styles.modalFooter}>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.btnOpenNewTab}
              >
                <ExternalLinkIcon size={16} />
                <span>Mở trong tab mới</span>
              </a>
              <button
                type="button"
                className={styles.btnCloseModal}
                onClick={() => setIsShareModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận Gỡ xuất bản */}
      <ConfirmDialog
        isOpen={isUnpublishConfirmOpen}
        title="Gỡ xuất bản sự kiện?"
        message="Trang landing sẽ chuyển về trạng thái Bản nháp (Draft) và ngừng nhận đơn mới từ liên kết công khai. Các đơn đã đăng ký trước đó vẫn được bảo toàn nguyên vẹn."
        confirmLabel="Gỡ xuất bản"
        cancelLabel="Hủy"
        onConfirm={handleConfirmUnpublish}
        onCancel={() => setIsUnpublishConfirmOpen(false)}
      />

      {/* Dialog Xác nhận Tạo trang mới (Tính năng #5 - Đề 08) */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Tạo Landing Page mới?"
        message="Hành động này sẽ khởi tạo một sự kiện mới và đưa bạn về màn hình nhập thông tin (Golden Path). Dự án hiện tại của bạn vẫn được lưu trong danh sách dự án. Bạn có chắc chắn muốn tạo mới?"
        confirmLabel="Tạo trang mới"
        cancelLabel="Hủy"
        onConfirm={handleConfirmResetPage}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}

