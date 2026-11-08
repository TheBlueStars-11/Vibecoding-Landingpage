import React, { useState, useEffect } from 'react';
import styles from './ModuleRenderer.module.css';
import { calculateCountdown } from '../../domain/time.js';
import { STANDALONE_DEV_MOCK_DATA, getSafeVariant } from '../../domain/moduleSchema.js';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  SparklesIcon,
  TrashIcon,
  MoveUpIcon,
  MoveDownIcon,
  CopyIcon,
  UsersIcon,
  InfoIcon,
  MicIcon,
  ZapIcon,
  RocketIcon,
  LightbulbIcon,
  GraduationCapIcon,
  FlameIcon,
  LockIcon,
  LaptopIcon,
  GlobeIcon,
  TargetIcon,
  TrophyIcon,
  GiftIcon,
  WifiIcon,
  QrCodeIcon,
  DownloadIcon,
} from '../ui/Icons.jsx';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #e11d48, #fb7185)',
  'linear-gradient(135deg, #be123c, #f43f5e)',
  'linear-gradient(135deg, #2563eb, #10b981)',
  'linear-gradient(135deg, #d97706, #ef4444)',
  'linear-gradient(135deg, #059669, #14b8a6)',
];

const getInitials = (name) => {
  if (!name) return 'VC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (seed = '', idx = 0) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash + idx) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[colorIndex];
};

/**
 * Tìm vị trí ngắt dòng tự nhiên và phân tách phần nhấn mạnh font chữ hợp lý
 */
function findSmartHeadlineSplit(text) {
  const trimmed = text.trim();

  // 1. Phân tách theo dấu hai chấm ':' (thường là ranh giới Tên sự kiện : Chủ đề/Slogan)
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex > 4 && colonIndex < trimmed.length - 3) {
    return {
      firstPart: trimmed.slice(0, colonIndex + 1).trim(),
      secondPart: trimmed.slice(colonIndex + 1).trim(),
    };
  }

  // 2. Phân tách theo gạch ngang dài '—' hoặc ' - '
  const dashMatch = trimmed.match(/^(.*?)(?:\s+[—–-]\s+)(.+)$/);
  if (dashMatch && dashMatch[1].length >= 4 && dashMatch[2].length >= 3) {
    return {
      firstPart: dashMatch[1].trim(),
      secondPart: dashMatch[2].trim(),
    };
  }

  // 3. Phân tách theo thanh đứng '|'
  const pipeIndex = trimmed.indexOf('|');
  if (pipeIndex > 4 && pipeIndex < trimmed.length - 3) {
    return {
      firstPart: trimmed.slice(0, pipeIndex).trim(),
      secondPart: trimmed.slice(pipeIndex + 1).trim(),
    };
  }

  // 4. Nếu không có dấu phân cách, tách ở các từ khóa punchline kết thúc (2-4 từ cuối)
  const words = trimmed.split(/\s+/);
  if (words.length >= 6) {
    const punchlineCount = Math.min(4, Math.max(2, Math.round(words.length * 0.35)));
    const splitIndex = words.length - punchlineCount;
    return {
      firstPart: words.slice(0, splitIndex).join(' '),
      secondPart: words.slice(splitIndex).join(' '),
    };
  }

  if (words.length >= 4) {
    return {
      firstPart: words.slice(0, -2).join(' '),
      secondPart: words.slice(-2).join(' '),
    };
  }

  return null;
}

/**
 * Hiển thị tiêu đề theo phong cách Resolvo (Sans hình học kết hợp Serif Italic nghệ thuật)
 * Có hỗ trợ tùy chọn addNewline để tự động xuống dòng tại khoảng cách ngữ nghĩa hợp lý
 * trước phần chữ nhấn mạnh bằng font serif italic.
 */
function renderEditorialHeadline(text, { addNewline = false } = {}) {
  if (!text) return null;
  if (typeof text !== 'string') return text;

  if (text.includes('*')) {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const cleanText = part.slice(1, -1);
        return (
          <React.Fragment key={i}>
            {addNewline && i > 0 && <br className={styles.headlineBr} />}
            <em className={styles.editorialItalic}>
              {cleanText}
            </em>
          </React.Fragment>
        );
      }
      return addNewline && i < parts.length - 1 ? part.trimEnd() : part;
    });
  }

  const smartSplit = findSmartHeadlineSplit(text);
  if (smartSplit) {
    return (
      <>
        {smartSplit.firstPart}
        {addNewline ? <br className={styles.headlineBr} /> : ' '}
        <em className={styles.editorialItalic}>{smartSplit.secondPart}</em>
      </>
    );
  }

  return text;
}

const SCENE_MAP = {
  announcement_bar: '01 · MỞ ĐẦU',
  nav: '01 · MỞ ĐẦU',
  hero: '01 · MỞ ĐẦU',
  offer_banner: '01 · MỞ ĐẦU',
  countdown: '02 · NHỊP SỰ KIỆN',
  stats: '02 · NHỊP SỰ KIỆN',
  benefits: '03 · GIÁ TRỊ',
  audience: '03 · GIÁ TRỊ',
  bento: '03 · GIÁ TRỊ',
  speakers: '04 · DIỄN GIẢ',
  agenda: '05 · CHƯƠNG TRÌNH',
  venue: '05 · CHƯƠNG TRÌNH',
  form: '06 · ĐĂNG KÝ',
  faq: '06 · ĐĂNG KÝ',
  final_cta: '06 · ĐĂNG KÝ',
  sponsors: 'CREDITS · ĐỐI TÁC',
  organizer: 'CREDITS · BAN TỔ CHỨC',
  footer: 'CREDITS · BẢN QUYỀN',
  divider: '',
};

export function ModuleRenderer({
  module,
  index = 0,
  themeColor = 'purple',
  isAlternating = true,
  eventData = {},
  aiData = {},
  formFields = [],
  assets = [],
  isSelected = false,
  isDevMode = false,
  regCount = 128,
  externalCountdown = null,
  formProps = null,
  review = null,
  onSetReviewStatus = null,
  onOpenReviewComment = null,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}) {
  const [faqExpanded, setFaqExpanded] = useState({});
  const [agendaFilter, setAgendaFilter] = useState('all');
  const [agendaExpanded, setAgendaExpanded] = useState(false);
  const [announcementClosed, setAnnouncementClosed] = useState(false);

  // Countdown timer: dynamic ticking
  const targetIso = eventData.eventDate && eventData.eventTime
    ? `${eventData.eventDate}T${eventData.eventTime}:00+07:00`
    : null;

  const [localCountdown, setLocalCountdown] = useState(() =>
    targetIso ? calculateCountdown(targetIso) : { isPast: false, d: 0, h: 0, m: 0, s: 0 }
  );

  useEffect(() => {
    if (!targetIso || externalCountdown) return;
    const interval = setInterval(() => {
      setLocalCountdown(calculateCountdown(targetIso));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetIso, externalCountdown]);

  if (module.hidden) return null;

  // Xử lý dữ liệu nguồn (Auto vs Custom)
  const isCustom = module.dataSource === 'custom';
  const custom = module.customContent || {};
  const mock = STANDALONE_DEV_MOCK_DATA;

  // 1. Phân loại ảnh & Gán ảnh AI (AI Image Assignment)
  const getAssetSrc = (a) => a?.dataUrl || a?.url || '';

  const heroAsset = (custom.heroImageId && assets.find((a) => a.id === custom.heroImageId))
    || (aiData?.imageAssignments?.heroImageId && assets.find((a) => a.id === aiData.imageAssignments.heroImageId))
    || assets.find((a) => a.role === 'hero')
    || assets.find((a) => a.role === 'other')
    || assets[0];

  const speakerAssets = assets.filter((a) => a.role === 'speaker');

  const getSpeakerAsset = (idx) => {
    const assignedId = aiData?.imageAssignments?.speakerImageIds?.[idx];
    if (assignedId) {
      const found = assets.find((a) => a.id === assignedId);
      if (found) return found;
    }
    return speakerAssets[idx] || null;
  };

  const venueAsset = (custom.venueImageId && assets.find((a) => a.id === custom.venueImageId))
    || (aiData?.imageAssignments?.venueImageId && assets.find((a) => a.id === aiData.imageAssignments.venueImageId))
    || assets.find((a) => a.role === 'venue')
    || null;

  const giftAsset = (custom.giftImageId && assets.find((a) => a.id === custom.giftImageId))
    || (aiData?.imageAssignments?.giftImageId && assets.find((a) => a.id === aiData.imageAssignments.giftImageId))
    || assets.find((a) => a.role === 'gift')
    || assets.find((a) => a.role === 'other')
    || null;

  // 2. Nội dung tổng hợp
  const headline = isCustom && custom.headline !== undefined ? custom.headline : (aiData.headline || eventData.eventName || 'Sự kiện 2026');
  const description = isCustom && custom.description !== undefined ? custom.description : (aiData.description || 'Tham gia cùng chúng tôi để kết nối và tiếp cận những nội dung giá trị nhất.');

  // Lấy danh sách benefits thực tế (ưu tiên custom -> aiData -> thông tin sự kiện -> mặc định)
  const candidateBenefits = (isCustom && Array.isArray(custom.benefits))
    ? custom.benefits
    : (Array.isArray(aiData.benefits) ? aiData.benefits : []);

  // Kiểm tra xem candidateBenefits có thực sự chứa nội dung (không phải toàn chuỗi rỗng ['','',''])
  const hasValidCandidates = candidateBenefits.some((b) => typeof b === 'string' && b.trim().length > 0);

  // Tạo 3 lợi ích mặc định thông minh dựa trên thông tin sự kiện đã điền
  const smartDefaultBenefits = [
    eventData.earlyBirdOffer
      ? `Ưu đãi đăng ký sớm: ${eventData.earlyBirdOffer}`
      : 'Tiếp cận tri thức và kinh nghiệm thực chiến từ chuyên gia.',
    Array.isArray(eventData.speakers) && eventData.speakers.length > 0
      ? `Giao lưu và kết nối trực tiếp cùng ${eventData.speakers.map((s) => s.name).filter(Boolean).slice(0, 2).join(', ')}.`
      : 'Mở rộng mạng lưới quan hệ chất lượng cao trong ngành.',
    'Nhận trọn bộ tài liệu chuyên sâu và chứng nhận tham gia.',
  ];

  const benefits = hasValidCandidates
    ? candidateBenefits.map((b, idx) => (b && typeof b === 'string' && b.trim() ? b.trim() : smartDefaultBenefits[idx] || ''))
    : smartDefaultBenefits;

  const countdown = externalCountdown || localCountdown;

  const variant = getSafeVariant(module.type, module.variant);
  const paddingClass = styles[`padding_${module.styles?.padding || 'normal'}`] || '';
  
  // Tính toán màu nền xen kẽ và màu chủ đạo (Theme)
  const explicitBg = module.styles?.background;
  let bgClass = '';
  if (explicitBg && explicitBg !== 'default') {
    bgClass = styles[`bg_${explicitBg}`] || '';
  } else if (isAlternating) {
    if (module.type === 'nav' || module.type === 'announcement_bar') {
      bgClass = styles.bg_default;
    } else {
      bgClass = index % 2 === 1 ? styles.bg_theme_tint : styles.bg_default;
    }
  } else {
    bgClass = styles.bg_default;
  }

  const themeClass = styles[`theme_${themeColor}`] || styles.theme_purple;

  const scrollToForm = () => {
    const el = document.getElementById('registration-section')
      || document.getElementById('mod-form')
      || document.querySelector('[id*="mod_form"]')
      || document.querySelector('[data-module-form="true"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTarget = (targetType) => {
    if (targetType === 'form') {
      scrollToForm();
      return;
    }
    const el = document.querySelector(`[data-module-type="${targetType}"]`)
      || document.querySelector(`[id*="${targetType}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // MapSlot renderer for venue modules
  const renderMapSlot = (address = '') => (
    <div className={styles.mapSlotWrap} data-slot="map" role="img" aria-label={`Vị trí tổ chức: ${address || 'Địa điểm sự kiện'}`}>
      <div className={styles.mapSlotGrid}>
        <svg className={styles.mapSlotGridSvg} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id={`mapGridPattern-${module.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(225, 29, 72, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#mapGridPattern-${module.id})`} />
        </svg>
        <div className={styles.mapSlotPinCircle}>
          <MapPinIcon size={24} className={styles.mapSlotPinIcon} />
        </div>
      </div>
      <div className={styles.mapSlotFooter}>
        <span className={styles.mapSlotNotice}>
          {isDevMode ? 'Bản đồ vị trí sự kiện (tích hợp Google Maps)' : (address || 'Bản đồ vị trí sự kiện')}
        </span>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(address || 'Hà Nội')}`}
          target="_blank"
          rel="noreferrer"
          className={styles.mapSlotOpenBtn}
          onClick={(e) => isDevMode && e.preventDefault()}
        >
          Mở Maps ↗
        </a>
      </div>
    </div>
  );

  // Bọc trong khung tương tác Dev Mode
  const renderContainer = (content) => {
    const isFormModule = module.type === 'form';
    const isNavModule = module.type === 'nav';
    return (
      <section
        id={isFormModule ? 'registration-section' : `mod-${module.id}`}
        data-module-type={module.type}
        data-module-form={isFormModule ? 'true' : undefined}
        className={`${styles.moduleWrapper} ${isNavModule ? styles.navSectionSticky : ''} ${themeClass} ${bgClass} ${isSelected && isDevMode ? styles.selectedWrapper : ''}`}
        style={{ scrollMarginTop: '80px' }}
        onClick={(e) => {
          if (isDevMode) {
            e.stopPropagation();
            onSelect?.(module.id);
          }
        }}
      >
        {isFormModule && <div id="mod-form" style={{ position: 'relative', top: -20, height: 0 }} />}
        {isDevMode && (
          <div className={styles.devModuleHeader}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div className={styles.devPill}>
                {SCENE_MAP[module.type] && (
                  <span className={styles.sceneBadge} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px' }}>
                    {SCENE_MAP[module.type]}
                  </span>
                )}
                <span className={styles.devModuleName}>{module.name}</span>
                <span className={styles.devVariantName}>{module.variant}</span>
                {review?.status === 'accepted' && (
                  <span className={styles.devStatusBadgeAccepted}>✓ Chấp nhận</span>
                )}
                {review?.status === 'rejected' && (
                  <span className={styles.devStatusBadgeRejected}>✗ Loại bỏ</span>
                )}
              </div>

              {/* Phê duyệt & Đánh giá nhanh */}
              <div className={styles.devReviewActions}>
                <button
                  type="button"
                  className={`${styles.devReviewBtn} ${review?.status === 'accepted' ? styles.devReviewBtnAcceptedActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetReviewStatus?.(review?.status === 'accepted' ? 'pending' : 'accepted');
                  }}
                  title={review?.status === 'accepted' ? 'Hủy chấp nhận' : 'Tích để chấp nhận module này'}
                >
                  ✓ Chấp nhận
                </button>
                <button
                  type="button"
                  className={`${styles.devReviewBtn} ${styles.devReviewBtnReject} ${review?.status === 'rejected' ? styles.devReviewBtnRejectedActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetReviewStatus?.(review?.status === 'rejected' ? 'pending' : 'rejected');
                  }}
                  title={review?.status === 'rejected' ? 'Hủy loại bỏ' : 'Tích để loại bỏ module này'}
                >
                  ✗ Loại bỏ
                </button>
                <button
                  type="button"
                  className={`${styles.devReviewBtn} ${styles.devReviewBtnComment} ${review?.comment ? styles.devReviewBtnHasComment : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReviewComment?.();
                  }}
                  title={review?.comment ? `Nhận xét: "${review.comment}"` : 'Thêm nhận xét / góp ý'}
                >
                  💬 {review?.comment ? 'Xem nhận xét' : 'Nhận xét'}
                </button>
              </div>
            </div>

            {isSelected && (
              <div className={styles.devActionsGroup}>
                <button
                  type="button"
                  className={styles.devBtn}
                  onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
                  title="Di chuyển lên"
                >
                  <MoveUpIcon size={12} />
                </button>
                <button
                  type="button"
                  className={styles.devBtn}
                  onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
                  title="Di chuyển xuống"
                >
                  <MoveDownIcon size={12} />
                </button>
                <button
                  type="button"
                  className={styles.devBtn}
                  onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
                  title="Nhân bản"
                >
                  <CopyIcon size={12} />
                </button>
                {!module.isMandatory && (
                  <button
                    type="button"
                    className={`${styles.devBtn} ${styles.devBtnDanger}`}
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    title="Xóa module"
                  >
                    <TrashIcon size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div className={`${isNavModule ? styles.navModuleContainer : styles.moduleContainer} ${isNavModule ? '' : paddingClass}`}>{content}</div>
      </section>
    );
  };

  // ================================================================
  // 1. HERO MODULE (Expanded: cinema-letterbox, poster-fullbleed, center-text, benefits-band, stack-cards, split-card, image-left, image-right, center)
  // ================================================================
  if (module.type === 'hero') {
    const isCenter = variant === 'center';
    const isCenterText = variant === 'center-text';
    const isBenefitsBand = variant === 'benefits-band';
    const isStackCards = variant === 'stack-cards';
    const isSplitCard = variant === 'split-card';
    const isCinemaLetterbox = variant === 'cinema-letterbox';

    // Trang trí hình học trừu tượng (abstract SVG circles) cho Hero - luôn ở layer nền
    const renderHeroAbstractDecor = () => (
      <div className={styles.heroAbstractDecorWrap} aria-hidden="true">
        <svg
          className={styles.heroAbstractDecorTop}
          width="280"
          height="280"
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="140" cy="140" r="130" stroke="var(--theme-primary, #e11d48)" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.16" />
          <circle cx="140" cy="140" r="95" stroke="var(--theme-primary, #e11d48)" strokeWidth="1" opacity="0.12" />
          <circle cx="140" cy="140" r="60" stroke="var(--theme-primary, #e11d48)" strokeWidth="1.2" opacity="0.16" />
          <circle cx="235" cy="140" r="3.5" fill="var(--theme-primary, #e11d48)" opacity="0.35" />
          <circle cx="100" cy="50" r="2.5" fill="var(--theme-primary, #e11d48)" opacity="0.3" />
        </svg>
        <svg
          className={styles.heroAbstractDecorBottom}
          width="220"
          height="220"
          viewBox="0 0 220 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="110" cy="110" r="100" stroke="var(--theme-primary, #e11d48)" strokeWidth="1" opacity="0.14" />
          <circle cx="110" cy="110" r="70" stroke="var(--theme-primary, #e11d48)" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.15" />
          <circle cx="110" cy="110" r="40" stroke="var(--theme-primary, #e11d48)" strokeWidth="1" opacity="0.12" />
          <circle cx="160" cy="75" r="3" fill="var(--theme-primary, #e11d48)" opacity="0.3" />
        </svg>
      </div>
    );

    // Biến thể: cinema-letterbox (21:9 letterbox frame + credits điện ảnh)
    if (isCinemaLetterbox) {
      return renderContainer(
        <div className={styles.heroCinemaLetterboxWrap}>
          {renderHeroAbstractDecor()}
          <div className={styles.heroCinemaLetterboxGlow} aria-hidden="true" />
          <div className={styles.heroCinemaBarTop}>
            <span>✦ ELS CINEMA PRESENTATION ✦</span>
            <span>{eventData.eventDate || '2026'} · LIVE STAGE</span>
          </div>
          <div className={styles.heroCinemaMainContent}>
            <div>
              <h1 className={styles.heroCinemaHeadline}>{headline}</h1>
              <p className={styles.heroCinemaDesc}>{description}</p>
              <div className={styles.heroCinemaActions}>
                <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
                  Đăng ký tham gia ngay ↗
                </button>
              </div>
            </div>
            <div className={styles.heroCinemaPosterBadge}>
              <div className={styles.heroCinemaPosterDate}>
                {eventData.eventDate ? eventData.eventDate.split('-').reverse().join('/') : '20/11/2026'}
              </div>
              <div className={styles.heroCinemaPosterLocation}>
                <MapPinIcon size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                {eventData.venue || 'Innovation Hub NIC'}
              </div>
            </div>
          </div>
          <div className={styles.heroCinemaCreditsRow}>
            <div className={styles.heroCinemaCreditItem}>
              <CalendarIcon size={14} />
              <span>{eventData.eventDate || '20/11/2026'} · {eventData.eventTime || '08:30'}</span>
            </div>
            <div className={styles.heroCinemaCreditItem}>
              <MapPinIcon size={14} />
              <span>{eventData.venue || 'Hà Nội, Việt Nam'}</span>
            </div>
            <div className={styles.heroCinemaCreditItem}>
              <UsersIcon size={14} />
              <span>Khán phòng trực tiếp + Livestream</span>
            </div>
          </div>
          <div className={styles.heroCinemaBarBottom}>
            <span>DIRECTED BY {eventData.organizerName || 'ORGANIZING TEAM'}</span>
            <span>ALL RIGHTS RESERVED</span>
          </div>
        </div>
      );
    }

    // Biến thể: center-text (Không ảnh, thuần chữ trang nhã)
    if (isCenterText) {
      return renderContainer(
        <div className={styles.heroCenterTextWrap}>
          {renderHeroAbstractDecor()}
          <h1 className={styles.heroTitleCentered}>{renderEditorialHeadline(headline, { addNewline: true })}</h1>
          <p className={styles.heroDescCentered}>{description}</p>
          <div className={styles.benefitsRecapChipsWrap} style={{ margin: '20px auto' }}>
            {benefits.slice(0, 3).map((b, idx) => (
              <span key={idx} className={styles.recapChipItem}>
                <CheckIcon size={12} style={{ color: '#059669' }} /> {b}
              </span>
            ))}
          </div>
          <div className={styles.heroMetaBarCenter}>
            <span className={styles.metaPill}><CalendarIcon size={14} /> {eventData.eventDate || '20/11/2026'}</span>
            <span className={styles.metaPill}><ClockIcon size={14} /> {eventData.eventTime || '08:30'}</span>
            <span className={styles.metaPill}><MapPinIcon size={14} /> {eventData.venue || 'Innovation Hub NIC'}</span>
          </div>
          <div className={styles.heroCtaRowCenter}>
            <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
              Đăng ký tham gia ngay
            </button>
          </div>
        </div>
      );
    }

    // Biến thể: benefits-band (Dải 3 lợi ích liền mạch)
    if (isBenefitsBand) {
      return renderContainer(
        <div className={styles.heroBenefitsBandWrap}>
          {renderHeroAbstractDecor()}
          <div className={styles.heroHeaderCenter}>
            <h1 className={styles.heroTitleCentered}>{renderEditorialHeadline(headline, { addNewline: true })}</h1>
            <p className={styles.heroDescCentered}>{description}</p>
            <div className={styles.heroCtaRowCenter} style={{ marginTop: 20 }}>
              <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
                Đăng ký nhận vé mời
              </button>
            </div>
          </div>
          <div className={styles.heroBenefitsBandBar}>
            {benefits.slice(0, 3).map((b, idx) => (
              <div key={idx} className={styles.heroBandCol}>
                <span className={styles.heroBandNum}>{idx + 1}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Biến thể: stack-cards (3 thẻ lợi ích xếp đè)
    if (isStackCards) {
      return renderContainer(
        <div className={styles.heroStackCardsWrap}>
          {renderHeroAbstractDecor()}
          <h1 className={styles.heroTitleCentered}>{renderEditorialHeadline(headline, { addNewline: true })}</h1>
          <p className={styles.heroDescCentered}>{description}</p>
          <div className={styles.heroCtaRowCenter} style={{ margin: '16px auto 0 auto' }}>
            <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
              Tham gia ngay hôm nay
            </button>
          </div>
          <div className={styles.heroStackCardsGrid}>
            {benefits.slice(0, 3).map((b, idx) => (
              <div key={idx} className={styles.heroStackCardItem}>
                <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', marginBottom: 8, color: 'var(--theme-primary, #e11d48)' }}>
                  {idx === 0 ? <RocketIcon size={24} /> : idx === 1 ? <LightbulbIcon size={24} /> : <GraduationCapIcon size={24} />}
                </span>
                <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a', marginBottom: 4 }}>
                  Mục tiêu #{idx + 1}
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Biến thể: split-card (Nội dung trái, Thẻ thông tin hậu cần kính mờ bên phải)
    if (isSplitCard) {
      return renderContainer(
        <div className={styles.heroSplitCardWrap}>
          {renderHeroAbstractDecor()}
          <div className={styles.heroSplitLeft}>
            <h1 className={styles.heroTitle} style={{ textAlign: 'left' }}>{renderEditorialHeadline(headline, { addNewline: true })}</h1>
            <p className={styles.heroDesc} style={{ textAlign: 'left' }}>{description}</p>
            <ul className={styles.heroBullets} style={{ paddingLeft: 0, listStyle: 'none' }}>
              {benefits.slice(0, 3).map((b, idx) => (
                <li key={idx} className={styles.bulletItem}>
                  <span className={styles.checkIcon}><CheckIcon size={12} /></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 20 }}>
              <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
                Giữ chỗ ngay
              </button>
            </div>
          </div>
          <div className={styles.heroSplitCardGlass}>
            <div className={styles.heroSplitMetaRow}>
              <div className={styles.heroSplitMetaIcon}><CalendarIcon size={18} /></div>
              <div>
                <span className={styles.heroSplitMetaLabel}>Ngày tổ chức</span>
                <span className={styles.heroSplitMetaVal}>{eventData.eventDate || '20/11/2026'}</span>
              </div>
            </div>
            <div className={styles.heroSplitMetaRow}>
              <div className={styles.heroSplitMetaIcon}><ClockIcon size={18} /></div>
              <div>
                <span className={styles.heroSplitMetaLabel}>Thời gian</span>
                <span className={styles.heroSplitMetaVal}>{eventData.eventTime || '08:30'} - 11:30</span>
              </div>
            </div>
            <div className={styles.heroSplitMetaRow}>
              <div className={styles.heroSplitMetaIcon}><MapPinIcon size={18} /></div>
              <div>
                <span className={styles.heroSplitMetaLabel}>Địa điểm</span>
                <span className={styles.heroSplitMetaVal}>{eventData.venue || 'Innovation Hub NIC'}</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Đếm ngược khai mạc
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {String(countdown.d).padStart(2, '0')}d : {String(countdown.h).padStart(2, '0')}h : {String(countdown.m).padStart(2, '0')}m : {String(countdown.s).padStart(2, '0')}s
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Biến thể mặc định: image-right hoặc center
    return renderContainer(
      <div className={`${styles.heroSplitWrap} ${isCenter ? styles.heroCenterWrap : ''}`}>
        {renderHeroAbstractDecor()}
        <div className={styles.heroHeaderCenter}>
          <h1 className={styles.heroTitleCentered}>{renderEditorialHeadline(headline, { addNewline: true })}</h1>
        </div>

        {isCenter ? (
          <div className={styles.heroCenterBody}>
            <p className={styles.heroDescCentered}>{description}</p>
            {heroAsset && (
              <div className={styles.heroCenterVisual}>
                <img src={getAssetSrc(heroAsset)} alt={heroAsset.caption || 'Hero'} className={styles.heroImg} />
                {heroAsset.caption && <span className={styles.captionTag} title={heroAsset.caption}>{heroAsset.caption}</span>}
              </div>
            )}
            <ul className={styles.heroBulletsCentered}>
              {benefits.slice(0, 3).map((b, idx) => (
                <li key={idx} className={styles.bulletItem}>
                  <span className={styles.checkIcon}><CheckIcon size={12} /></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className={styles.heroMetaBarCenter}>
              <span className={styles.metaPill}><CalendarIcon size={14} /> {eventData.eventDate || 'Ngày công bố sớm'}</span>
              <span className={styles.metaPill}><ClockIcon size={14} /> {eventData.eventTime || '09:00'} (UTC+7)</span>
              <span className={styles.metaPill}><MapPinIcon size={14} /> {eventData.venue || 'Địa điểm công bố sớm'}</span>
            </div>
            <div className={styles.heroCtaRowCenter}>
              <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
                Đăng ký tham gia ngay
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.heroBodySplit}>
            <div className={styles.heroLeftContent}>
              <p className={styles.heroDesc}>{description}</p>
              <ul className={styles.heroBullets}>
                {benefits.slice(0, 3).map((b, idx) => (
                  <li key={idx} className={styles.bulletItem}>
                    <span className={styles.checkIcon}><CheckIcon size={12} /></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.heroMetaBar}>
                <span className={styles.metaPill}><CalendarIcon size={14} /> {eventData.eventDate || 'Ngày công bố sớm'}</span>
                <span className={styles.metaPill}><ClockIcon size={14} /> {eventData.eventTime || '09:00'} (UTC+7)</span>
                <span className={styles.metaPill}><MapPinIcon size={14} /> {eventData.venue || 'Địa điểm công bố sớm'}</span>
              </div>
              <div className={styles.heroCtaRow}>
                <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
                  Đăng ký tham gia ngay
                </button>
              </div>
            </div>
            {heroAsset && (
              <div className={styles.heroRightVisual}>
                <img src={getAssetSrc(heroAsset)} alt={heroAsset.caption || 'Hero'} className={styles.heroImg} />
                {heroAsset.caption && <span className={styles.captionTag} title={heroAsset.caption}>{heroAsset.caption}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ================================================================
  // 2. COUNTDOWN MODULE (Expanded: cinema-wide, date-leaf, inline-sentence, progress-bar, compact-pill, boxes, circles)
  // ================================================================
  if (module.type === 'countdown') {
    const isCircles = variant === 'circles';
    const isDateLeaf = variant === 'date-leaf';
    const isInlineSentence = variant === 'inline-sentence';
    const isProgressBar = variant === 'progress-bar';
    const isCompactPill = variant === 'compact-pill';
    const isCinemaWide = variant === 'cinema-wide';

    const attendeesCount = custom.regCount ?? regCount ?? 0;
    const hasCapacity = (custom.maxCapacity != null && Number(custom.maxCapacity) > 0) || (custom.capacity != null && Number(custom.capacity) > 0);
    const maxCapacity = Number(custom.maxCapacity || custom.capacity || 0);
    const capacityPercent = hasCapacity ? Math.min(100, Math.round((attendeesCount / maxCapacity) * 100)) : 0;
    const seatsRemaining = hasCapacity ? Math.max(0, maxCapacity - attendeesCount) : 0;

    const renderRegCol = () => (
      <div className={styles.cdCinematicRegCol}>
        <div className={styles.cdCinematicLiveBadge}>
          <span className={styles.cdPulseDot} />
          <span className={styles.cdLiveText}>ĐANG MỞ ĐĂNG KÝ · LIVE TICKER</span>
        </div>

        <div className={styles.cdCinematicNumberRow}>
          <span className={styles.cdCinematicNumber}>
            {attendeesCount.toLocaleString('vi-VN')}
          </span>
        </div>

        <div className={styles.cdCinematicSubtext}>
          {custom.regLabel || 'Người tham dự đã đăng ký giữ chỗ'}
        </div>

        {hasCapacity && (
          <div className={styles.cdCapacityBox}>
            <div className={styles.cdCapacityHeader}>
              <span className={styles.cdCapacityLabel}>Tỷ lệ lấp đầy hội trường</span>
              <span className={styles.cdCapacityVal}>{capacityPercent}%</span>
            </div>
            <div className={styles.cdCapacityTrack}>
              <div className={styles.cdCapacityFill} style={{ width: `${capacityPercent}%` }} />
            </div>
            <div className={styles.cdCapacityFooter}>
              <span className={styles.cdCapacityRemain}>
                {seatsRemaining > 0 ? `Chỉ còn ${seatsRemaining} chỗ ưu đãi` : 'Hội trường đã đạt sức chứa dự kiến'}
              </span>
              <button
                type="button"
                className={styles.cdCinematicCtaBtn}
                onClick={scrollToForm}
              >
                Giữ chỗ ngay ↗
              </button>
            </div>
          </div>
        )}
      </div>
    );

    // Biến thể P0: cinema-wide (3 vùng ngang chuẩn điện ảnh, mobile đảo timer lên trên)
    if (isCinemaWide) {
      return renderContainer(
        <div className={styles.cdCinematicCard}>
          <div className={styles.cdCinematicGlowBg} aria-hidden="true" />
          <div className={`${styles.cdCinematicSplitGrid} ${styles.cdReverseMobile}`} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
            <div className={styles.cdCinematicTimerCol} style={{ padding: '8px' }}>
              <div className={styles.cdCinematicTimerHeader} style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 12 }}>
                <div className={styles.cdTimerTitleRow}>
                  <ClockIcon size={16} className={styles.cdCinematicClockIcon} />
                  <span className={styles.cdCinematicTimerEyebrow}>ĐẾM NGƯỢC KHAI MẠC</span>
                </div>
                <h3 className={styles.cdCinematicTimerMainTitle} style={{ fontSize: '1.25rem' }}>
                  {countdown.isPast ? 'Sự kiện đã diễn ra' : 'Sự kiện bắt đầu sau:'}
                </h3>
              </div>
              {!countdown.isPast ? (
                <div className={styles.cdDigitsRow} style={{ justifyContent: 'flex-start' }}>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.d).padStart(2, '0')}</span><span className={styles.digitLabel}>Ngày</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.h).padStart(2, '0')}</span><span className={styles.digitLabel}>Giờ</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.m).padStart(2, '0')}</span><span className={styles.digitLabel}>Phút</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.s).padStart(2, '0')}</span><span className={styles.digitLabel}>Giây</span></div>
                </div>
              ) : (
                <div className={styles.cdPastBox}>
                  <ClockIcon size={18} style={{ color: '#94a3b8' }} />
                  <p className={styles.cdPastMessage}>Chương trình đã kết thúc hoặc đang diễn ra trực tiếp.</p>
                </div>
              )}
              <div className={styles.cdCinematicMetaRow} style={{ justifyContent: 'flex-start', marginTop: 10 }}>
                <span>{eventData.eventTime || '08:30'} · {eventData.eventDate || '20/11/2026'}</span>
              </div>
            </div>

            <div className={styles.cdCinematicRegCol} style={{ padding: '8px' }}>
              <div className={styles.cdCinematicLiveBadge}>
                <span className={styles.cdPulseDot} />
                <span className={styles.cdLiveText}>ĐANG MỞ ĐĂNG KÝ · REAL-TIME</span>
              </div>
              <div className={styles.cdCinematicNumberRow}>
                <span className={styles.cdCinematicNumber}>
                  {attendeesCount.toLocaleString('vi-VN')}
                </span>
              </div>
              <div className={styles.cdCinematicSubtext}>
                {custom.regLabel || 'Người tham dự đã đăng ký giữ chỗ'}
              </div>
              {hasCapacity && (
                <div className={styles.cdCapacityBox} style={{ marginTop: 12 }}>
                  <div className={styles.cdCapacityHeader}>
                    <span className={styles.cdCapacityLabel}>Tỷ lệ lấp đầy hội trường</span>
                    <span className={styles.cdCapacityVal}>{capacityPercent}%</span>
                  </div>
                  <div className={styles.cdCapacityTrack}>
                    <div className={styles.cdCapacityFill} style={{ width: `${capacityPercent}%` }} />
                  </div>
                  {seatsRemaining > 0 && (
                    <div className={styles.cdCapacityRemain} style={{ marginTop: 4 }}>
                      Còn {seatsRemaining} chỗ ưu đãi
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                className={styles.cdCinematicCtaBtn}
                style={{ width: '100%', padding: '14px 20px', fontSize: '0.95rem' }}
                onClick={scrollToForm}
              >
                Giữ chỗ tham gia ngay ↗
              </button>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
                ✓ Miễn phí tham dự · Xác nhận vé tức thì
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isDateLeaf) {
      const eventDateStr = eventData.eventDate || '2026-11-20';
      const dateParts = eventDateStr.split('-');
      const monthLabel = dateParts[1] ? `T${parseInt(dateParts[1], 10)}` : 'T11';
      const dayLabel = dateParts[2] ? dateParts[2] : '20';

      return renderContainer(
        <div className={styles.cdCinematicCard}>
          <div className={styles.cdCinematicGlowBg} aria-hidden="true" />
          <div className={`${styles.cdCinematicSplitGrid} ${styles.cdReverseMobile}`}>
            {renderRegCol()}
            <div className={styles.cdCinematicDivider}>
              <span className={styles.cdCinematicDividerNode} />
            </div>
            <div className={styles.cdCinematicTimerCol}>
              <div className={styles.cdDateLeafWrap}>
                <div className={styles.cdDateLeafBox}>
                  <div className={styles.cdDateLeafMonth}>{monthLabel}</div>
                  <div className={styles.cdDateLeafDay}>{dayLabel}</div>
                  <div className={styles.cdDateLeafWeekday}>Thứ Sáu</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.cdCinematicTimerHeader} style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 8 }}>
                    <div className={styles.cdTimerTitleRow}>
                      <ClockIcon size={16} className={styles.cdCinematicClockIcon} />
                      <span className={styles.cdCinematicTimerEyebrow}>THỜI GIAN KHAI MẠC</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      {countdown.isPast ? 'Sự kiện đã diễn ra' : 'Sự kiện sẽ bắt đầu sau:'}
                    </div>
                  </div>
                  {!countdown.isPast ? (
                    <div className={styles.cdDigitsRow} style={{ justifyContent: 'flex-start' }}>
                      <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.d).padStart(2, '0')}</span><span className={styles.digitLabel}>Ngày</span></div>
                      <span className={styles.cdSep}>:</span>
                      <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.h).padStart(2, '0')}</span><span className={styles.digitLabel}>Giờ</span></div>
                      <span className={styles.cdSep}>:</span>
                      <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.m).padStart(2, '0')}</span><span className={styles.digitLabel}>Phút</span></div>
                      <span className={styles.cdSep}>:</span>
                      <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.s).padStart(2, '0')}</span><span className={styles.digitLabel}>Giây</span></div>
                    </div>
                  ) : (
                    <div className={styles.cdPastBox}>
                      <ClockIcon size={18} style={{ color: '#94a3b8' }} />
                      <p className={styles.cdPastMessage}>Chương trình đã kết thúc hoặc đang diễn ra trực tiếp.</p>
                    </div>
                  )}
                  <div className={styles.cdCinematicMetaRow} style={{ justifyContent: 'flex-start', marginTop: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><ClockIcon size={13} /> Giờ Việt Nam</span>
                    <span className={styles.cdCinematicMetaDot}>•</span>
                    <span>{eventData.eventTime || '08:30'} Ngày {eventData.eventDate || '2026-11-20'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isInlineSentence) {
      return renderContainer(
        <div className={styles.cdCinematicInlineRow}>
          <div className={styles.cdCinematicInlineRegBadge}>
            <span className={styles.cdPulseDot} />
            <span className={styles.cdCinematicInlineRegNum}>{attendeesCount.toLocaleString('vi-VN')}</span>
            <span className={styles.cdCinematicInlineRegLabel}>Người đã đăng ký</span>
          </div>
          <div className={styles.cdCinematicInlineDivider} />
          <span className={styles.cdCinematicInlineText} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ClockIcon size={14} /> Khai mạc sau: <strong>{countdown.d} ngày {countdown.h} giờ {countdown.m} phút {countdown.s} giây</strong>
          </span>
          <button
            type="button"
            className={styles.cdCinematicInlineCtaBtn}
            onClick={scrollToForm}
          >
            Đăng ký ngay ↗
          </button>
        </div>
      );
    }

    if (isProgressBar) {
      return renderContainer(
        <div className={styles.cdCinematicCard}>
          <div className={styles.cdCinematicGlowBg} aria-hidden="true" />
          <div className={`${styles.cdCinematicSplitGrid} ${styles.cdReverseMobile}`}>
            {renderRegCol()}
            <div className={styles.cdCinematicDivider}>
              <span className={styles.cdCinematicDividerNode} />
            </div>
            <div className={styles.cdCinematicTimerCol}>
              <div className={styles.cdProgressBarWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={styles.cdTimerTitleRow}>
                    <ClockIcon size={16} className={styles.cdCinematicClockIcon} />
                    <span className={styles.cdCinematicTimerEyebrow}>TIẾN ĐỘ CHUẨN BỊ</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>Còn {countdown.d} ngày {countdown.h} giờ</span>
                </div>
                <div className={styles.cdProgressBarTrack}>
                  <div className={styles.cdProgressBarFill} style={{ width: '82%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>Đã hoàn tất 82% khâu chuẩn bị hội trường và giáo trình</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>18/20 Diễn giả sẵn sàng</span>
                </div>

                <div className={styles.cdDigitsRow} style={{ marginTop: 20 }}>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.d).padStart(2, '0')}</span><span className={styles.digitLabel}>Ngày</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.h).padStart(2, '0')}</span><span className={styles.digitLabel}>Giờ</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.m).padStart(2, '0')}</span><span className={styles.digitLabel}>Phút</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.s).padStart(2, '0')}</span><span className={styles.digitLabel}>Giây</span></div>
                </div>

                <div className={styles.cdCinematicMetaRow} style={{ marginTop: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><CalendarIcon size={13} /> Khai mạc: {eventData.eventTime || '08:30'} Ngày {eventData.eventDate || '2026-11-20'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isCompactPill) {
      return renderContainer(
        <div style={{ textAlign: 'center' }}>
          <div className={styles.cdCinematicDualPill}>
            <div className={styles.cdCinematicPillBadge} onClick={scrollToForm} role="button" tabIndex={0}>
              <span className={styles.cdPulseDot} />
              <span><strong>{attendeesCount.toLocaleString('vi-VN')}</strong> người đã đăng ký</span>
            </div>
            <div className={styles.cdCompactPillWrap}>
              <ClockIcon size={16} style={{ color: '#f59e0b' }} />
              <span>{countdown.d}d : {countdown.h}h : {countdown.m}m : {countdown.s}s</span>
            </div>
          </div>
        </div>
      );
    }

    return renderContainer(
      <div className={styles.cdCinematicCard}>
        <div className={styles.cdCinematicGlowBg} aria-hidden="true" />
        <div className={`${styles.cdCinematicSplitGrid} ${styles.cdReverseMobile}`}>
          {renderRegCol()}

          <div className={styles.cdCinematicDivider}>
            <span className={styles.cdCinematicDividerNode} />
          </div>

          <div className={styles.cdCinematicTimerCol}>
            <div className={styles.cdCinematicTimerHeader}>
              <div className={styles.cdTimerTitleRow}>
                <ClockIcon size={18} className={styles.cdCinematicClockIcon} />
                <span className={styles.cdCinematicTimerEyebrow}>THỜI GIAN KHAI MẠC</span>
              </div>
              <h3 className={styles.cdCinematicTimerMainTitle}>
                {countdown.isPast ? 'Sự kiện đã diễn ra' : 'Sự kiện sẽ bắt đầu sau'}
              </h3>
            </div>

            {!countdown.isPast ? (
              <>
                <div className={`${styles.cdDigitsRow} ${isCircles ? styles.cdCircles : ''}`}>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.d).padStart(2, '0')}</span><span className={styles.digitLabel}>Ngày</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.h).padStart(2, '0')}</span><span className={styles.digitLabel}>Giờ</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.m).padStart(2, '0')}</span><span className={styles.digitLabel}>Phút</span></div>
                  <span className={styles.cdSep}>:</span>
                  <div className={styles.cdDigitBlock}><span className={styles.digitVal}>{String(countdown.s).padStart(2, '0')}</span><span className={styles.digitLabel}>Giây</span></div>
                </div>

                <div className={styles.cdCinematicMetaRow}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><ClockIcon size={13} /> Giờ Việt Nam</span>
                  <span className={styles.cdCinematicMetaDot}>•</span>
                  <span>{eventData.eventTime || '08:30'} Ngày {eventData.eventDate || '2026-11-20'}</span>
                </div>
              </>
            ) : (
              <div className={styles.cdPastBox}>
                <ClockIcon size={20} style={{ color: '#94a3b8' }} />
                <p className={styles.cdPastMessage}>Chương trình đã kết thúc hoặc đang diễn ra trực tiếp.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // 3. SPEAKERS MODULE (3 Biến thể tinh gọn: portrait-cards, trio-typographic, solo-spotlight)
  // ================================================================
  if (module.type === 'speakers') {
    const rawSpeakers = eventData.speakers?.length ? eventData.speakers : [
      { id: '1', name: 'TS. Nguyễn Văn An', title: 'Viện trưởng Viện Nghiên cứu Trí tuệ Nhân tạo' },
      { id: '2', name: 'ThS. Trần Thị Mai Phương', title: 'Lead AI Architect @ TechCorp Global' },
      { id: '3', name: 'Ông Lê Hoàng Minh', title: 'Chuyên gia Thiết kế Hệ thống & Vibe Coder' },
    ];

    const isTrioTypo = variant === 'trio-typographic';
    const isSoloSpotlight = variant === 'solo-spotlight';

    // Biến thể 1: trio-typographic (Thuần chữ sang trọng cho 3 diễn giả)
    if (isTrioTypo) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Khách mời & Chuyên gia</h2>
            <p className={styles.secDesc}>Hội tụ những gương mặt tiên phong trong công nghệ</p>
          </div>
          <div className={styles.spkTrioTypographicGrid}>
            {rawSpeakers.map((spk, idx) => (
              <div key={spk.id || idx} className={styles.spkTrioTypoItem}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{spk.name}</h4>
                <div className={styles.spkTypoLine} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>{spk.title}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Biến thể 2: solo-spotlight (1 Diễn giả tâm điểm nổi bật)
    if (isSoloSpotlight) {
      const spk = rawSpeakers[0] || { name: 'TS. Nguyễn Văn An', title: 'Viện trưởng Viện Nghiên cứu Trí tuệ Nhân tạo' };
      const asset = getSpeakerAsset(0);

      return renderContainer(
        <div className={styles.spkSoloSpotlightWrap}>
          <div className={styles.spkSoloSpotlightCard}>
            <div className={styles.spkSoloSpotlightAvatar}>
              {asset ? (
                <img src={getAssetSrc(asset)} alt={spk.name} />
              ) : (
                <div className={styles.spkInitialsAvatar} style={{ background: getAvatarBg(spk.name, 0) }}>
                  {getInitials(spk.name)}
                </div>
              )}
            </div>
            <div>
              <span className={styles.spkSoloBadge}>
                <MicIcon size={12} /> Diễn giả chính (Keynote)
              </span>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{spk.name}</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--theme-primary, #e11d48)', fontWeight: 600 }}>{spk.title}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Hơn 15 năm kinh nghiệm nghiên cứu và triển khai các hệ thống trí tuệ nhân tạo quy mô lớn. Tác giả nhiều công trình khoa học quốc tế.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Biến thể 3 & Mặc định: portrait-cards (Thẻ chân dung tỷ lệ 4:5 - Ảnh trên, chữ trang trọng bên dưới)
    return renderContainer(
      <div className={styles.speakersContainer}>
        <div className={`${styles.blockTitleCenter} ${styles.speakersTitleSpaced}`}>
          <h2 className={styles.secTitle}>Diễn giả khách mời</h2>
          <p className={styles.secDesc}>Gặp gỡ các chuyên gia đầu ngành trong lĩnh vực</p>
        </div>
        <div className={styles.spkPortraitCards}>
          {rawSpeakers.map((spk, idx) => {
            const asset = getSpeakerAsset(idx);
            return (
              <div key={spk.id || idx} className={styles.spkPortraitCard}>
                <div className={styles.spkPortraitMedia}>
                  {asset ? (
                    <img src={getAssetSrc(asset)} alt={spk.name} className={styles.spkPortraitImg} />
                  ) : (
                    <div className={styles.spkPortraitPlaceholder} style={{ background: getAvatarBg(spk.name, idx) }}>
                      {getInitials(spk.name)}
                    </div>
                  )}
                </div>
                <div className={styles.spkPortraitInfo}>
                  <h4 className={styles.spkPortraitName}>{spk.name}</h4>
                  <p className={styles.spkPortraitTitle}>{spk.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ================================================================
  // 4. AGENDA MODULE (Expanded: runofshow-sticky, timeline-compact, agenda-glance, timeline-sectioned, timeline-speaker, steps-horizontal, timeline, table, tracks)
  // ================================================================
  if (module.type === 'agenda') {
    const rawAgenda = eventData.agenda?.length ? eventData.agenda : [
      { id: '1', time: '08:30 - 09:00', title: 'Đón tiếp, check-in và nhận tài liệu' },
      { id: '2', time: '09:00 - 10:30', title: 'Khai mạc & Phần chia sẻ chuyên môn chính' },
      { id: '3', time: '10:30 - 12:00', title: 'Thực chiến: Xây dựng Landing Page đa nền tảng trong 15 phút' },
      { id: '4', time: '13:30 - 15:00', title: 'Phiên chuyên sâu: Tối ưu UI/UX cho thiết bị di động' },
      { id: '5', time: '15:00 - 16:30', title: 'Hỏi đáp tương tác, thảo luận bàn tròn & Rút thăm trúng thưởng' },
    ];

    const isRunofshowSticky = variant === 'runofshow-sticky';
    const isGlance = variant === 'agenda-glance';
    const isSectioned = variant === 'timeline-sectioned';
    const isSpeakerTimeline = variant === 'timeline-speaker';
    const isStepsHorizontal = variant === 'steps-horizontal';
    const isTable = variant === 'table';
    const isTracks = variant === 'tracks';

    const renderTimelineTime = (rawTime) => {
      if (!rawTime) return null;
      const parts = String(rawTime).split(/\s*[–—-]\s*/);
      if (parts.length >= 2) {
        return (
          <span className={styles.timelineTime}>
            <span className={styles.timelineTimeStart}>{parts[0]}</span>
            <span className={styles.timelineTimeSep}>–</span>
            <span className={styles.timelineTimeEnd}>{parts[1]}</span>
          </span>
        );
      }
      return <span className={styles.timelineTime}>{rawTime}</span>;
    };

    // Biến thể P0: runofshow-sticky (Sidebar thông tin kịch bản + Timeline sân khấu)
    if (isRunofshowSticky) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle} style={{ color: '#ffffff' }}>Run of Show · Lịch trình sân khấu</h2>
            <p className={styles.secDesc} style={{ color: '#94a3b8' }}>Dòng thời gian chi tiết từng phân cảnh và hoạt động thực chiến</p>
          </div>
          <div className={styles.agendaRunofshowWrap}>
            <aside className={styles.agendaRunofshowSidebar}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--cin-accent, #fde68a)', textTransform: 'uppercase', marginBottom: 8 }}>
                ✦ MASTER SCHEDULE
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0 0 12px 0' }}>
                Tổng quan nhịp trình
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                {rawAgenda.length} phiên trọng tâm · Bắt đầu lúc {rawAgenda[0]?.time?.split(' - ')[0] || '08:30'} · {eventData.venue || 'Innovation Hub'}
              </p>
              <button
                type="button"
                className={styles.cdCinematicCtaBtn}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem' }}
                onClick={scrollToForm}
              >
                Nhận lịch trình chi tiết ↗
              </button>
            </aside>
            <div className={styles.agendaRunofshowTimeline}>
              {rawAgenda.map((item, idx) => (
                <div key={item.id || idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px 20px', display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '95px', padding: '4px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--cin-accent, #fde68a)', textAlign: 'center' }}>
                    {item.time}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      {item.title}
                    </h4>
                    {item.speaker && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Dẫn dắt: <strong>{item.speaker}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isGlance) {
      return renderContainer(
        <div className={styles.agendaGlanceWrap}>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Chương trình tóm lược</h2>
          </div>
          <div className={styles.agendaGlanceHeader}>
            ⏱ 3.5 Giờ thực chiến · 08:30 – 12:00 · 3 Chặng trọng tâm
          </div>
          <div className={styles.agendaGlanceMilestones}>
            <div className={styles.agendaGlanceStep}>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--theme-primary, #e11d48)', marginBottom: 4 }}>08:30 - 09:00</strong>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Check-in & Khởi động</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Đón tiếp và nhận bộ công cụ</p>
            </div>
            <div className={styles.agendaGlanceStep}>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--theme-primary, #e11d48)', marginBottom: 4 }}>09:00 - 10:30</strong>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Live Demo Hands-on</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Dựng landing page đa màn hình</p>
            </div>
            <div className={styles.agendaGlanceStep}>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--theme-primary, #e11d48)', marginBottom: 4 }}>10:30 - 12:00</strong>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Hỏi đáp & Trao giải</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Giao lưu cùng diễn giả</p>
            </div>
          </div>
        </div>
      );
    }

    if (isSectioned) {
      return renderContainer(
        <div className={styles.agendaTimelineSectionedWrap}>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Lịch trình theo giai đoạn</h2>
          </div>
          <div className={styles.agendaSectionBlock}>
            <div className={styles.agendaSectionHeader}>
              <strong style={{ fontSize: '1rem', color: 'var(--theme-primary, #e11d48)' }}>PHẦN 1: NỀN TẢNG & KHỞI ĐỘNG</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>60 phút</span>
            </div>
            <div className={styles.agendaTimeline}>
              {rawAgenda.slice(0, 2).map((item, idx) => (
                <div key={item.id || idx} className={styles.timelineItem}>
                  {renderTimelineTime(item.time)}
                  <span className={styles.timelineDot} />
                  <div className={styles.timelineCard}><p className={styles.agendaItemTitle}>{item.title}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.agendaSectionBlock}>
            <div className={styles.agendaSectionHeader}>
              <strong style={{ fontSize: '1rem', color: '#059669' }}>PHẦN 2: THỰC HÀNH LIVE DEMO</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>90 phút</span>
            </div>
            <div className={styles.agendaTimeline}>
              {rawAgenda.slice(2, 4).map((item, idx) => (
                <div key={item.id || idx} className={styles.timelineItem}>
                  {renderTimelineTime(item.time)}
                  <span className={styles.timelineDot} />
                  <div className={styles.timelineCard}><p className={styles.agendaItemTitle}>{item.title}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isSpeakerTimeline) {
      return renderContainer(
        <div className={styles.agendaTimelineSpeakerWrap}>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Chương trình chi tiết</h2>
          </div>
          <div className={styles.agendaTimeline}>
            {rawAgenda.map((item, idx) => (
              <div key={item.id || idx} className={styles.timelineItem}>
                {renderTimelineTime(item.time)}
                <span className={styles.timelineDot} />
                <div className={styles.timelineCard}>
                  <p className={styles.agendaItemTitle}>{item.title}</p>
                  <span className={styles.agendaSpeakerBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <MicIcon size={12} /> Diễn giả TS. Nguyễn Văn An phụ trách
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isStepsHorizontal) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Các chặng sự kiện</h2>
          </div>
          <div className={styles.agendaStepsHorizontalWrap}>
            {rawAgenda.slice(0, 4).map((item, idx) => (
              <div key={item.id || idx} className={styles.agendaStepHorizontalItem}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--theme-primary, #e11d48)', display: 'block', marginBottom: 4 }}>
                  0{idx + 1}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                  {item.time}
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{item.title}</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default timeline, table or tracks
    const isMorningItem = (timeStr) => {
      if (!timeStr) return true;
      const match = timeStr.match(/(\d{1,2})[:h]/);
      return match ? parseInt(match[1], 10) < 12 : true;
    };

    const morningCount = rawAgenda.filter((it) => isMorningItem(it.time)).length;
    const afternoonCount = rawAgenda.filter((it) => !isMorningItem(it.time)).length;
    const hasMultipleShifts = morningCount > 0 && afternoonCount > 0 && rawAgenda.length >= 6;

    const filteredAgenda = rawAgenda.filter((it) => {
      if (agendaFilter === 'morning') return isMorningItem(it.time);
      if (agendaFilter === 'afternoon') return !isMorningItem(it.time);
      return true;
    });

    const isLongList = filteredAgenda.length > 5;
    const displayedAgenda = isLongList && !agendaExpanded ? filteredAgenda.slice(0, 5) : filteredAgenda;
    const trackA = displayedAgenda.filter((it, idx) => it.track === 'A' || (!it.track && idx % 2 === 0));
    const trackB = displayedAgenda.filter((it, idx) => it.track === 'B' || (!it.track && idx % 2 !== 0));

    return renderContainer(
      <div className={styles.agendaContainer}>
        <div className={styles.blockTitleCenter}>
          <h2 className={styles.secTitle}>Chương trình chi tiết</h2>
          <p className={styles.secDesc}>Lịch trình dự kiến của sự kiện</p>
        </div>

        {hasMultipleShifts && (
          <div className={styles.agendaFilterBar}>
            <button type="button" className={`${styles.agendaFilterPill} ${agendaFilter === 'all' ? styles.agendaFilterPillActive : ''}`} onClick={() => { setAgendaFilter('all'); setAgendaExpanded(false); }}>
              Tất cả ({rawAgenda.length})
            </button>
            <button type="button" className={`${styles.agendaFilterPill} ${agendaFilter === 'morning' ? styles.agendaFilterPillActive : ''}`} onClick={() => { setAgendaFilter('morning'); setAgendaExpanded(false); }}>
              Buổi sáng ({morningCount})
            </button>
            <button type="button" className={`${styles.agendaFilterPill} ${agendaFilter === 'afternoon' ? styles.agendaFilterPillActive : ''}`} onClick={() => { setAgendaFilter('afternoon'); setAgendaExpanded(false); }}>
              Buổi chiều ({afternoonCount})
            </button>
          </div>
        )}

        {isTable ? (
          <div className={styles.agendaTableWrap}>
            <table className={styles.agendaTable}>
              <thead><tr><th style={{ width: '160px' }}>Thời gian</th><th>Nội dung</th></tr></thead>
              <tbody>
                {displayedAgenda.map((item, idx) => (
                  <tr key={item.id || idx}><td className={styles.timeTd}>{item.time}</td><td>{item.title}</td></tr>
                ))}
              </tbody>
            </table>
            <div className={styles.agendaMobileCardList}>
              {displayedAgenda.map((item, idx) => (
                <div key={item.id || idx} className={styles.agendaMobileCard}>
                  <span className={styles.agendaMobileTimeBadge}>{item.time}</span>
                  <p className={styles.agendaMobileTitle}>{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        ) : isTracks ? (
          <div className={styles.agendaTracksWrap}>
            <div className={styles.agendaTrackCol}>
              <div className={styles.agendaTrackHeader}>
                <span>Track A: Hội trường chính</span>
                <small style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{trackA.length} phiên</small>
              </div>
              {trackA.map((item, idx) => (
                <div key={item.id || idx} className={styles.agendaCompactItem}>
                  <span className={styles.agendaCompactTime}>{item.time}</span>
                  <span className={styles.agendaCompactTitle}>{item.title}</span>
                </div>
              ))}
            </div>
            <div className={styles.agendaTrackCol}>
              <div className={styles.agendaTrackHeader}>
                <span>Track B: Phòng thực hành Workshop</span>
                <small style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{trackB.length} phiên</small>
              </div>
              {trackB.map((item, idx) => (
                <div key={item.id || idx} className={styles.agendaCompactItem}>
                  <span className={styles.agendaCompactTime}>{item.time}</span>
                  <span className={styles.agendaCompactTitle}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.agendaTimeline}>
            {displayedAgenda.map((item, idx) => (
              <div key={item.id || idx} className={styles.timelineItem}>
                {renderTimelineTime(item.time)}
                <span className={styles.timelineDot} />
                <div className={styles.timelineCard}>
                  <p className={styles.agendaItemTitle}>{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLongList && (
          <div className={styles.agendaExpandActionWrap}>
            <button type="button" className={styles.btnExpandAgenda} onClick={() => setAgendaExpanded(!agendaExpanded)}>
              <span>{agendaExpanded ? 'Thu gọn lịch trình' : `Xem toàn bộ ${filteredAgenda.length} phiên lịch trình`}</span>
              <span className={styles.expandChevron}>{agendaExpanded ? '▲' : '▼'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ================================================================
  // 5. FORM MODULE (Expanded: with-image, compact, split-offer, card, split-benefit)
  // ================================================================
  if (module.type === 'form') {
    const fields = formFields.filter((f) => !f.deleted).length ? formFields.filter((f) => !f.deleted) : [
      { key: 'fld_name', label: 'Họ và tên', type: 'text', required: true },
      { key: 'fld_email', label: 'Email', type: 'email', required: true },
      { key: 'fld_phone', label: 'Số điện thoại', type: 'tel', required: false },
    ];

    const maxCapacity = Number(eventData.capacity || 0);
    const isCapacityFull = maxCapacity > 0 && regCount >= maxCapacity;

    const isSplitBenefit = variant === 'split-benefit';
    const isWithImage = variant === 'with-image';
    const isCompact = variant === 'compact';
    const isSplitOffer = variant === 'split-offer';

    const renderFormCardContent = () => {
      if (formProps?.submitSuccessRecord) {
        return (
          <div className={styles.formSuccessCard}>
            <div className={styles.successIconCircle}><CheckIcon size={24} /></div>
            <h3 className={styles.successTitle}>Đăng ký thành công!</h3>
            <p className={styles.successSub}>Mã xác nhận tham dự sự kiện của bạn:</p>

            {/* Khung hiển thị mã vé chữ */}
            <div className={styles.successCodeBox}>
              <span className={styles.successCodeText}>{formProps.submitSuccessRecord.code}</span>
              <button type="button" className={styles.btnCopySuccessCode} onClick={formProps.onCopyCode} title="Sao chép mã">
                <CopyIcon size={14} /><span>{formProps.copiedCode ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Khung hiển thị và tải mã QR vé check-in */}
            {formProps.ticketQrUrl && (
              <div className={styles.ticketQrFrame}>
                <div className={styles.ticketQrHeader}>
                  <QrCodeIcon size={15} />
                  <span>MÃ QR CHECK-IN SỰ KIỆN</span>
                </div>
                <div className={styles.ticketQrImgWrapper}>
                  <img
                    src={formProps.ticketQrUrl}
                    alt={`Mã QR vé ${formProps.submitSuccessRecord.code}`}
                    className={styles.ticketQrImg}
                  />
                </div>
                <p className={styles.ticketQrAttendee}>
                  Người tham dự: <strong>{formProps.submitSuccessRecord.displayName}</strong>
                </p>
                {formProps.onDownloadQr && (
                  <button
                    type="button"
                    className={styles.btnDownloadQrTicket}
                    onClick={formProps.onDownloadQr}
                    title="Tải ảnh vé chứa mã QR để xuất trình khi check-in"
                  >
                    <DownloadIcon size={15} />
                    <span>Tải ảnh mã QR vé</span>
                  </button>
                )}
              </div>
            )}

            <p className={styles.successNote}>Vui lòng lưu lại mã vé hoặc tải ảnh QR để xuất trình tại quầy check-in của sự kiện.</p>
            <div className={styles.successActionsRow}>
              {formProps.onDownloadCalendar && (
                <button type="button" className={styles.btnSuccessDownloadCal} onClick={formProps.onDownloadCalendar}>
                  <CalendarIcon size={14} /><span>Thêm vào lịch</span>
                </button>
              )}
              {formProps.onResetSuccess && (
                <button type="button" className={styles.btnSuccessReset} onClick={formProps.onResetSuccess}>
                  Đăng ký thêm người khác
                </button>
              )}
            </div>
          </div>
        );
      }

      if (formProps) {
        return (
          <div>
            <div className={styles.formHeader}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <h3 className={styles.formHeading} style={{ margin: 0 }}>Đăng ký tham gia</h3>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--theme-primary, #e11d48)', background: 'rgba(225, 29, 72, 0.08)', padding: '3px 10px', borderRadius: 9999 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span><strong>{regCount}</strong> người đã đăng ký</span>
                </div>
              </div>
              <p className={styles.formSub}>Điền biểu mẫu để nhận vé mời và mã xác nhận tức thì.</p>
            </div>
            {isCapacityFull && (
              <div className={styles.formGeneralError} style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5', marginBottom: 12 }}>
                Sự kiện đã đạt số lượng người tham dự tối đa ({maxCapacity} người). Cổng đăng ký tạm thời đóng.
              </div>
            )}
            {countdown.isPast && (
              <div className={styles.formGeneralError} style={{ background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3', marginBottom: 12, fontWeight: 600 }}>
                ⏰ Sự kiện đã diễn ra và kết thúc. Cổng đăng ký trực tuyến đã đóng.
              </div>
            )}
            <form onSubmit={formProps.onSubmit} className={styles.renderedForm}>
              {formProps.formErrors?.general && (
                <div className={styles.formGeneralError}>{formProps.formErrors.general}</div>
              )}
              {fields.map((f) => (
                <div key={f.key} className={styles.formRow}>
                  <label className={styles.formLabel}>
                    {f.label} {f.required && <span className={styles.star}>*</span>}
                  </label>
                  <input
                    type={f.type}
                    className={`${styles.formInput} ${styles.formInputActive} ${formProps.formErrors?.[f.key] ? styles.formInputError : ''}`}
                    placeholder={f.hint || `Nhập ${f.label.toLowerCase()}...`}
                    value={formProps.formValues?.[f.key] || ''}
                    onChange={(e) => formProps.onInputChange?.(f.key, e.target.value)}
                    disabled={formProps.isSubmitting || isCapacityFull || countdown.isPast}
                  />
                  {formProps.formErrors?.[f.key] && (
                    <span className={styles.fieldErrorText}>{formProps.formErrors[f.key]}</span>
                  )}
                </div>
              ))}
              <button
                type="submit"
                className={`${styles.btnSubmitDemo} ${styles.btnSubmitActive}`}
                disabled={formProps.isSubmitting || countdown.isPast || isCapacityFull}
              >
                {formProps.isSubmitting
                  ? 'Đang gửi thông tin...'
                  : isCapacityFull
                    ? `Đã hết chỗ (${regCount}/${maxCapacity})`
                    : countdown.isPast
                      ? 'Sự kiện đã kết thúc'
                      : 'Hoàn tất đăng ký ngay'}
              </button>
              <p className={styles.formPrivacy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <LockIcon size={12} /> Thông tin của bạn được bảo mật tuyệt đối.
              </p>
            </form>
          </div>
        );
      }

      return (
        <div>
          <div className={styles.formHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <h3 className={styles.formHeading} style={{ margin: 0 }}>Đăng ký tham gia</h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--theme-primary, #e11d48)', background: 'rgba(225, 29, 72, 0.08)', padding: '3px 10px', borderRadius: 9999 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span><strong>{regCount}</strong> người đã đăng ký</span>
              </div>
            </div>
            <p className={styles.formSub}>Điền biểu mẫu để nhận vé mời và mã xác nhận tức thì.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className={styles.renderedForm}>
            {fields.map((f) => (
              <div key={f.key} className={styles.formRow}>
                <label className={styles.formLabel}>
                  {f.label} {f.required && <span className={styles.star}>*</span>}
                </label>
                <input type={f.type} className={styles.formInput} placeholder={f.hint || `Nhập ${f.label.toLowerCase()}...`} disabled />
              </div>
            ))}
            <button type="button" className={styles.btnSubmitDemo} disabled>
              Hoàn tất đăng ký ngay
            </button>
            <p className={styles.formPrivacy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <LockIcon size={12} /> Thông tin của bạn được bảo mật tuyệt đối.
            </p>
          </form>
        </div>
      );
    };

    if (isWithImage) {
      return renderContainer(
        <div className={styles.formWithImageWrap}>
          <div className={styles.formWithImageSide}>
            {heroAsset ? (
              <img src={getAssetSrc(heroAsset)} alt="Sự kiện" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e11d48, #fb7185)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: 24, textAlign: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>{headline}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Tham gia cùng cộng đồng công nghệ</p>
                </div>
              </div>
            )}
          </div>
          <div className={styles.formCard}>{renderFormCardContent()}</div>
        </div>
      );
    }

    if (isCompact) {
      return renderContainer(
        <div className={styles.formCompactWrap}>
          <div className={styles.formCard}>{renderFormCardContent()}</div>
        </div>
      );
    }

    if (isSplitOffer) {
      return renderContainer(
        <div className={styles.formSplitOfferWrap}>
          <div>
            <span className={styles.heroEarlyBird}><SparklesIcon size={14} /> Ưu đãi giới hạn</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '12px 0 8px 0', color: '#0f172a' }}>
              {eventData.earlyBirdOffer || 'Nhận trọn bộ Ebook & Mã giảm giá 30%'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Chỉ áp dụng cho những người đăng ký trước hạn chót. Đừng bỏ lỡ quyền lợi độc quyền này!
            </p>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--theme-primary, #e11d48)', fontWeight: 700 }}>
              <ClockIcon size={16} />
              <span>Chỉ còn {countdown.d} ngày {countdown.h} giờ cuối cùng</span>
            </div>
          </div>
          <div className={styles.formCard}>{renderFormCardContent()}</div>
        </div>
      );
    }

    if (isSplitBenefit) {
      return renderContainer(
        <div className={styles.formSplitBenefit}>
          <div className={styles.formBenefitCol}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Đăng ký tham gia ngay hôm nay</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Nhận trọn bộ tài liệu thực hành và quyền lợi ưu đãi trực tiếp.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {benefits.slice(0, 3).map((b, idx) => (
                <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem', color: '#334155' }}>
                  <span style={{ color: '#059669' }}>✓</span> {b}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.formCard}>{renderFormCardContent()}</div>
        </div>
      );
    }

    return renderContainer(
      <div className={styles.formModuleWrap}>
        <div className={styles.formCard}>{renderFormCardContent()}</div>
      </div>
    );
  }

  // ================================================================
  // 6. VENUE MODULE (Expanded: map-left, text-only, online-card, hybrid-dual, image-left)
  // ================================================================
  if (module.type === 'venue') {
    const venueName = eventData.venue || 'Trung tâm Đổi mới Sáng tạo Quốc gia (NIC)';
    const venueAddress = eventData.venueAddress || 'Tòa nhà HITC, 239 Xuân Thủy, Cầu Giấy, Hà Nội';
    const isMapLeft = variant === 'map-left';
    const isTextOnly = variant === 'text-only';
    const isOnlineCard = variant === 'online-card';
    const isHybridDual = variant === 'hybrid-dual';

    if (isMapLeft) {
      return renderContainer(
        <div className={styles.venueWrap}>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Địa điểm tổ chức</h2>
          </div>
          <div className={styles.venueMapLeftWrap}>
            {renderMapSlot(venueAddress)}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>{venueName}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 14px 0' }}>{venueAddress}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: '#334155' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ClockIcon size={14} /> <strong>Giờ đón tiếp:</strong> 08:00 - 08:30</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPinIcon size={14} /> <strong>Bãi gửi xe:</strong> Tầng hầm B1 & B2 - Miễn phí</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WifiIcon size={14} /> <strong>Tiện ích:</strong> Wifi tốc độ cao & máy chiếu 4K</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isTextOnly) {
      return renderContainer(
        <div className={styles.venueTextOnlyWrap}>
          <MapPinIcon size={32} style={{ color: 'var(--theme-primary, #e11d48)', margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{venueName}</h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: 500, margin: '0 auto 18px auto' }}>{venueAddress}</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`}
            target="_blank"
            rel="noreferrer"
            className={styles.scBtn}
            style={{ display: 'inline-flex', margin: '0 auto' }}
          >
            Mở Google Maps chỉ đường ↗
          </a>
        </div>
      );
    }

    if (isOnlineCard) {
      return renderContainer(
        <div className={styles.venueOnlineCardWrap}>
          <span className={styles.venueOnlinePlatformBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <LaptopIcon size={14} /> Sự kiện Trực tuyến
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px 0' }}>Nền tảng Zoom / Google Meet</h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, maxWidth: 540, margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            Buổi hội thảo được phát sóng trực tiếp chất lượng cao. Link phòng họp và mã truy cập sẽ được gửi tự động qua email của bạn 24h trước khi sự kiện bắt đầu.
          </p>
          <button type="button" className={styles.btnHeroCta} onClick={scrollToForm} style={{ display: 'inline-flex', margin: '0 auto' }}>
            Đăng ký để nhận link trực tuyến
          </button>
        </div>
      );
    }

    if (isHybridDual) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Hình thức tham gia</h2>
          </div>
          <div className={styles.venueHybridDualWrap}>
            <div className={styles.venueHybridCard}>
              <strong style={{ fontSize: '1rem', color: 'var(--theme-primary, #e11d48)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MapPinIcon size={14} /> Trực tiếp tại Hội trường
              </strong>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{venueName}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{venueAddress}</p>
              <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                {renderMapSlot(venueAddress)}
              </div>
            </div>
            <div className={styles.venueHybridCard}>
              <strong style={{ fontSize: '1rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <GlobeIcon size={14} /> Trực tuyến qua Video Live
              </strong>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Zoom Meetings HD</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Đường truyền riêng cho 500 người tham dự online.</p>
              <div style={{ marginTop: 'auto', background: '#f8fafc', padding: 16, borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <LockIcon size={12} /> Link phòng học sẽ gửi qua Email & SMS đã đăng ký.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default image-left
    return renderContainer(
      <div className={styles.venueWrap}>
        <div className={styles.blockTitleCenter}>
          <h2 className={styles.secTitle}>Địa điểm tổ chức</h2>
          <p className={styles.secDesc}>Không gian hội thảo tiêu chuẩn quốc tế</p>
        </div>
        <div className={`${styles.venueCard} ${styles.venueImgLeft}`}>
          {venueAsset && (
            <div className={styles.venueVisual}>
              <img src={getAssetSrc(venueAsset)} alt={venueAsset.caption || 'Địa điểm'} className={styles.venueImg} />
            </div>
          )}
          <div className={styles.venueInfoBody}>
            <MapPinIcon size={24} className={styles.venueIcon} />
            <div>
              <h4 className={styles.venueName}>{venueName}</h4>
              <p className={styles.venueAddressText}>{venueAddress}</p>
              <p className={styles.venueGuide}>{eventData.venueNotes || 'Được trang bị máy lạnh, màn hình LED và wifi tốc độ cao cho người tham dự.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // 7. BENEFITS MODULE (Expanded: cinema-trio, cards-image, recap-strip, recap-chips, numbered-rows, cards)
  // ================================================================
  if (module.type === 'benefits') {
    const isCardsImage = variant === 'cards-image';
    const isRecapStrip = variant === 'recap-strip';
    const isRecapChips = variant === 'recap-chips';
    const isNumberedRows = variant === 'numbered-rows';

    if (isCardsImage) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Lợi ích tham dự</h2>
            <p className={styles.secDesc}>Giá trị đặc biệt sự kiện mang lại cho bạn</p>
          </div>
          <div className={styles.benefitsCardsImageGrid}>
            {benefits.map((b, idx) => (
              <div key={idx} className={styles.benefitCardImageTop}>
                <div style={{ height: 140, background: getAvatarBg('benefit', idx), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  {idx === 0 ? <TargetIcon size={32} /> : idx === 1 ? <ZapIcon size={32} /> : <TrophyIcon size={32} />}
                </div>
                <div style={{ padding: 20 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--theme-primary, #e11d48)' }}>0{idx + 1}</span>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isRecapStrip) {
      return renderContainer(
        <div className={styles.benefitsRecapStripWrap}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--theme-primary, #e11d48)', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
            Quyền lợi trọn vẹn dành cho bạn
          </div>
          <div className={styles.recapStripList}>
            {benefits.slice(0, 3).map((b, idx) => (
              <div key={idx} className={styles.recapStripItem}>
                <CheckIcon size={16} style={{ color: '#059669', flexShrink: 0 }} />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isRecapChips) {
      return renderContainer(
        <div className={styles.benefitsRecapChipsWrap}>
          {benefits.map((b, idx) => (
            <span key={idx} className={styles.recapChipItem}>
              <CheckIcon size={14} style={{ color: '#059669' }} /> {b}
            </span>
          ))}
        </div>
      );
    }

    if (isNumberedRows) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Giá trị cốt lõi bạn nhận được</h2>
          </div>
          <div className={styles.benefitsNumberedRowsWrap}>
            {benefits.map((b, idx) => (
              <div key={idx} className={styles.numberedRowItem}>
                <span className={styles.numberedRowIndex}>0{idx + 1}</span>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return renderContainer(
      <div className={styles.benefitsWrap}>
        <div className={styles.blockTitleCenter}>
          <h2 className={styles.secTitle}>Lợi ích tham dự</h2>
          <p className={styles.secDesc}>Giá trị đặc biệt sự kiện mang lại cho bạn</p>
        </div>
        <div className={styles.benefitsGrid}>
          {benefits.map((b, idx) => (
            <div key={idx} className={styles.benefitCard}>
              <div className={styles.benefitCardHeader}>
                <span className={styles.benefitNumber}>0{idx + 1}</span>
                <span className={styles.benefitTag}>Đặc quyền #{idx + 1}</span>
              </div>
              <p className={styles.benefitText}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================================================================
  // 8. OFFER BANNER MODULE (Expanded: price-compare, card-image-left, tiers-timeline, inline-chip, ribbon, split-coupon)
  // ================================================================
  if (module.type === 'offer_banner') {
    const offer = custom.offer || eventData.earlyBirdOffer || 'Ưu đãi dành cho người tham dự đăng ký sớm';
    const couponCode = custom.code || '';
    const isPriceCompare = variant === 'price-compare';
    const isCardImageLeft = variant === 'card-image-left';
    const isTiersTimeline = variant === 'tiers-timeline';
    const isInlineChip = variant === 'inline-chip';
    const isCoupon = variant === 'split-coupon';

    if (isPriceCompare) {
      return renderContainer(
        <div className={styles.offerPriceCompareWrap}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--theme-primary, #e11d48)' }}>
            Ưu đãi đặt chỗ sớm
          </span>
          <div className={styles.priceCompareBox}>
            <span className={styles.priceNew}>{offer}</span>
            <span className={styles.priceSaveBadge}>Đăng ký sớm</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
            Áp dụng cho khách tham dự hoàn tất đăng ký sớm tại chương trình {eventData.eventName || 'sự kiện'}.
          </p>
          <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
            Nhận ưu đãi ngay
          </button>
        </div>
      );
    }

    if (isCardImageLeft) {
      return renderContainer(
        <div className={styles.offerCardImageLeftWrap}>
          <div className={styles.offerCardImgCol}>
            {giftAsset ? (
              <img src={getAssetSrc(giftAsset)} alt="Quà tặng" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GiftIcon size={44} style={{ color: '#ffffff' }} />
              </div>
            )}
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Quyền lợi đăng ký sớm</span>
            <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>{offer}</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#64748b' }}>
              Dành cho khách tham dự hoàn tất đăng ký tham gia {eventData.eventName || 'chương trình'}.
            </p>
            <button type="button" className={styles.btnHeroCta} onClick={scrollToForm} style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
              Đăng ký tham dự
            </button>
          </div>
        </div>
      );
    }

    if (isTiersTimeline) {
      return renderContainer(
        <div className={styles.offerTiersTimelineWrap}>
          <div className={`${styles.tiersTimelineStep} ${styles.tiersTimelineActive}`}>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--theme-primary, #e11d48)' }}>Đợt 1: Đăng ký sớm</strong>
            <span style={{ fontSize: '0.8rem', color: '#1e293b' }}>{offer}</span>
            <small style={{ display: 'block', fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>Đang mở</small>
          </div>
          <div className={styles.tiersTimelineStep}>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#64748b' }}>Đợt 2: Tiêu chuẩn</strong>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Vé tham dự tiêu chuẩn</span>
            <small style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>Giai đoạn kế tiếp</small>
          </div>
          <div className={styles.tiersTimelineStep}>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#64748b' }}>Đợt 3: Sát ngày sự kiện</strong>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Theo số lượng chỗ trống</span>
            <small style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>Trước giờ khai mạc</small>
          </div>
        </div>
      );
    }

    if (isInlineChip) {
      return renderContainer(
        <div style={{ textAlign: 'center' }}>
          <div className={styles.offerInlineChipWrap}>
            <SparklesIcon size={16} />
            <span>{offer}</span>
          </div>
        </div>
      );
    }

    if (isCoupon) {
      return renderContainer(
        <div className={styles.offerSplitCoupon}>
          <div className={styles.couponLeft}>
            {giftAsset ? (
              <div className={styles.couponGiftThumb}><img src={getAssetSrc(giftAsset)} alt="Quà tặng" /></div>
            ) : (
              <SparklesIcon size={22} style={{ color: '#d97706', flexShrink: 0 }} />
            )}
            <div className={styles.couponLeftText}>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#92400e' }}>Ưu đãi đăng ký sớm</strong>
              <span style={{ fontSize: '0.85rem', color: '#b45309' }}>{offer}</span>
            </div>
          </div>
          <div className={styles.couponRight}>{couponCode ? `MÃ: ${couponCode}` : 'ƯU ĐÃI SỚM'}</div>
        </div>
      );
    }

    return renderContainer(
      <div className={styles.offerBannerWrap}>
        {giftAsset ? (
          <div className={styles.offerGiftThumb}><img src={getAssetSrc(giftAsset)} alt="Quà tặng" /></div>
        ) : (
          <SparklesIcon size={20} className={styles.offerIcon} />
        )}
        <div><strong>Ưu đãi đặc biệt: </strong><span>{offer}</span></div>
      </div>
    );
  }

  // ================================================================
  // 10. FAQ MODULE
  // ================================================================
  if (module.type === 'faq') {
    const speakerNames = Array.isArray(eventData.speakers) && eventData.speakers.length > 0
      ? eventData.speakers.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean).join(', ')
      : 'các chuyên gia và diễn giả của chương trình';
    const defaultFaqs = [
      {
        q: 'Sự kiện diễn ra vào thời gian và địa điểm nào?',
        a: `Chương trình diễn ra vào ngày ${eventData.eventDate || 'theo thông báo'} lúc ${eventData.eventTime || '09:00'} (GMT+7) tại ${eventData.venue || 'địa điểm tổ chức sự kiện'}.`,
      },
      {
        q: 'Ai là diễn giả chia sẻ tại chương trình?',
        a: `Sự kiện có sự tham gia chia sẻ của ${speakerNames}.`,
      },
      {
        q: 'Làm thế nào để đăng ký giữ chỗ và nhận ưu đãi?',
        a: eventData.earlyBirdOffer
          ? `Bạn hãy điền thông tin tại biểu mẫu đăng ký trên trang này để nhận ngay ưu đãi: ${eventData.earlyBirdOffer}.`
          : 'Bạn chỉ cần hoàn tất biểu mẫu đăng ký trực tuyến ngay trên trang để nhận mã QR xác nhận tham dự.',
      },
    ];
    const customFaqs = Array.isArray(custom.items) && custom.items.length > 0 ? custom.items : null;
    const faqs = customFaqs || ((aiData?.faq && Array.isArray(aiData.faq) && aiData.faq.length > 0) ? aiData.faq : defaultFaqs);

    return renderContainer(
      <div className={styles.faqWrap}>
        <div className={styles.blockTitleCenter}>
          <h2 className={styles.secTitle}>Câu hỏi thường gặp</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((f, idx) => (
            <div key={idx} className={styles.faqItem}>
              <button
                type="button"
                className={styles.faqQuestionBtn}
                onClick={() => setFaqExpanded((p) => ({ ...p, [idx]: !p[idx] }))}
              >
                <span>{f.q}</span>
                <span>{faqExpanded[idx] ? '▲' : '▼'}</span>
              </button>
              {faqExpanded[idx] && <div className={styles.faqAnswer}><p>{f.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================================================================
  // 11. DIVIDER MODULE (Expanded: fade-to-stage, line)
  // ================================================================
  if (module.type === 'divider') {
    if (variant === 'fade-to-stage') {
      return renderContainer(<div className={styles.dividerFadeToStage} />);
    }
    return renderContainer(<div className={styles.dividerWrap} />);
  }

  // ================================================================
  // 12. FOOTER MODULE (Expanded: credits-roll, cta-strip, rich-3col, two-columns, simple)
  // ================================================================
  if (module.type === 'footer') {
    const isCreditsRoll = variant === 'credits-roll';
    const isCtaStrip = variant === 'cta-strip';
    const isRich3Col = variant === 'rich-3col';
    const isTwoColumns = variant === 'two-columns';

    // Biến thể P0: credits-roll (Bảng danh đề cuối phim & cảnh báo dữ liệu mẫu minh bạch)
    if (isCreditsRoll) {
      return renderContainer(
        <div className={styles.footerCreditsRoll}>
          <div className={styles.footerCreditsGrid}>
            <div>
              <div className={styles.footerCreditsColTitle}>PRODUCED BY</div>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                {eventData.organizerName || 'Ban Tổ Chức Sự Kiện'}
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Event Landing Studio · Vibecoding 2026
              </p>
            </div>
            <div>
              <div className={styles.footerCreditsColTitle}>KEY LOCATIONS</div>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#ffffff' }}>{eventData.venue || 'Innovation Hub NIC'}</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>Hà Nội, Việt Nam</p>
            </div>
            <div>
              <div className={styles.footerCreditsColTitle}>PROGRAMME</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => scrollToTarget('agenda')}>Run of Show</span></li>
                <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => scrollToTarget('speakers')}>Diễn giả</span></li>
                <li><span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => scrollToTarget('form')}>Đăng ký vé</span></li>
              </ul>
            </div>
            <div>
              <div className={styles.footerCreditsColTitle}>COMMUNICATIONS</div>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#ffffff' }}>contact@vibecoding.vn</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>Hotline: 024 3999 8888</p>
            </div>
          </div>
          <div className={styles.footerMockNotice}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <InfoIcon size={14} />
              <span>Đây là giao diện workshop mẫu phục vụ thử nghiệm giao diện. Thông tin sự kiện mang tính minh họa.</span>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#64748b' }}>
              © 2026 {eventData.eventName || 'Sự kiện'}. ALL RIGHTS RESERVED.
            </div>
          </div>
          <div className={styles.footerBrandWatermark}>
            Event Landing Studio®
          </div>
        </div>
      );
    }

    return renderContainer(
      <div>
        {isCtaStrip && (
          <div className={styles.footerCtaStripWrap}>
            <div className={styles.footerCtaStripBanner}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Sẵn sàng trải nghiệm cùng chúng tôi?</h3>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>Đăng ký ngay trước khi hết số lượng vé mời.</p>
              </div>
              <button type="button" className={styles.btnHeroCta} onClick={scrollToForm} style={{ whiteSpace: 'nowrap' }}>
                Đăng ký ngay
              </button>
            </div>
          </div>
        )}

        {isRich3Col && (
          <div className={styles.footerRich3ColWrap}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800 }}>{eventData.eventName || 'Sự kiện 2026'}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Không gian kết nối những tài năng sáng tạo công nghệ và lan tỏa giải pháp kiến trúc hiện đại.
              </p>
            </div>
            <div>
              <div className={styles.footerColTitle}>Liên kết nhanh</div>
              <ul className={styles.footerColLinks}>
                <li><span onClick={() => scrollToTarget('agenda')}>Chương trình</span></li>
                <li><span onClick={() => scrollToTarget('speakers')}>Diễn giả</span></li>
                <li><span onClick={() => scrollToTarget('venue')}>Địa điểm</span></li>
              </ul>
            </div>
            <div>
              <div className={styles.footerColTitle}>Hỗ trợ</div>
              <ul className={styles.footerColLinks}>
                <li><span>contact@vibecoding.vn</span></li>
                <li><span>Hotline: 024 3999 8888</span></li>
              </ul>
            </div>
          </div>
        )}

        {isTwoColumns && (
          <div className={styles.footerTwoColumnsWrap}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{eventData.eventName || 'Vibe Coding 2026'}</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Hội thảo & Workshop công nghệ</p>
            </div>
            <button type="button" className={styles.scBtn} onClick={scrollToForm}>
              Giữ chỗ miễn phí
            </button>
          </div>
        )}

        <footer className={styles.footerWrap} style={{ paddingTop: 10 }}>
          <p className={styles.footerCopyright}>
            © 2026 {eventData.eventName || 'Sự kiện'}. Tạo bởi Event Landing Studio.
          </p>
          <div className={styles.systemMockNotice}>
            <InfoIcon size={14} />
            <span>Bản demo vòng loại - Dữ liệu mô phỏng AI.</span>
          </div>
          <div className={styles.footerBrandWatermark}>
            Event Landing Studio®
          </div>
        </footer>
      </div>
    );
  }

  // ================================================================
  // 13. NAV MODULE (Expanded: cinema-glass, pill-float, chips-scroll, minimal-cta, bar)
  // ================================================================
  if (module.type === 'nav') {
    const brand = eventData.eventName || 'VIBE CODING 2026';
    const isCinemaGlass = variant === 'cinema-glass';
    const isPillFloat = variant === 'pill-float';
    const isChipsScroll = variant === 'chips-scroll';
    const isMinimalCta = variant === 'minimal-cta';

    // Biến thể P0: cinema-glass (Thanh điều hướng kính mờ tối màu + dải tiến độ cuộn)
    if (isCinemaGlass) {
      return renderContainer(
        <div style={{ padding: '8px 16px' }}>
          <div className={styles.navCinemaGlass}>
            <div className={styles.navBrandGroup}>
              <span className={styles.navBrandBadge} style={{ background: 'rgba(255,255,255,0.1)' }}>✦</span>
              <span className={styles.navBrand} style={{ color: '#ffffff' }} title={brand}>{brand}</span>
            </div>
            <ul className={styles.navLinks}>
              <li><span className={styles.navLink} style={{ color: '#cbd5e1' }} onClick={() => scrollToTarget('agenda')}>Lịch trình</span></li>
              <li><span className={styles.navLink} style={{ color: '#cbd5e1' }} onClick={() => scrollToTarget('speakers')}>Diễn giả</span></li>
              <li><span className={styles.navLink} style={{ color: '#cbd5e1' }} onClick={() => scrollToTarget('venue')}>Địa điểm</span></li>
            </ul>
            <button
              type="button"
              className={styles.cdCinematicCtaBtn}
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              onClick={scrollToForm}
            >
              Giữ vé ngay ↗
            </button>
            <div className={styles.navScrollProgress} aria-hidden="true" />
          </div>
        </div>
      );
    }

    if (isPillFloat) {
      return renderContainer(
        <div className={styles.navPillFloatWrap}>
          <div className={styles.navPillFloatBar}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--theme-primary, #e11d48)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <SparklesIcon size={14} />
              <span>{brand.slice(0, 16)}</span>
            </span>
            <span style={{ width: 1, height: 16, background: '#cbd5e1' }} />
            <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('agenda')}>
              <CalendarIcon size={12} />
              <span>Lịch</span>
            </button>
            <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('speakers')}>
              <MicIcon size={12} />
              <span>Diễn giả</span>
            </button>
            <button type="button" className={`${styles.quickPillBtn} ${styles.quickPillCta}`} onClick={scrollToForm}>
              <ZapIcon size={12} />
              <span>Đăng ký</span>
            </button>
          </div>
        </div>
      );
    }

    if (isChipsScroll) {
      return renderContainer(
        <div className={styles.navChipsScrollWrap}>
          <div className={styles.navChipsList}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, padding: '6px 12px', color: 'var(--theme-primary, #e11d48)' }}>{brand}</span>
            <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('agenda')}>
              <CalendarIcon size={12} />
              <span>Lịch trình</span>
            </button>
            <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('speakers')}>
              <MicIcon size={12} />
              <span>Diễn giả</span>
            </button>
            <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('venue')}>
              <MapPinIcon size={12} />
              <span>Địa điểm</span>
            </button>
            <button type="button" className={`${styles.quickPillBtn} ${styles.quickPillCta}`} onClick={scrollToForm}>
              <ZapIcon size={12} />
              <span>Đăng ký ngay</span>
            </button>
          </div>
        </div>
      );
    }

    if (isMinimalCta) {
      return renderContainer(
        <div className={styles.navMinimalCtaWrap}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{brand}</span>
          <button type="button" className={styles.navCta} onClick={scrollToForm}>
            Đăng ký tham gia
          </button>
        </div>
      );
    }

    return renderContainer(
      <div className={`${styles.navWrap} ${isDevMode ? styles.navWrapDevMode : ''}`}>
        <div className={styles.navBar}>
          <div className={styles.navBrandGroup}>
            <span className={styles.navBrandBadge}>
              <SparklesIcon size={13} />
            </span>
            <span className={styles.navBrand} title={brand}>{brand}</span>
          </div>
          <ul className={styles.navLinks}>
            <li><span className={styles.navLink} onClick={() => scrollToTarget('agenda')}>Chương trình</span></li>
            <li><span className={styles.navLink} onClick={() => scrollToTarget('speakers')}>Diễn giả</span></li>
            <li><span className={styles.navLink} onClick={() => scrollToTarget('venue')}>Địa điểm</span></li>
          </ul>
          <button type="button" className={styles.navCta} onClick={scrollToForm}>
            Đăng ký ngay
          </button>
        </div>
        <div className={styles.navQuickPills}>
          <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('agenda')}>
            <CalendarIcon size={13} />
            <span>Lịch trình</span>
          </button>
          <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('speakers')}>
            <MicIcon size={13} />
            <span>Diễn giả</span>
          </button>
          <button type="button" className={styles.quickPillBtn} onClick={() => scrollToTarget('venue')}>
            <MapPinIcon size={13} />
            <span>Địa điểm</span>
          </button>
          <button type="button" className={`${styles.quickPillBtn} ${styles.quickPillCta}`} onClick={scrollToForm}>
            <ZapIcon size={13} />
            <span>Đăng ký</span>
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // 15. STATS MODULE (Expanded: cards, big-number, inline-text, row)
  // ================================================================
  if (module.type === 'stats') {
    const speakerCount = Array.isArray(eventData.speakers) && eventData.speakers.length > 0 ? eventData.speakers.length : 1;
    const agendaCount = Array.isArray(eventData.agenda) && eventData.agenda.length > 0 ? eventData.agenda.length : 3;
    const capacityVal = Number(eventData.capacity) > 0 ? String(eventData.capacity) : 'Trực tiếp';
    const defaultStats = [
      { num: String(agendaCount), label: 'Phiên nội dung chuyên đề', sub: 'Lịch trình bài bản' },
      { num: String(speakerCount), label: 'Diễn giả chia sẻ', sub: 'Kinh nghiệm thực tiễn' },
      { num: capacityVal, label: Number(eventData.capacity) > 0 ? 'Chỉ tiêu tham dự' : 'Hình thức tổ chức', sub: eventData.venue || 'Không gian sự kiện' },
      { num: '100%', label: 'Tâm huyết tổ chức', sub: 'Trải nghiệm chuyên nghiệp' },
    ];
    const customStats = Array.isArray(custom.stats) && custom.stats.length > 0 ? custom.stats : null;
    const statsList = customStats || ((aiData?.stats && Array.isArray(aiData.stats) && aiData.stats.length > 0) ? aiData.stats : defaultStats);

    const isCards = variant === 'cards';
    const isBigNumber = variant === 'big-number';
    const isInlineText = variant === 'inline-text';

    if (isCards) {
      return renderContainer(
        <div className={styles.statsCardsNewGrid}>
          {statsList.map((st, idx) => (
            <div key={idx} className={styles.statsCardElevated}>
              <div className={styles.statsBigNum}>{st.num || st.value}</div>
              <div className={styles.statsLabel}>{st.label}</div>
              <div className={styles.statsSubtext}>{st.sub || st.subtext}</div>
            </div>
          ))}
        </div>
      );
    }

    if (isBigNumber) {
      return renderContainer(
        <div className={styles.statsBigNumberWrap}>
          <div className={styles.statsBigNumHuge}>{statsList[0]?.num || String(speakerCount)}</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#0f172a' }}>{statsList[0]?.label || 'Diễn giả & Chuyên gia'}</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{statsList[0]?.sub || `Đồng hành tại ${eventData.eventName || 'sự kiện'}.`}</p>
        </div>
      );
    }

    if (isInlineText) {
      return renderContainer(
        <div className={styles.statsInlineTextWrap}>
          <SparklesIcon size={14} style={{ color: 'var(--theme-primary, #e11d48)', display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
          {statsList.map((st, idx) => (
            <span key={idx}>
              {idx > 0 && ' · '}
              <strong>{st.num || st.value} {st.label}</strong>
            </span>
          ))}
        </div>
      );
    }

    return renderContainer(
      <div className={styles.statsGrid}>
        {statsList.map((st, idx) => (
          <div key={idx} className={styles.statsCard}>
            <div className={styles.statsBigNum}>{st.num || st.value}</div>
            <div className={styles.statsLabel}>{st.label}</div>
            <div className={styles.statsSubtext}>{st.sub || st.subtext}</div>
          </div>
        ))}
      </div>
    );
  }

  // ================================================================
  // 16. AUDIENCE MODULE (Expanded: persona-cards, checklist, yes-no-split, chips)
  // ================================================================
  if (module.type === 'audience') {
    const audienceList = [
      { badge: 'Developers', title: 'Lập trình viên & Kỹ sư Phần mềm', desc: 'Muốn tăng tốc quy trình phát triển và tích hợp các công cụ AI vào dự án thực tế.' },
      { badge: 'Designers', title: 'Product Manager & UI/UX Designer', desc: 'Nắm bắt xu hướng kiến trúc giao diện tương thích đa thiết bị và design tokens.' },
      { badge: 'Students', title: 'Sinh viên & Người bắt đầu', desc: 'Tiếp cận tư duy Vibe Coding hiện đại từ các chuyên gia đầu ngành.' },
    ];

    const isPersona = variant === 'persona-cards';
    const isChecklist = variant === 'checklist';
    const isYesNo = variant === 'yes-no-split';

    if (isPersona) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Sự kiện này dành cho ai?</h2>
          </div>
          <div className={styles.audPersonaCardsGrid}>
            {audienceList.map((item, idx) => (
              <div key={idx} className={styles.audPersonaCard}>
                <span className={styles.audBadge}>{item.badge}</span>
                <h4 style={{ margin: '12px 0 6px 0', fontSize: '1.05rem', color: '#0f172a' }}>{item.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isChecklist) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Bạn có thấy mình trong số này?</h2>
          </div>
          <div className={styles.audChecklistWrap}>
            <div className={styles.audChecklistItem}>
              <CheckIcon size={18} style={{ color: '#059669' }} />
              <span>Đang tìm cách ứng dụng AI vào xây dựng web nhanh hơn gấp 10 lần.</span>
            </div>
            <div className={styles.audChecklistItem}>
              <CheckIcon size={18} style={{ color: '#059669' }} />
              <span>Muốn giao diện chuẩn co giãn đa màn hình mà không cần mò mẫm CSS từ đầu.</span>
            </div>
            <div className={styles.audChecklistItem}>
              <CheckIcon size={18} style={{ color: '#059669' }} />
              <span>Cần giao lưu và mở rộng mối quan hệ cùng các chuyên gia hàng đầu.</span>
            </div>
          </div>
        </div>
      );
    }

    if (isYesNo) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Mức độ phù hợp</h2>
          </div>
          <div className={styles.audYesNoSplitWrap}>
            <div className={styles.audYesCol}>
              <h4 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '1.05rem' }}>✓ DÀNH CHO BẠN NẾU:</h4>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: '0.85rem', color: '#15803d', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Muốn làm chủ công cụ AI coding thực chiến.</li>
                <li>Quan tâm tới tối ưu responsive đa màn hình.</li>
                <li>Thích phương pháp học qua thực hành trực tiếp.</li>
              </ul>
            </div>
            <div className={styles.audNoCol}>
              <h4 style={{ margin: '0 0 12px 0', color: '#991b1b', fontSize: '1.05rem' }}>✗ KHÔNG PHÙ HỢP NẾU:</h4>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: '0.85rem', color: '#b91c1c', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Chỉ muốn nghe lý thuyết hàn lâm không thực hành.</li>
                <li>Không muốn tiếp cận các công cụ tự động hóa mới.</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return renderContainer(
      <div>
        <div className={styles.blockTitleCenter}>
          <h2 className={styles.secTitle}>Sự kiện này dành cho ai?</h2>
          <p className={styles.secDesc}>Nội dung được thiết kế phù hợp cho nhiều nhóm đối tượng</p>
        </div>
        <div className={styles.audGrid}>
          {audienceList.map((item, idx) => (
            <div key={idx} className={styles.audCard}>
              <span className={styles.audBadge}>{item.badge}</span>
              <h4 className={styles.audTitle}>{item.title}</h4>
              <p className={styles.audDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================================================================
  // 17. BENTO MODULE (Expanded: bento-3, bento-dark-glass, grid-asymmetric)
  // ================================================================
  if (module.type === 'bento') {
    const isBento3 = variant === 'bento-3';
    const isDarkGlass = variant === 'bento-dark-glass';

    if (isBento3) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Điểm nhấn đặc biệt (Bento 3)</h2>
          </div>
          <div className={styles.bento3Wrap}>
            <div className={styles.bentoItem} style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>01 / THỰC CHIẾN</span>
              <h3 style={{ fontSize: '1.35rem', margin: '8px 0', color: '#0f172a' }}>Xây dựng Landing Page 15 phút</h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                Làm chủ quy trình từ prompt ý tưởng đến giao diện hoàn chỉnh, co giãn mượt mà trên mọi thiết bị.
              </p>
            </div>
            <div className={styles.bento3SideCol}>
              <div className={styles.bentoItem}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>02 / QUÀ TẶNG</span>
                <h4 style={{ margin: '4px 0', fontSize: '1rem' }}>Ebook & 100+ Prompts</h4>
              </div>
              <div className={styles.bentoItem}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706' }}>03 / CHỨNG NHẬN</span>
                <h4 style={{ margin: '4px 0', fontSize: '1rem' }}>NFT Certificate Verified</h4>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isDarkGlass) {
      return renderContainer(
        <div>
          <div className={styles.blockTitleCenter}>
            <h2 className={styles.secTitle}>Tổng quan công nghệ (Dark Glass)</h2>
          </div>
          <div className={styles.bentoDarkGlassWrap}>
            <div className={`${styles.bentoDarkItem} ${styles.bentoSpan8}`}>
              <span style={{ color: '#fb7185', fontSize: '0.8rem', fontWeight: 700 }}>AI ARCHITECTURE</span>
              <h3 style={{ fontSize: '1.25rem', margin: '8px 0' }}>Container Query & Fact Guard Engine</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.5 }}>
                Bảo vệ toàn vẹn bố cục và dữ liệu với công nghệ quét tự động đa kích thước.
              </p>
            </div>
            <div className={`${styles.bentoDarkItem} ${styles.bentoSpan4}`}>
              <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700 }}>PERFORMANCE</span>
              <h3 style={{ fontSize: '1.25rem', margin: '8px 0' }}>100% Điểm Lighthouse</h3>
            </div>
          </div>
        </div>
      );
    }

    return renderContainer(
      <div>
        <div className={styles.blockTitleCenter}>
          <h2 className={styles.secTitle}>Tổng quan tiêu điểm (Bento Grid)</h2>
          <p className={styles.secDesc}>Bố cục hiện đại kết hợp nhiều góc nhìn sự kiện</p>
        </div>
        <div className={styles.bentoGrid}>
          <div className={`${styles.bentoItem} ${styles.bentoSpan8}`}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--theme-primary, #e11d48)' }}>01 / THỰC CHIẾN</span>
              <h3 className={styles.bentoItemTitle}>Lộ trình từ ý tưởng đến Landing Page hoàn chỉnh</h3>
              <p className={styles.bentoItemDesc}>Làm chủ các công cụ hỗ trợ AI coding và phương pháp xây dựng giao diện chuẩn tương thích trong vòng 15 phút.</p>
            </div>
            <div style={{ marginTop: 16 }}><span className={styles.icPill}><ZapIcon size={12} /> Live Demo</span></div>
          </div>
          <div className={`${styles.bentoItem} ${styles.bentoSpan4}`}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>02 / QUÀ TẶNG</span>
              <h3 className={styles.bentoItemTitle}>Trọn bộ Ebook & Tài liệu mẫu</h3>
              <p className={styles.bentoItemDesc}>Gửi tặng trực tiếp qua email cho các bạn tham gia đầy đủ buổi hội thảo.</p>
            </div>
          </div>
          <div className={`${styles.bentoItem} ${styles.bentoSpan6}`}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0891b2' }}>03 / NETWORKING</span>
              <h3 className={styles.bentoItemTitle}>Kết nối hơn 150+ kỹ sư công nghệ</h3>
              <p className={styles.bentoItemDesc}>Không gian giao lưu thân mật tại phòng chờ trước và sau sự kiện.</p>
            </div>
          </div>
          <div className={`${styles.bentoItem} ${styles.bentoSpan6}`}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706' }}>04 / CHỨNG NHẬN</span>
              <h3 className={styles.bentoItemTitle}>Chứng chỉ NFT số hóa độc quyền</h3>
              <p className={styles.bentoItemDesc}>Xác nhận sự tham dự và năng lực thực hành từ ban tổ chức.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // 19. SPONSORS MODULE
  // ================================================================
  if (module.type === 'sponsors') {
    const sponsorsTiers = [
      { tier: 'Đơn vị đồng hành công nghệ', brands: ['TechCorp Global', 'AI Innovators Hub', 'CloudVibe Systems'] },
      { tier: 'Bảo trợ truyền thông', brands: ['Dev Vietnam Club', 'NextGen Coder Magazine'] },
    ];

    return renderContainer(
      <div>
        <div className={styles.blockTitleCenter}>
          <h2 className={styles.secTitle}>Đối tác & Nhà tài trợ</h2>
          <p className={styles.secDesc}>Các đơn vị đồng hành phát triển cộng đồng công nghệ</p>
        </div>
        {sponsorsTiers.map((t, idx) => (
          <div key={idx} className={styles.sponsorTier}>
            <div className={styles.sponsorTierTitle}>{t.tier}</div>
            <div className={styles.sponsorLogosRow}>
              {t.brands.map((b, bIdx) => (
                <div key={bIdx} className={styles.sponsorWordmarkItem}>{b}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ================================================================
  // 20. FINAL_CTA MODULE (Expanded: cinema-finale, split-form, minimal, countdown-cta, banner)
  // ================================================================
  if (module.type === 'final_cta') {
    const isCinemaFinale = variant === 'cinema-finale';
    const isSplitForm = variant === 'split-form';
    const isMinimal = variant === 'minimal';
    const isCountdownCta = variant === 'countdown-cta';

    // Biến thể P0: cinema-finale (Khép màn điện ảnh kịch tính trên nền spotlight)
    if (isCinemaFinale) {
      return renderContainer(
        <div className={styles.finalCtaCinemaFinale}>
          <div className={styles.sceneBadge} style={{ marginBottom: 16 }}>
            FINAL ACT · KHỞI ĐẦU MỚI
          </div>
          <h2 className={styles.finalCtaDisplayTitle}>
            Sẵn Sàng Bước Vào Kỷ Nguyên Mới?
          </h2>
          <p style={{ maxWidth: '640px', margin: '0 auto 28px auto', fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            Đừng bỏ lỡ cơ hội trực tiếp học hỏi cùng các chuyên gia hàng đầu và kết nối với cộng đồng công nghệ tiên phong.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
            <button
              type="button"
              className={styles.cdCinematicCtaBtn}
              style={{ padding: '16px 36px', fontSize: '1.1rem', fontWeight: 800 }}
              onClick={scrollToForm}
            >
              Đăng ký giữ chỗ miễn phí ↗
            </button>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            ⏰ Khai mạc lúc {eventData.eventTime || '08:30'} · {eventData.eventDate || '20/11/2026'} · {eventData.venue || 'Innovation Hub'}
          </div>
        </div>
      );
    }

    if (isSplitForm) {
      return renderContainer(
        <div className={styles.finalCtaSplitFormWrap}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px 0' }}>Bứt phá cùng Vibe Coding 2026</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>Đăng ký ngay trước khi cổng ghi danh đóng lại.</p>
          </div>
          <button type="button" className={styles.finalCtaBtn} onClick={scrollToForm}>
            Giữ chỗ miễn phí ngay ↗
          </button>
        </div>
      );
    }

    if (isMinimal) {
      return renderContainer(
        <div className={styles.finalCtaMinimalWrap}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
            Sẵn sàng làm chủ công nghệ tương lai?
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 18px 0' }}>
            Số lượng ghế ngồi tại hội trường có giới hạn. Đăng ký sớm để nhận vé mời chính thức.
          </p>
          <button type="button" className={styles.btnHeroCta} onClick={scrollToForm}>
            Đăng ký tham dự ngay
          </button>
        </div>
      );
    }

    if (isCountdownCta) {
      return renderContainer(
        <div className={styles.finalCtaCountdownWrap}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 12px 0' }}>Chỉ còn thời gian ngắn để đăng ký!</h2>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fde047', margin: '14px 0 20px 0' }}>
            {countdown.d} Ngày : {countdown.h} Giờ : {countdown.m} Phút : {countdown.s} Giây
          </div>
          <button type="button" className={styles.finalCtaBtn} onClick={scrollToForm}>
            Đăng ký giữ chỗ ngay
          </button>
        </div>
      );
    }

    return renderContainer(
      <div className={styles.finalCtaBanner}>
        <h2 className={styles.finalCtaTitle}>{renderEditorialHeadline('Đừng bỏ lỡ cơ hội tham gia *sự kiện công nghệ 2026*')}</h2>
        <p className={styles.finalCtaSub}>
          Chỉ còn số lượng có hạn các suất tham dự miễn phí. Đăng ký ngay hôm nay để nhận trọn bộ quà tặng và giữ chỗ tại hội trường!
        </p>
        <button type="button" className={styles.finalCtaBtn} onClick={scrollToForm}>
          Giữ chỗ miễn phí ngay ↗
        </button>
        <div className={styles.finalCtaUrgency} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FlameIcon size={14} /> Hơn {regCount || 128} người đã đăng ký hôm nay
        </div>
      </div>
    );
  }

  // ================================================================
  // 22. ORGANIZER MODULE
  // ================================================================
  if (module.type === 'organizer') {
    return renderContainer(
      <div className={styles.orgCard}>
        <h3 className={styles.orgTitle}>Ban Tổ Chức & Kênh Hỗ Trợ</h3>
        <p className={styles.orgTagline}>Cộng đồng Kết nối Kỹ sư Công nghệ & Nhà sáng tạo số Việt Nam</p>
        <div className={styles.orgContactRow}>
          <div className={styles.orgItem}>
            <span className={styles.orgItemLabel}>Email hỗ trợ</span>
            <span className={styles.orgItemVal}>contact@vibecoding.vn</span>
          </div>
          <div className={styles.orgItem}>
            <span className={styles.orgItemLabel}>Hotline sự kiện</span>
            <span className={styles.orgItemVal}>024 3999 8888</span>
          </div>
          <div className={styles.orgItem}>
            <span className={styles.orgItemLabel}>Thời gian hỗ trợ</span>
            <span className={styles.orgItemVal}>08:00 - 18:00 (Thứ 2 - Thứ 6)</span>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // 20. ANNOUNCEMENT_BAR MODULE
  // ================================================================
  if (module.type === 'announcement_bar') {
    if (announcementClosed) return null;
    const ann = custom.announcement || mock.announcementBar;

    return renderContainer(
      <div className={styles.annTopStrip}>
        <span>{ann.text}</span>
        <button
          type="button"
          onClick={scrollToForm}
          style={{ background: '#ffffff', color: '#b91c1c', border: 'none', padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', marginLeft: 8 }}
        >
          {ann.ctaText || 'Đăng ký ngay'}
        </button>
        <button
          type="button"
          className={styles.annCloseBtn}
          onClick={() => setAnnouncementClosed(true)}
          title="Đóng thông báo"
          style={{ marginLeft: 12 }}
        >
          ✕
        </button>
      </div>
    );
  }

  // Mặc định cho module chưa xử lý
  return renderContainer(
    <div className={styles.fallbackBox}>
      <strong>{module.name}</strong>
      <span>Loại: {module.type} (Biến thể: {module.variant})</span>
    </div>
  );
}
