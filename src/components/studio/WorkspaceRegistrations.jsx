import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import styles from './WorkspaceRegistrations.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import { PROJECT_STATUS } from '../../domain/elsSchema.js';
import {
  getNetworkInfo,
  publishProjectToSync,
  connectRealtimeStream,
  getRemoteRegistrations,
  startTunnel,
  stopTunnel,
  checkCloudflareHealth,
} from '../../services/realtimeSync.js';
import {
  UsersIcon,
  SparklesIcon,
  CopyIcon,
  DownloadIcon,
  CheckIcon,
  SearchIcon,
  TrashIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  ClockIcon,
  QrCodeIcon,
  GlobeIcon,
  LightbulbIcon,
  ActivityIcon,
  WifiIcon,
} from '../ui/Icons.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';

export function WorkspaceRegistrations({ project, onShowToast, onOpenQrScanner }) {
  const [registrations, setRegistrations] = useState(() => {
    return project?.id ? elsRepository.getRegistrations(project.id) : [];
  });
  const [customTunnelUrl, setCustomTunnelUrl] = useState('');
  const [isStartingTunnel, setIsStartingTunnel] = useState(false);
  const [isCheckingTunnel, setIsCheckingTunnel] = useState(false);
  const [tunnelHealthResult, setTunnelHealthResult] = useState(null);
  const [tunnelError, setTunnelError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'az'
  const [checkInFilter, setCheckInFilter] = useState('all'); // 'all' | 'checked_in' | 'pending'
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Vừa xong');
  const qrImageRef = useRef(null);

  const [todayIsoStr] = useState(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000).toISOString().slice(0, 10);
  });

  // Tự động đảm bảo trạng thái đã xuất bản (PUBLISHED) để các thiết bị quét QR có thể đăng ký ngay
  useEffect(() => {
    if (project?.id && project.status !== PROJECT_STATUS.PUBLISHED) {
      const updated = { ...project, status: PROJECT_STATUS.PUBLISHED };
      elsRepository.saveProject(updated);
    }
  }, [project]);

  // 1. Tải thông tin mạng & kết nối Cloudflare Tunnel khi mount
  useEffect(() => {
    let mounted = true;
    getNetworkInfo().then((info) => {
      if (!mounted || !info) return;
      if (info.tunnelUrl) {
        setCustomTunnelUrl(info.tunnelUrl);
      } else {
        // Tự động khởi động Cloudflare Tunnel nếu chưa chạy
        setIsStartingTunnel(true);
        startTunnel()
          .then((res) => {
            if (!mounted) return;
            if (res && res.ok && res.tunnelUrl) {
              setCustomTunnelUrl(res.tunnelUrl);
            }
          })
          .catch(() => { })
          .finally(() => {
            if (mounted) setIsStartingTunnel(false);
          });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleStartTunnel = async () => {
    setIsStartingTunnel(true);
    setTunnelError(null);
    try {
      const res = await startTunnel();
      if (res && res.ok && res.tunnelUrl) {
        setCustomTunnelUrl(res.tunnelUrl);
        onShowToast?.('Cloudflare Tunnel đã kết nối thành công!', 'success');
      } else {
        const errMsg = res?.error || 'Không thể tạo Cloudflare Tunnel';
        setTunnelError(errMsg);
        onShowToast?.(errMsg, 'error');
      }
    } catch (err) {
      setTunnelError(err.message || 'Lỗi khởi động Cloudflare Tunnel');
    } finally {
      setIsStartingTunnel(false);
    }
  };

  const handleStopTunnel = async () => {
    await stopTunnel();
    setCustomTunnelUrl('');
    setTunnelHealthResult(null);
    onShowToast?.('Đã dừng Cloudflare Tunnel', 'info');
  };

  // Khởi động lại Cloudflare Tunnel sạch sẽ
  const handleRestartTunnel = async () => {
    setIsStartingTunnel(true);
    setTunnelError(null);
    setTunnelHealthResult(null);
    try {
      await stopTunnel();
      const res = await startTunnel();
      if (res && res.ok && res.tunnelUrl) {
        setCustomTunnelUrl(res.tunnelUrl);
        onShowToast?.('Cloudflare Tunnel đã được khởi động lại thành công!', 'success');
      } else {
        const errMsg = res?.error || 'Không thể tạo Cloudflare Tunnel';
        setTunnelError(errMsg);
        onShowToast?.(errMsg, 'error');
      }
    } catch (err) {
      setTunnelError(err.message || 'Lỗi khởi động lại Cloudflare Tunnel');
    } finally {
      setIsStartingTunnel(false);
    }
  };

  // Kiểm tra trạng thái hoạt động thực tế của Cloudflare Tunnel và đo độ trễ
  const handleCheckCloudflare = async () => {
    setIsCheckingTunnel(true);
    setTunnelHealthResult(null);
    try {
      const res = await checkCloudflareHealth(customTunnelUrl);
      setTunnelHealthResult(res);

      if (res.tunnelUrl && !customTunnelUrl) {
        setCustomTunnelUrl(res.tunnelUrl);
      }

      if (res.ok) {
        onShowToast?.(res.message, 'success');
      } else {
        onShowToast?.(res.message, 'warning');
      }
    } catch (err) {
      const fallback = {
        ok: false,
        latency: 0,
        message: `Lỗi kiểm tra kết nối: ${err.message || 'Không thể kết nối máy chủ'}`,
        checkedAt: new Date().toLocaleTimeString('vi-VN'),
      };
      setTunnelHealthResult(fallback);
      onShowToast?.(fallback.message, 'error');
    } finally {
      setIsCheckingTunnel(false);
    }
  };

  // 2. Tính toán đường dẫn Landing Page công khai qua Cloudflare Tunnel / Server
  const activeUrl = useMemo(() => {
    const slug = project?.slug || '';
    if (!slug) return '';

    const cleanTunnel = (customTunnelUrl || '').trim().replace(/\/+$/, '');
    if (cleanTunnel) {
      return `${cleanTunnel}/#/e/${slug}`;
    }
    // Fallback an toàn về domain máy chủ hiện tại
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/#/e/${slug}`;
  }, [project?.slug, customTunnelUrl]);

  // 3. Tạo mã QR độ nét cao khi activeUrl thay đổi
  useEffect(() => {
    let isMounted = true;
    if (activeUrl) {
      QRCode.toDataURL(activeUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((dataUrl) => {
          if (isMounted) setQrDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('Lỗi sinh mã QR:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activeUrl]);

  // 4. Đồng bộ dữ liệu sự kiện lên dev server & kết nối luồng SSE thời gian thực
  useEffect(() => {
    if (!project?.id) return;

    // Xuất bản dữ liệu dự án lên dev sync server để thiết bị khác quét QR có dữ liệu ngay
    const assets = elsRepository.getAssets(project.id);
    publishProjectToSync(project, assets).then(() => {
      setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
    });

    // Tải danh sách đơn đã có trên máy chủ (nếu có từ phiên trước)
    getRemoteRegistrations(project.id).then((remotes) => {
      if (Array.isArray(remotes) && remotes.length > 0) {
        remotes.forEach((r) => {
          elsRepository.addExistingRegistration(project.id, r);
        });
        setRegistrations(elsRepository.getRegistrations(project.id));
      }
    });

    // Kết nối luồng Server-Sent Events (SSE) để nhận đơn đăng ký tức thì
    const unsubStream = connectRealtimeStream(project.id, (event) => {
      if (event.type === 'registration_added' && event.registration) {
        const added = elsRepository.addExistingRegistration(project.id, event.registration);
        if (added) {
          setRegistrations(elsRepository.getRegistrations(project.id));
          onShowToast?.(
            `Đơn mới từ ${event.registration.displayName || 'Khách'} (${event.registration.code})!`,
            'success'
          );
        }
      }
    });

    // Lắng nghe thêm qua BroadcastChannel và localStorage
    const unsubRepo = elsRepository.subscribe((event) => {
      if (
        event.projectId === project.id ||
        event.type === 'registration_added' ||
        event.type === 'registration_deleted'
      ) {
        setRegistrations(elsRepository.getRegistrations(project.id));
      }
    });

    return () => {
      unsubStream();
      unsubRepo();
    };
  }, [project, onShowToast]);

  // 5. Thống kê Dashboard
  const stats = useMemo(() => {
    const total = registrations.length;

    const todayCount = registrations.filter((r) => {
      if (!r.createdAt) return false;
      const rDate = new Date(new Date(r.createdAt).getTime() + 7 * 3600000).toISOString().slice(0, 10);
      return rDate === todayIsoStr;
    }).length;

    const checkedInCount = registrations.filter((r) => r.checkedIn).length;
    const checkInRate = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;
    const latest = registrations.length > 0 ? registrations[0] : null;

    return {
      total,
      todayCount,
      checkedInCount,
      checkInRate,
      latest,
    };
  }, [registrations, todayIsoStr]);

  // 6. Lọc và Sắp xếp danh sách
  const filteredRegistrations = useMemo(() => {
    let result = [...registrations];

    // Lọc theo trạng thái check-in
    if (checkInFilter === 'checked_in') {
      result = result.filter((r) => r.checkedIn);
    } else if (checkInFilter === 'pending') {
      result = result.filter((r) => !r.checkedIn);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.code || '').toLowerCase().includes(q) ||
          (r.displayName || '').toLowerCase().includes(q) ||
          (r.identityKey || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'az') {
      result.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    }

    return result;
  }, [registrations, checkInFilter, searchQuery, sortBy]);

  // Đảo trạng thái check-in thủ công
  const handleToggleCheckIn = (regId) => {
    if (!project?.id) return;
    const updated = elsRepository.toggleCheckIn(project.id, regId);
    if (updated) {
      setRegistrations(elsRepository.getRegistrations(project.id));
      onShowToast?.(
        updated.checkedIn
          ? `Đã check-in cho ${updated.displayName} (${updated.code})`
          : `Đã hủy check-in cho ${updated.displayName}`,
        'success'
      );
    }
  };

  // 7. Thao tác tiện ích
  const handleCopyLink = () => {
    if (!activeUrl) return;
    navigator.clipboard.writeText(activeUrl);
    setCopiedLink(true);
    onShowToast?.('Đã sao chép link Landing Page!', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(code);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${project?.slug || 'event'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.('Đã tải ảnh mã QR xuống máy!', 'success');
  };

  const handleManualSync = async () => {
    if (!project?.id) return;
    setIsSyncing(true);
    const assets = elsRepository.getAssets(project.id);
    await publishProjectToSync(project, assets);
    const remotes = await getRemoteRegistrations(project.id);
    if (Array.isArray(remotes)) {
      remotes.forEach((r) => {
        elsRepository.addExistingRegistration(project.id, r);
      });
      setRegistrations(elsRepository.getRegistrations(project.id));
    }
    setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
    setIsSyncing(false);
    onShowToast?.('Đã đồng bộ lại dữ liệu với máy chủ!', 'success');
  };

  const handleCreateSampleRegistration = () => {
    if (!project?.id) return;
    const sampleNames = ['Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Nam', 'Phạm Quốc Bảo', 'Đỗ Quỳnh Anh'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const sampleEmail = `${randomName.toLowerCase().replace(/\s+/g, '')}${randomNum}@gmail.com`;

    try {
      const newRec = elsRepository.addRegistration(project.id, {
        values: {
          fullName: randomName,
          email: sampleEmail,
          phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
        displayName: randomName,
        identityKey: sampleEmail,
        source: 'preview_mock',
      });
      setRegistrations(elsRepository.getRegistrations(project.id));
      onShowToast?.(`Đã tạo đơn thử nghiệm: ${randomName} (${newRec.code})`, 'success');
    } catch (err) {
      onShowToast?.(`Lỗi tạo đơn mẫu: ${err.message}`, 'error');
    }
  };

  const handleExportCsv = () => {
    if (!project?.id) return;
    try {
      elsRepository.exportToCSV(project.id, project.formFields || []);
      onShowToast?.('Đã xuất danh sách đơn ra file CSV (Excel) thành công!', 'success');
    } catch (err) {
      onShowToast?.(err.message || 'Chưa có đơn đăng ký nào để xuất.', 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingRecord || !project?.id) return;
    elsRepository.deleteRegistration(project.id, deletingRecord.id);
    setRegistrations(elsRepository.getRegistrations(project.id));
    setDeletingRecord(null);
    onShowToast?.(`Đã xóa đơn đăng ký ${deletingRecord.code}.`, 'info');
  };

  return (
    <div className={styles.workspaceContainer}>
      {/* 1. Header Workspace */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconWrapper}>
            <UsersIcon size={24} className={styles.headerIcon} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Đơn đăng ký & Chia sẻ QR</h1>
            <p className={styles.pageSubtitle}>
              Tạo mã QR truy cập trực tiếp cho thiết bị khác và theo dõi số lượng thời gian thực.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Nút Quét QR Check-in */}
          <button
            type="button"
            className={styles.btnPrimaryScan}
            onClick={() => onOpenQrScanner?.()}
            title="Mở máy quét QR kiểm tra vé check-in sự kiện"
          >
            <QrCodeIcon size={16} />
            <span>Quét QR Check-in</span>
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Đồng bộ lại dữ liệu với dev server"
          >
            <RefreshCwIcon size={16} className={isSyncing ? styles.spinIcon : ''} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
          </button>

          {/* Nút Kiểm tra Cloudflare */}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleCheckCloudflare}
            disabled={isCheckingTunnel}
            title="Kiểm tra Cloudflare Tunnel còn hoạt động tốt không"
          >
            <ActivityIcon size={16} className={isCheckingTunnel ? styles.spinIcon : ''} />
            <span>{isCheckingTunnel ? 'Đang kiểm tra...' : 'Kiểm tra Cloudflare'}</span>
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleCreateSampleRegistration}
            title="Tạo nhanh 1 đơn thử nghiệm để kiểm tra giao diện"
          >
            <SparklesIcon size={16} />
            <span>Tạo đơn mẫu</span>
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleExportCsv}
            disabled={registrations.length === 0}
            title="Xuất file CSV mã hóa UTF-8 xem tốt trên Excel"
          >
            <DownloadIcon size={16} />
            <span>Xuất CSV</span>
          </button>
        </div>
      </header>

      {/* 2. KHU VỰC CHIA SẺ MÃ QR TRỰC TIẾP */}
      <section className={styles.shareCard} aria-labelledby="qr-sharing-heading">
        <div className={styles.shareCardHeader}>
          <div className={styles.shareTitleWrap}>
            <h2 id="qr-sharing-heading" className={styles.shareHeading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <QrCodeIcon size={20} />
              <span>Chia sẻ Link & Mã QR Truy cập Trực tiếp</span>
            </h2>
            <div className={styles.liveBadge}>
              <span className={styles.pulseDot} />
              <span>Real-time Live</span>
            </div>
          </div>

          {/* Chế độ chia sẻ: Public Tunnel (Cloudflare) */}
          <div className={styles.modeTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={true}
              className={`${styles.modeTab} ${styles.modeTabActive}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'default' }}
            >
              <GlobeIcon size={14} />
              <span>Public Tunnel (Cloudflare)</span>
            </button>
          </div>
        </div>

        <div className={styles.shareCardBody}>
          {/* Cột trái: Mã QR Code */}
          <div className={styles.qrCol}>
            <div className={styles.qrFrame}>
              {qrDataUrl ? (
                <img
                  ref={qrImageRef}
                  src={qrDataUrl}
                  alt={`Mã QR truy cập ${project?.name}`}
                  className={styles.qrImage}
                />
              ) : (
                <div className={styles.qrPlaceholder}>
                  <RefreshCwIcon size={24} className={styles.spinIcon} />
                  <span>Đang tạo mã QR...</span>
                </div>
              )}
            </div>

            <div className={styles.qrActions}>
              <button
                type="button"
                className={styles.qrBtn}
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
              >
                <DownloadIcon size={15} />
                <span>Tải PNG</span>
              </button>
              <button
                type="button"
                className={`${styles.qrBtn} ${copiedLink ? styles.qrBtnSuccess : ''}`}
                onClick={handleCopyLink}
              >
                {copiedLink ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                <span>{copiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>
            </div>
          </div>

          {/* Cột phải: Thông tin URL & Quản lý Cloudflare */}
          <div className={styles.infoCol}>
            {/* Input đường dẫn hiện tại */}
            <div className={styles.urlInputBox}>
              <label htmlFor="active-share-url" className={styles.inputLabel}>
                Đường dẫn truy cập cho thiết bị khác:
              </label>
              <div className={styles.urlBar}>
                <input
                  id="active-share-url"
                  type="text"
                  readOnly
                  value={activeUrl}
                  className={styles.urlInput}
                />
                <button
                  type="button"
                  className={styles.btnCopyUrl}
                  onClick={handleCopyLink}
                  title="Sao chép đường dẫn"
                >
                  {copiedLink ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                </button>
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnOpenUrl}
                  title="Mở trong tab mới"
                >
                  <ExternalLinkIcon size={16} />
                </a>
              </div>
            </div>

            {/* Cấu hình Cloudflare Tunnel */}
            <div className={styles.tunnelInputBox}>
              <div className={styles.tunnelControls}>
                {customTunnelUrl ? (
                  <>
                    <div className={styles.tunnelStatusActive}>
                      <span className={styles.pulseDot} />
                      <span>Cloudflare Tunnel đang hoạt động</span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnCheckTunnel}
                      onClick={handleCheckCloudflare}
                      disabled={isCheckingTunnel}
                      title="Kiểm tra tín hiệu phản hồi và đo độ trễ Cloudflare"
                    >
                      <ActivityIcon size={14} className={isCheckingTunnel ? styles.spinIcon : ''} />
                      <span>{isCheckingTunnel ? 'Đang kiểm tra...' : 'Kiểm tra Cloudflare'}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.btnCheckTunnel}
                      onClick={handleRestartTunnel}
                      disabled={isStartingTunnel}
                      title="Khởi động lại tiến trình Cloudflare Tunnel"
                    >
                      <RefreshCwIcon size={14} className={isStartingTunnel ? styles.spinIcon : ''} />
                      <span>Khởi động lại</span>
                    </button>
                    <button
                      type="button"
                      className={styles.btnStopTunnel}
                      onClick={handleStopTunnel}
                    >
                      Dừng Tunnel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.btnStartTunnel}
                      onClick={handleStartTunnel}
                      disabled={isStartingTunnel}
                    >
                      {isStartingTunnel ? (
                        <>
                          <RefreshCwIcon size={14} className={styles.spinIcon} />
                          <span>Đang kết nối Cloudflare...</span>
                        </>
                      ) : (
                        <>
                          <GlobeIcon size={14} />
                          <span>Khởi động Cloudflare Tunnel (1 Click)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.btnCheckTunnel}
                      onClick={handleCheckCloudflare}
                      disabled={isCheckingTunnel}
                      title="Kiểm tra Cloudflare Tunnel có đang chạy trên máy chủ không"
                    >
                      <ActivityIcon size={14} className={isCheckingTunnel ? styles.spinIcon : ''} />
                      <span>{isCheckingTunnel ? 'Đang kiểm tra...' : 'Kiểm tra Cloudflare'}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Banner kết quả kiểm tra Cloudflare */}
              {tunnelHealthResult && (
                <div
                  className={tunnelHealthResult.ok ? styles.tunnelHealthOk : styles.tunnelHealthWarn}
                  role="status"
                >
                  <div className={styles.tunnelHealthIconWrap}>
                    {tunnelHealthResult.ok ? <WifiIcon size={18} /> : <ActivityIcon size={18} />}
                  </div>
                  <div className={styles.tunnelHealthContent}>
                    <div className={styles.tunnelHealthTitleRow}>
                      <strong>{tunnelHealthResult.ok ? 'Cloudflare đang hoạt động bình thường' : 'Cloudflare phản hồi chậm hoặc bị chặn'}</strong>
                      {tunnelHealthResult.latency > 0 && (
                        <span className={styles.latencyBadge}>{tunnelHealthResult.latency} ms</span>
                      )}
                    </div>
                    <p className={styles.tunnelHealthMsg}>{tunnelHealthResult.message}</p>
                    <span className={styles.tunnelHealthTime}>Đã kiểm tra lúc: {tunnelHealthResult.checkedAt}</span>
                  </div>
                </div>
              )}

              {tunnelError && (
                <div className={styles.tunnelError}>
                  {tunnelError}
                </div>
              )}

              <span className={styles.subLabel}>Đường dẫn Cloudflare Tunnel (tự động cập nhật hoặc dán link thủ công):</span>
              <input
                type="url"
                placeholder="https://random-words.trycloudflare.com"
                value={customTunnelUrl}
                onChange={(e) => setCustomTunnelUrl(e.target.value)}
                className={styles.tunnelInput}
              />
              <p className={styles.hintText} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <LightbulbIcon size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  Đã bật <code>server.allowedHosts: true</code>. Thiết bị từ mọi nơi (kể cả mạng 4G/5G) đều quét mã QR vào thẳng form đăng ký mà không bị chặn.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BẢNG SỐ LIỆU THỜI GIAN THỰC (REAL-TIME METRICS) */}
      <section className={styles.statsSection} aria-label="Thống kê số lượng đăng ký">
        <div className={styles.statCardsGrid}>
          {/* Card 1: Tổng số đơn */}
          <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Tổng đơn đăng ký</span>
              <span className={styles.liveTag}>
                <span className={styles.pulseDot} />
                LIVE
              </span>
            </div>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statDesc}>
              {stats.total > 0 ? 'Dữ liệu đã đồng bộ an toàn' : 'Đang chờ lượt đăng ký đầu tiên'}
            </div>
          </div>

          {/* Card 2: Đơn hôm nay */}
          <div className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Ghi nhận hôm nay</span>
              <span className={styles.badgeNew}>Hôm nay</span>
            </div>
            <div className={styles.statNumber}>{stats.todayCount}</div>
            <div className={styles.statDesc}>Cập nhật theo múi giờ GMT+7</div>
          </div>

          {/* Card 3: Đơn mới nhất */}
          <div className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Đơn mới nhất</span>
              <ClockIcon size={16} className={styles.statIcon} />
            </div>
            <div className={styles.statNumberSmall}>
              {stats.latest ? stats.latest.displayName : '—'}
            </div>
            <div className={styles.statDesc}>
              {stats.latest ? `Mã: ${stats.latest.code}` : 'Chưa có dữ liệu'}
            </div>
          </div>

          {/* Card 4: Trạng thái kết nối */}
          <div className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Trạng thái kết nối</span>
              <span className={styles.statusDotGreen} />
            </div>
            <div className={styles.statNumberSmall} style={{ color: '#16a34a' }}>
              Trực tuyến
            </div>
            <div className={styles.statDesc}>Đồng bộ lúc: {lastSyncTime}</div>
          </div>

          {/* Card 5: Thống kê Check-in vé sự kiện */}
          <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Đã Check-in vé</span>
              <span className={styles.badgeNew}>{stats.checkInRate}%</span>
            </div>
            <div className={styles.statNumber} style={{ color: '#059669' }}>
              {stats.checkedInCount} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {stats.total}</span>
            </div>
            <div className={styles.statDesc}>
              {stats.checkedInCount === stats.total && stats.total > 0
                ? 'Đã check-in đủ 100%'
                : `Còn ${stats.total - stats.checkedInCount} vé chưa quét`}
            </div>
          </div>
        </div>
      </section>

      {/* 4. DANH SÁCH CHI TIẾT ĐƠN ĐĂNG KÝ */}
      <section className={styles.tableSection} aria-labelledby="registrations-list-heading">
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderLeft}>
            <h3 id="registrations-list-heading" className={styles.tableTitle}>
              Danh sách Người tham gia ({filteredRegistrations.length})
            </h3>
          </div>

          <div className={styles.tableControls}>
            {/* Bộ lọc trạng thái check-in */}
            <select
              value={checkInFilter}
              onChange={(e) => setCheckInFilter(e.target.value)}
              className={styles.sortSelect}
              aria-label="Lọc theo trạng thái check-in"
            >
              <option value="all">Tất cả ({registrations.length})</option>
              <option value="checked_in">Đã Check-in ({stats.checkedInCount})</option>
              <option value="pending">Chưa Check-in ({registrations.length - stats.checkedInCount})</option>
            </select>

            {/* Thanh tìm kiếm */}
            <div className={styles.searchBox}>
              <SearchIcon size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm theo tên, email, mã vé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.btnClearSearch}
                  aria-label="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>

            {/* Bộ lọc sắp xếp */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
              aria-label="Sắp xếp danh sách"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="az">Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        {filteredRegistrations.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Mã đăng ký</th>
                  <th>Họ và tên</th>
                  <th>Thông tin liên hệ</th>
                  <th>Trạng thái Check-in</th>
                  <th>Thời gian</th>
                  <th>Nguồn</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((rec) => {
                  const dateStr = rec.createdAt
                    ? new Date(rec.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })
                    : '—';

                  const isJustCopied = copiedCodeId === rec.code;

                  return (
                    <tr key={rec.id} className={styles.tableRow}>
                      <td>
                        <button
                          type="button"
                          className={`${styles.codeBadge} ${isJustCopied ? styles.codeBadgeCopied : ''}`}
                          onClick={() => handleCopyCode(rec.code)}
                          title="Nhấp để sao chép mã"
                        >
                          <span>{rec.code}</span>
                          {isJustCopied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                        </button>
                      </td>
                      <td className={styles.nameCell}>
                        <strong>{rec.displayName}</strong>
                      </td>
                      <td>
                        <div className={styles.contactCell}>
                          {rec.identityKey && <span>{rec.identityKey}</span>}
                          {rec.values?.phone && (
                            <span className={styles.phoneSub}>{rec.values.phone}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {rec.checkedIn ? (
                          <button
                            type="button"
                            className={styles.checkInTagYes}
                            onClick={() => handleToggleCheckIn(rec.id)}
                            title={`Đã check-in lúc ${new Date(rec.checkInTime).toLocaleString('vi-VN')}. Bấm để hủy check-in nếu cần.`}
                          >
                            <CheckIcon size={12} />
                            <span>Đã check-in ({new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.checkInTagNo}
                            onClick={() => handleToggleCheckIn(rec.id)}
                            title="Bấm để đánh dấu check-in thủ công cho người này"
                          >
                            <QrCodeIcon size={12} />
                            <span>Chưa check-in</span>
                          </button>
                        )}
                      </td>
                      <td className={styles.timeCell}>{dateStr}</td>
                      <td>
                        <span
                          className={`${styles.sourceBadge} ${rec.source === 'preview_mock' ? styles.sourceBadgeMock : styles.sourceBadgeLive
                            }`}
                        >
                          {rec.source === 'preview_mock' ? 'Thử nghiệm' : 'Landing Page'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={styles.btnDeleteRow}
                          onClick={() => setDeletingRecord(rec)}
                          title="Xóa đơn đăng ký này"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrap}>
              <UsersIcon size={36} />
            </div>
            <h4 className={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đơn đăng ký nào'}
            </h4>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? 'Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                : 'Quét mã QR ở trên bằng điện thoại để đăng ký hoặc bấm "Tạo đơn mẫu" để kiểm tra tính năng.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleCreateSampleRegistration}
              >
                <SparklesIcon size={16} />
                <span>Tạo 1 đơn mẫu ngay</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmDialog
        isOpen={Boolean(deletingRecord)}
        title="Xóa đơn đăng ký"
        message={`Bạn có chắc chắn muốn xóa đơn đăng ký của "${deletingRecord?.displayName}" (${deletingRecord?.code})? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa đơn"
        cancelLabel="Hủy"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingRecord(null)}
      />
    </div>
  );
}
export default WorkspaceRegistrations;
