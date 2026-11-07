import React from 'react';
import styles from './WelcomeIntro.module.css';
import {
  SparklesIcon,
  RocketIcon,
  CheckIcon,
  LaptopIcon,
  PhoneIcon,
  QrCodeIcon,
  ZapIcon,
} from '../ui/Icons.jsx';

export function WelcomeIntro({ onNavigate }) {
  const handleLaunch = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.location.hash = '#/dashboard';
    }
  };

  return (
    <div className={styles.welcomeContainer}>
      {/* Hiệu ứng nền Ambient Radiant Glows & Grid Mesh */}
      <div className={styles.ambientGlowTopLeft} aria-hidden="true" />
      <div className={styles.ambientGlowBottomRight} aria-hidden="true" />
      <div className={styles.gridMeshBg} aria-hidden="true" />

      {/* 1. THANH ĐIỀU HƯỚNG ĐỈNH TRANG */}
      <header className={styles.topNav}>
        <div className={styles.brandLogoGroup}>
          <div className={styles.gemIconWrap}>
            {/* Vector Ruby Gem Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 3H18L22 9L12 22L2 9L6 3Z"
                fill="url(#gemGrad)"
                stroke="#fecdd3"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M2 9H22M12 22L7.5 9M12 22L16.5 9M12 22V9M6 3L7.5 9M18 3L16.5 9M6 3L12 9M18 3L12 9"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="gemGrad" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fb7185" />
                  <stop offset="0.5" stopColor="#e11d48" />
                  <stop offset="1" stopColor="#881337" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className={styles.brandTitles}>
            <span className={styles.brandTitle}>Event Landing Studio</span>
            <span className={styles.brandSubtitle}>VibeCoding 2026 • AI Engine v2.0</span>
          </div>
        </div>

        <div className={styles.topStatusPill}>
          <span className={styles.statusDot} />
          <span>Hệ thống AI &amp; QR sẵn sàng</span>
        </div>
      </header>

      {/* 2. KHU VỰC HERO CHÍNH (SPLIT CONTENT & VECTOR ART) */}
      <main className={styles.mainHero}>
        {/* NỬA TRÁI: TIÊU ĐỀ & 1 NÚT BẤM BẮT ĐẦU DUY NHẤT */}
        <section className={styles.leftHeroContent}>
          <div className={styles.eyebrowBadge}>
            <SparklesIcon size={14} />
            <span>Thế hệ Tạo Landing Page Sự kiện Mới</span>
          </div>

          <h1 className={styles.mainHeadline}>
            <span className={styles.headlineLead}>Kiến tạo Landing Page</span>{' '}
            <span className={styles.creativeHighlight}>
              <em className={styles.serifAccent}>Sự kiện Đỉnh cao</em>
            </span>{' '}
            <span className={styles.gradientEmphasis}>trong tích tắc</span>
          </h1>

          <p className={styles.mainDesc}>
            Tự động hóa bố cục chuẩn công thái học, tích hợp vé mời điện tử QR thời gian thực,
            quét camera check-in tức thì và bảo vệ toàn vẹn dữ liệu Fact Guard độc quyền.
          </p>

          {/* DUY NHẤT 1 NÚT BẤM BẮT ĐẦU */}
          <div className={styles.ctaButtonGroup}>
            <button
              type="button"
              className={styles.btnLaunchStudio}
              onClick={handleLaunch}
              id="btn-launch-app"
            >
              <span className={styles.btnLaunchShimmer} />
              <span className={styles.btnLaunchContent}>
                <RocketIcon size={20} />
                <span>BẮT ĐẦU SÁNG TẠO STUDIO</span>
                <span className={styles.btnLaunchArrow}>➔</span>
              </span>
            </button>

            <div className={styles.featureChipsRow}>
              <span className={styles.featureChipItem}>
                <CheckIcon size={14} /> Miễn phí 100%
              </span>
              <span className={styles.featureChipItem}>
                <CheckIcon size={14} /> Không cần backend
              </span>
              <span className={styles.featureChipItem}>
                <CheckIcon size={14} /> Quét vé QR mọi thiết bị
              </span>
              <span className={styles.featureChipItem}>
                <CheckIcon size={14} /> Bảng màu Đỏ Hồng Cao Cấp
              </span>
            </div>
          </div>
        </section>

        {/* NỬA PHẢI: THIẾT KẾ VECTOR STUDIO APP NỔI BẬT VỚI ANIMATION MƯỢT MÀ */}
        <section className={styles.rightHeroVisual} aria-label="Mô phỏng Vector không gian làm việc">
          <div className={styles.vectorCanvasStage}>
            {/* Thanh tiêu đề cửa sổ Studio */}
            <div className={styles.canvasWindowHeader}>
              <div className={styles.canvasDots}>
                <span className={styles.dotRed} />
                <span className={styles.dotAmber} />
                <span className={styles.dotGreen} />
              </div>
              <span className={styles.canvasWindowTitle}>event-landing-studio.preview.live</span>
              <div className={styles.canvasDevicesGroup}>
                <LaptopIcon size={14} />
                <PhoneIcon size={14} />
              </div>
            </div>

            {/* Khối mô phỏng các Module Vector sống động */}
            <div className={styles.canvasInterior}>
              {/* Module Vector 1: Hero Banner */}
              <div className={styles.miniVectorHero}>
                <div className={styles.vectorHeroLines}>
                  <div className={styles.vectorLineTitle} />
                  <div className={styles.vectorLineSub} />
                </div>
                <span className={styles.vectorHeroBtn}>Đăng ký ngay</span>
              </div>

              {/* Module Vector 2: Countdown LED */}
              <div className={styles.miniVectorCountdown}>
                <div className={styles.miniCountdownBox}>
                  <span className={styles.miniCountdownNum}>08</span>
                  <span className={styles.miniCountdownLbl}>NGÀY</span>
                </div>
                <div className={styles.miniCountdownBox}>
                  <span className={styles.miniCountdownNum}>14</span>
                  <span className={styles.miniCountdownLbl}>GIỜ</span>
                </div>
                <div className={styles.miniCountdownBox}>
                  <span className={styles.miniCountdownNum}>35</span>
                  <span className={styles.miniCountdownLbl}>PHÚT</span>
                </div>
                <div className={styles.miniCountdownBox}>
                  <span className={styles.miniCountdownNum}>20</span>
                  <span className={styles.miniCountdownLbl}>GIÂY</span>
                </div>
              </div>

              {/* Module Vector 3: Vé QR & Lịch trình */}
              <div className={styles.miniVectorSplitRow}>
                {/* Vector Vé QR */}
                <div className={styles.miniTicketCard}>
                  <div className={styles.miniQrVector}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="#be123c">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm10-2h2v2h-2v-2zm4 0h2v4h-2v-4zm-4 4h2v2h-2v-2zm2 2h4v2h-4v-2z" />
                    </svg>
                  </div>
                  <div className={styles.miniTicketInfo}>
                    <span className={styles.miniTicketCode}>DK-888888</span>
                    <span className={styles.miniTicketStatus}>✓ HỢP LỆ</span>
                  </div>
                </div>

                {/* Vector Lịch trình */}
                <div className={styles.miniAgendaCard}>
                  <div className={styles.miniAgendaItem}>
                    <span className={styles.miniAgendaDot} />
                    <span className={styles.miniAgendaText} />
                  </div>
                  <div className={styles.miniAgendaItem}>
                    <span className={styles.miniAgendaDot} />
                    <span className={styles.miniAgendaText} style={{ width: '60%' }} />
                  </div>
                  <div className={styles.miniAgendaItem}>
                    <span className={styles.miniAgendaDot} />
                    <span className={styles.miniAgendaText} style={{ width: '70%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CÁC HUY HIỆU VECTOR BỒNG BỀNH (ORBITING FLOATING TECH BADGES) */}
            <div className={styles.floatingBadgeA}>
              <ZapIcon size={16} className={styles.badgeGlowIcon} />
              <span>AI Fact Guard • Bảo vệ L5</span>
            </div>

            <div className={styles.floatingBadgeB}>
              <QrCodeIcon size={16} className={styles.badgeGlowIcon} />
              <span>Quét vé Camera thời gian thực</span>
            </div>

            <div className={styles.floatingBadgeC}>
              <span style={{ fontSize: '1rem' }}>💎</span>
              <span>Luxury Rose-Red #e11d48</span>
            </div>
          </div>
        </section>
      </main>

      {/* 3. CHÂN TRANG TRANG TRỌNG */}
      <footer className={styles.bottomFooter}>
        <div className={styles.footerLeft}>
          <span>Cuộc thi VibeCoding 2026 • Đề bài số 08</span>
        </div>
        <div className={styles.footerRight}>
          <span>Event Landing Studio — Tiêu chuẩn Thiết kế Tối giản &amp; Quyền quý</span>
        </div>
      </footer>
    </div>
  );
}

