import React, { useState, useEffect } from 'react';
import styles from './PublicLandingPage.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import { PROJECT_STATUS } from '../../domain/elsSchema.js';
import { fetchProjectFromSync } from '../../services/realtimeSync.js';
import { LandingView } from '../landing/LandingView.jsx';
import { ArrowLeftIcon, RefreshCwIcon } from '../ui/Icons.jsx';

export function PublicLandingPage({ slug, onNavigate }) {
  const [project, setProject] = useState(() => elsRepository.getProjectBySlug(slug));
  const [assets, setAssets] = useState(() => {
    const initP = elsRepository.getProjectBySlug(slug);
    return initP ? elsRepository.getAssets(initP.id) : [];
  });
  const [isLoading, setIsLoading] = useState(!project);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const localP = elsRepository.getProjectBySlug(slug);
      if (localP) {
        if (isMounted) {
          setProject(localP);
          setAssets(elsRepository.getAssets(localP.id));
          setIsLoading(false);
        }
        return;
      }

      // Chưa có trong localStorage (thiết bị di động mới quét mã QR)
      setIsLoading(true);
      const remote = await fetchProjectFromSync(slug);
      if (!isMounted) return;

      if (remote && remote.project) {
        try {
          elsRepository.saveProject(remote.project);
          if (remote.assets && Array.isArray(remote.assets)) {
            elsRepository.saveAssets(remote.project.id, remote.assets);
          }
        } catch {
          // Bỏ qua lỗi cache cục bộ nếu quota đầy
        }
        setProject(remote.project);
        setAssets(remote.assets || []);
      }
      setIsLoading(false);
    }

    loadData();

    const handleUpdate = () => {
      const p = elsRepository.getProjectBySlug(slug);
      if (p && isMounted) {
        setProject(p);
        setAssets(elsRepository.getAssets(p.id));
      }
    };

    const unsub = elsRepository.subscribe(handleUpdate);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [slug]);

  // Trạng thái đang tải dữ liệu từ máy chủ
  if (isLoading) {
    return (
      <div className={styles.publicContainer}>
        <div className={styles.messageCard}>
          <div className={styles.clockIconWrap}>
            <RefreshCwIcon size={28} className={styles.spinIcon} />
          </div>
          <h1 className={styles.messageTitle}>Đang tải trang sự kiện...</h1>
          <p className={styles.messageDesc}>
            Đang đồng bộ dữ liệu landing page từ máy chủ chia sẻ thời gian thực.
          </p>
        </div>
      </div>
    );
  }

  // Nếu không tìm thấy sự kiện
  if (!project) {
    return (
      <div className={styles.publicContainer}>
        <div className={styles.messageCard}>
          <h1 className={styles.messageTitle}>Không tìm thấy sự kiện</h1>
          <p className={styles.messageDesc}>
            Đường dẫn không tồn tại hoặc sự kiện chưa được xuất bản lên máy chủ đồng bộ.
          </p>
          <button
            type="button"
            className={styles.btnHome}
            onClick={() => onNavigate('dashboard')}
          >
            <ArrowLeftIcon size={16} />
            <span>Về trang chủ Event Landing Studio</span>
          </button>
        </div>
      </div>
    );
  }

  // Đã có dữ liệu dự án -> Render landing page hoàn chỉnh (Hỗ trợ cả Bản nháp và Đã xuất bản để quét QR kiểm thử trực tiếp)
  return (
    <div className={styles.publishedLanding}>
      {project.status === PROJECT_STATUS.DRAFT && (
        <div className={styles.draftBanner}>
          <span>Chế độ xem trước • Cổng đăng ký đang mở để kiểm tra và gửi dữ liệu thử nghiệm</span>
        </div>
      )}
      <LandingView
        project={project}
        assets={assets}
        isInteractive={true}
        source="landing"
      />
    </div>
  );
}
