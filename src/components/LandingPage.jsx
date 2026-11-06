import { useState } from 'react';
import Countdown from './Countdown.jsx';
import RegistrationForm from './RegistrationForm.jsx';
import RegistrationList from './RegistrationList.jsx';
import StudioPanel from './studio/StudioPanel.jsx';
import StickyCta from './landing/StickyCta.jsx';
import { ConfirmDialog } from './ui/ConfirmDialog.jsx';
import { TargetIcon, LightbulbIcon, RocketIcon, CalendarIcon, MapPinIcon, TicketIcon, FlameIcon, SparklesIcon, GiftIcon } from './ui/Icons.jsx';
import { formatVietnameseDateTime } from '../domain/time.js';
import { parseAgenda } from '../domain/agenda.js';
import { generateEventContentWithGuard } from '../services/aiClient.js';
import { eventRepo, countRegistrations } from '../lib/storage.js';
import styles from './LandingPage.module.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage({ eventData, aiContent, onReset, onUpdateEvent }) {
  const { name, datetime, startAt, location, speakers, earlyBird, agenda, agendaItems: savedAgenda, agendaIsSample, theme: initialTheme } = eventData;
  const { source, tone: initialTone } = aiContent;

  const eventId = eventData.id || `${name}-${datetime}`.replace(/\s+/g, '-').toLowerCase();

  const [theme, setTheme] = useState(initialTheme || 'classic');
  const [tone, setTone] = useState(initialTone || 'professional');
  const [currentContent, setCurrentContent] = useState(aiContent);
  const [regCount, setRegCount] = useState(() => countRegistrations(eventId));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const agendaItems = savedAgenda && savedAgenda.length > 0 ? savedAgenda : parseAgenda(agenda);
  const speakerList = Array.isArray(speakers)
    ? speakers
    : (speakers || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

  const icons = [TargetIcon, LightbulbIcon, RocketIcon];

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    const updated = { ...eventData, theme: newTheme, content: currentContent };
    eventRepo.save(updated);
    onUpdateEvent?.(updated);
  };

  const handleToneChange = (newTone) => {
    setTone(newTone);
  };

  const handleUpdateContent = (newContent) => {
    setCurrentContent(newContent);
    const updated = { ...eventData, content: newContent, theme };
    eventRepo.save(updated);
    onUpdateEvent?.(updated);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const regenerated = await generateEventContentWithGuard({
        ...eventData,
        tone,
      });
      handleUpdateContent(regenerated);
    } catch (err) {
      console.warn('Lỗi khi tạo lại nội dung AI:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleScrollToRegister = () => {
    const target = document.getElementById('register-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.page} data-theme={theme}>
      {/* ── 0. BẢNG ĐIỀU KHIỂN STUDIO (Dành cho nhà tổ chức) ── */}
      <StudioPanel
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        currentTone={tone}
        onToneChange={handleToneChange}
        aiContent={currentContent}
        onUpdateContent={handleUpdateContent}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        onOpenAdmin={() => setShowList(true)}
        onNewEvent={() => setShowConfirmReset(true)}
      />

      {/* ── 1. STICKY TOP NAVIGATION ── */}
      <nav className={styles.topNav} aria-label="Thanh điều hướng">
        <div className={styles.topNavInner}>
          <span className={styles.topNavTitle}>{name}</span>
          <button
            type="button"
            className={styles.topNavBtn}
            onClick={handleScrollToRegister}
          >
            <TicketIcon size={14} />
            <span>Đăng ký tham dự</span>
          </button>
        </div>
      </nav>

      {/* ── 2. HERO SECTION ── */}
      <header className={styles.hero}>
        <div className={styles.heroAbstractDecor} aria-hidden="true">
          <svg className={styles.heroCircleTop} width="280" height="280" viewBox="0 0 280 280" fill="none">
            <circle cx="140" cy="140" r="130" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="4 6" />
            <circle cx="140" cy="140" r="95" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
            <circle cx="140" cy="140" r="60" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
            <circle cx="235" cy="140" r="3.5" fill="rgba(255,255,255,0.4)" />
          </svg>
          <svg className={styles.heroCircleBottom} width="220" height="220" viewBox="0 0 220 220" fill="none">
            <circle cx="110" cy="110" r="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <circle cx="110" cy="110" r="70" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="3 5" />
            <circle cx="110" cy="110" r="40" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          </svg>
        </div>
        <div className={styles.heroInner}>
          {/* Cột trái: Thông tin tiêu đề & Kêu gọi hành động */}
          <div className={styles.heroLeft}>
            <div className={styles.heroTopBadges}>
              <span className={styles.badge}>Sự kiện đặc biệt</span>
              <div
                className={styles.socialProofBadge}
                onClick={handleScrollToRegister}
                role="button"
                tabIndex={0}
                title="Nhấn để cuộn tới form đăng ký"
              >
                {regCount > 0 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <FlameIcon size={14} />
                    <span><strong>{regCount}</strong> người đã đăng ký</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <SparklesIcon size={14} />
                    <span><strong>Hãy là người đầu tiên</strong> đăng ký!</span>
                  </span>
                )}
              </div>
            </div>

            <h1 className={styles.headline}>{currentContent.headline}</h1>
            <p className={styles.description}>{currentContent.description}</p>

            <div className={styles.metaChips}>
              <div className={styles.chip}>
                <CalendarIcon className={styles.chipIcon} />
                <span>{formatVietnameseDateTime(startAt || datetime)}</span>
              </div>
              <div className={styles.chip}>
                <MapPinIcon className={styles.chipIcon} />
                <span>{location}</span>
              </div>
            </div>

            <div className={styles.heroCtaRow}>
              <button
                type="button"
                className={styles.mainCtaBtn}
                onClick={handleScrollToRegister}
              >
                <TicketIcon size={16} />
                <span>Đăng ký giữ chỗ ngay</span>
              </button>

              {earlyBird && (
                <div className={styles.earlyBirdBox}>
                  <GiftIcon size={15} />
                  <span>Ưu đãi sớm: <strong>{earlyBird}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Thẻ kính mờ Countdown */}
          <div className={styles.heroRight}>
            <div className={styles.glassCard}>
              <Countdown targetDatetime={startAt || datetime} regCount={regCount} />
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. LỢI ÍCH THAM DỰ ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tại Sao Bạn Không Nên Bỏ Lỡ?</h2>
            <p className={styles.sectionSubtitle}>Những giá trị cốt lõi được thiết kế riêng cho người tham dự</p>
          </div>
          <div className={styles.bullets}>
            {currentContent.bullets.map((b, i) => {
              const IconComponent = icons[i % icons.length];
              return (
                <div key={i} className={styles.bullet}>
                  <div className={styles.bulletIconWrapper}>
                    <IconComponent size={26} />
                  </div>
                  <span className={styles.bulletText}>{b}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. DIỄN GIẢ ── */}
      {speakerList.length > 0 && (
        <section className={`${styles.section} ${styles.altBg}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Diễn Giả Đồng Hành</h2>
              <p className={styles.sectionSubtitle}>Gặp gỡ và giao lưu trực tiếp cùng các chuyên gia</p>
            </div>
            <div className={styles.speakers}>
              {speakerList.map((sp, i) => (
                <div key={i} className={styles.speakerCard}>
                  <div className={styles.avatar}>{sp.charAt(0).toUpperCase()}</div>
                  <h3 className={styles.speakerName}>{sp}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. CHƯƠNG TRÌNH SỰ KIỆN (AGENDA) ── */}
      {agendaItems.length > 0 && (
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Lịch Trình Chi Tiết
                {agendaIsSample && <span className={styles.sampleTag}>(Dự kiến)</span>}
              </h2>
              <p className={styles.sectionSubtitle}>Chương trình được chuẩn bị công phu theo từng khung giờ</p>
            </div>
            <div className={styles.agendaTimeline}>
              {agendaItems.map((item, i) => (
                <div key={i} className={styles.agendaItem}>
                  {item.time && <span className={styles.agendaTime}>{item.time}</span>}
                  <span className={styles.agendaTitle}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. TIẾP NHẬN ĐĂNG KÝ ── */}
      <section className={`${styles.section} ${styles.registerSection}`}>
        <div className={styles.container}>
          <RegistrationForm
            eventId={eventId}
            eventData={{ ...eventData, content: currentContent }}
            onCountChange={setRegCount}
          />
        </div>
      </section>

      {/* ── 7. CHÂN TRANG ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerText}>
            © {CURRENT_YEAR} {name}. Sự kiện trực tuyến / trực tiếp.
          </p>
          <p className={styles.footerText}>
            {source === 'mock'
              ? 'Bản demo vòng loại - Dữ liệu mô phỏng AI'
              : 'Trang đích được tự động khởi tạo bởi Event Page Builder cùng AI'}
          </p>
        </div>
      </footer>

      {/* Thanh CTA cố định dính đáy trên mobile */}
      <StickyCta eventName={name} />

      {/* Modal danh sách đăng ký */}
      {showList && <RegistrationList onClose={() => setShowList(false)} />}

      {/* Hộp xác nhận khi bấm Tạo trang mới */}
      <ConfirmDialog
        isOpen={showConfirmReset}
        title="Tạo Landing Page Mới?"
        message="Bạn sắp rời khỏi trang hiện tại. Toàn bộ sự kiện và danh sách người đăng ký vẫn được lưu an toàn trong hệ thống."
        confirmLabel="Tiếp tục tạo mới"
        cancelLabel="Ở lại"
        onConfirm={() => {
          setShowConfirmReset(false);
          onReset();
        }}
        onCancel={() => setShowConfirmReset(false)}
      />
    </div>
  );
}
