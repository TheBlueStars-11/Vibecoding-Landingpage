import { useState } from 'react';
import Countdown from './Countdown';
import RegistrationForm from './RegistrationForm';
import RegistrationList from './RegistrationList';
import styles from './LandingPage.module.css';

function formatDateTime(dt) {
  return new Date(dt).toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseAgenda(agendaText) {
  if (!agendaText?.trim()) return [];
  return agendaText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const dashIdx = line.indexOf('-');
      if (dashIdx > -1) {
        return { time: line.slice(0, dashIdx).trim(), title: line.slice(dashIdx + 1).trim() };
      }
      return { time: '', title: line };
    });
}

export default function LandingPage({ eventData, aiContent, onReset }) {
  const { name, datetime, location, speakers, earlyBird, agenda } = eventData;
  const { headline, description, bullets } = aiContent;
  const eventId = `${name}-${datetime}`.replace(/\s+/g, '-').toLowerCase();
  const agendaItems = parseAgenda(agenda);
  const speakerList = speakers.split(',').map((s) => s.trim()).filter(Boolean);
  const [regCount, setRegCount] = useState(null);
  const [showList, setShowList] = useState(false);

  return (
    <div className={styles.page}>
      {/* ── HERO ─────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>Sự kiện</div>
          <h1 className={styles.headline}>{headline}</h1>
          <p className={styles.description}>{description}</p>

          <div className={styles.meta}>
            <span>📅 {formatDateTime(datetime)}</span>
            <span>📍 {location}</span>
          </div>

          <Countdown targetDatetime={datetime} />

          {earlyBird && (
            <div className={styles.earlyBird}>
              🎁 Ưu đãi đăng ký sớm: <strong>{earlyBird}</strong>
            </div>
          )}
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Tại sao nên tham dự?</h2>
          <div className={styles.bullets}>
            {bullets.map((b, i) => (
              <div key={i} className={styles.bullet}>
                <span className={styles.bulletIcon}>{['🎯', '💡', '🚀'][i % 3]}</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPEAKERS ─────────────────────────── */}
      <section className={`${styles.section} ${styles.altBg}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Diễn giả</h2>
          <div className={styles.speakers}>
            {speakerList.map((sp, i) => (
              <div key={i} className={styles.speakerCard}>
                <div className={styles.avatar}>{sp.charAt(0).toUpperCase()}</div>
                <p className={styles.speakerName}>{sp}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENDA ───────────────────────────── */}
      {agendaItems.length > 0 && (
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Chương trình</h2>
            <div className={styles.agenda}>
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

      {/* ── REGISTER ─────────────────────────────── */}
      <section className={`${styles.section} ${styles.registerSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle} style={{ color: '#fff' }}>Đăng Ký Tham Dự</h2>
          <RegistrationForm eventId={eventId} onCountChange={setRegCount} />
          <div className={styles.viewListWrap}>
            <button className={styles.viewListBtn} onClick={() => setShowList(true)}>
              📋 Xem danh sách đăng ký
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER / RESET ───────────────────── */}
      <div className={styles.resetBar}>
        <button className={styles.resetBtn} onClick={onReset}>
          ➕ Tạo trang mới
        </button>
      </div>

      {showList && <RegistrationList onClose={() => setShowList(false)} />}
    </div>
  );
}

