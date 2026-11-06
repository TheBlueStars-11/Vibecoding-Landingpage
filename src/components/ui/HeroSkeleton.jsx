import styles from './HeroSkeleton.module.css';

export default function HeroSkeleton({ message = 'AI đang sáng tạo nội dung cho Landing Page...' }) {
  return (
    <section className={styles.skeletonHero} aria-busy="true" aria-label="Đang tải giao diện">
      {/* Thông báo tiến trình */}
      <div className={styles.bannerStatus}>
        <div className={styles.spinner} />
        <span>{message}</span>
      </div>

      <div className={styles.skeletonInner}>
        {/* Cột trái */}
        <div className={styles.skeletonLeft}>
          <div className={`${styles.badgeSkeleton} ${styles.shimmer}`} />
          <div className={`${styles.h1Skeleton1} ${styles.shimmer}`} />
          <div className={`${styles.h1Skeleton2} ${styles.shimmer}`} />
          <div className={`${styles.descSkeleton1} ${styles.shimmer}`} />
          <div className={`${styles.descSkeleton2} ${styles.shimmer}`} />

          <div className={styles.chipRow}>
            <div className={`${styles.chipSkeleton} ${styles.shimmer}`} />
            <div className={`${styles.chipSkeleton} ${styles.shimmer}`} />
          </div>

          <div className={`${styles.btnSkeleton} ${styles.shimmer}`} />
        </div>

        {/* Cột phải: Thẻ kính Countdown */}
        <div className={styles.glassCardSkeleton}>
          <div className={`${styles.countdownLabelSkeleton} ${styles.shimmer}`} />
          <div className={styles.boxesRow}>
            <div className={`${styles.boxSkeleton} ${styles.shimmer}`} />
            <div className={`${styles.boxSkeleton} ${styles.shimmer}`} />
            <div className={`${styles.boxSkeleton} ${styles.shimmer}`} />
            <div className={`${styles.boxSkeleton} ${styles.shimmer}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

