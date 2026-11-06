import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import styles from './QrCheckInModal.module.css';
import { elsRepository } from '../../services/elsRepository.js';
import {
  QrCodeIcon,
  CloseIcon,
  CheckIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  CameraIcon,
  UploadIcon,
  Volume2Icon,
  VolumeXIcon,
} from '../ui/Icons.jsx';

/**
 * Phát âm thanh phản hồi sinh trực tiếp qua Web Audio API không cần tệp ngoài
 */
function playBeep(type = 'success', enabled = true) {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'valid') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'already_used') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {}
}

export function QrCheckInModal({ isOpen, onClose, project, onShowToast }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [currentResult, setCurrentResult] = useState(null); // { status, record, cleanCode, message, time }

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastScannedCodeRef = useRef(null);
  const cooldownTimeoutRef = useRef(null);

  // Thống kê check-in thời gian thực
  const [registrations, setRegistrations] = useState(() => {
    return project?.id ? elsRepository.getRegistrations(project.id) : [];
  });

  useEffect(() => {
    if (!project?.id) return;
    const unsub = elsRepository.subscribe((ev) => {
      if (ev.projectId === project.id) {
        setRegistrations(elsRepository.getRegistrations(project.id));
      }
    });
    return unsub;
  }, [project]);

  const stats = {
    total: registrations.length,
    checkedIn: registrations.filter((r) => r.checkedIn).length,
  };
  const checkInRate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  // Xử lý kết quả quét mã vé
  const handleProcessCode = useCallback(
    (codeStr) => {
      if (!codeStr || !project?.id) return;
      const res = elsRepository.checkInByCode(project.id, codeStr);

      const scanEntry = {
        id: Date.now() + Math.random().toString(36).slice(2, 6),
        status: res.status,
        code: res.cleanCode || codeStr,
        record: res.record,
        message: res.message,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setCurrentResult(scanEntry);
      setRecentScans((prev) => [scanEntry, ...prev.slice(0, 7)]);
      playBeep(res.status, soundEnabled);
      setRegistrations(elsRepository.getRegistrations(project.id));

      if (res.status === 'valid') {
        onShowToast?.(`Mã hợp lệ! Đã check-in: ${res.record?.displayName || res.cleanCode}`, 'success');
      } else if (res.status === 'already_used') {
        onShowToast?.(`Cảnh báo: Mã đã sử dụng (${res.cleanCode})`, 'warning');
      } else {
        onShowToast?.(`Mã không hợp lệ: ${res.cleanCode}`, 'error');
      }
    },
    [project, soundEnabled, onShowToast]
  );

  // Dừng luồng camera an toàn
  const stopCameraStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Khởi động luồng camera khi mở tab Camera
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraStream();
      return;
    }

    let isCancelled = false;

    const startCamera = async () => {
      stopCameraStream();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!isCancelled) setCameraError('Trình duyệt của bạn không hỗ trợ truy cập máy ảnh trực tiếp.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          if (!isCancelled) {
            setCameraError(null);
            setIsScanning(true);
          }
        }
      } catch (err) {
        if (isCancelled) return;
        console.warn('Không thể mở camera:', err);
        let errMsg = 'Không thể kết nối với máy ảnh.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsg = 'Vui lòng cấp quyền truy cập máy ảnh trong cài đặt trình duyệt để quét QR.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errMsg = 'Không tìm thấy máy ảnh trên thiết bị này. Bạn có thể tải ảnh QR hoặc nhập mã vé thủ công.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errMsg = 'Máy ảnh đang bị ứng dụng khác sử dụng.';
        }
        setCameraError(errMsg);
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      stopCameraStream();
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    };
  }, [isOpen, activeTab, cameraFacing, stopCameraStream]);

  // Vòng lặp giải mã QR từ video qua jsQR
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera' || !isScanning) return;

    let animId = null;

    function step() {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim()) {
            const found = code.data.trim();
            if (found !== lastScannedCodeRef.current) {
              lastScannedCodeRef.current = found;
              setIsScanning(false);
              handleProcessCode(found);

              if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
              cooldownTimeoutRef.current = setTimeout(() => {
                lastScannedCodeRef.current = null;
                setIsScanning(true);
              }, 3000);
              return;
            }
          }
        } catch {}
      }

      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, activeTab, isScanning, handleProcessCode]);

  // Giải mã QR từ tệp ảnh người dùng upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleProcessCode(code.data);
        } else {
          onShowToast?.('Không tìm thấy mã QR hợp lệ trong ảnh tải lên.', 'error');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Check-in qua form nhập mã thủ công
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode.trim());
    setManualCode('');
  };

  // Nút quét tiếp
  const handleResumeScan = () => {
    setCurrentResult(null);
    lastScannedCodeRef.current = null;
    setIsScanning(true);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="qr-scan-title">
      <div className={styles.modalBox}>
        {/* Header Modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.iconCircle}>
              <QrCodeIcon size={20} />
            </div>
            <div>
              <h2 id="qr-scan-title" className={styles.modalTitle}>
                Quét QR Check-in Vé Sự Kiện
              </h2>
              <p className={styles.modalSub}>{project?.name || 'Sự kiện'}</p>
            </div>
          </div>

          <div className={styles.headerRightActions}>
            <button
              type="button"
              className={styles.btnSound}
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? 'Tắt âm thanh thông báo' : 'Bật âm thanh thông báo'}
            >
              {soundEnabled ? <Volume2Icon size={16} /> : <VolumeXIcon size={16} />}
            </button>
            <button
              type="button"
              className={styles.btnClose}
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              title="Đóng cửa sổ quét"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Thanh Thống kê Nhanh */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Tổng vé đăng ký:</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Đã Check-in:</span>
            <span className={`${styles.statValue} ${styles.statGreen}`}>
              {stats.checkedIn} ({checkInRate}%)
            </span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Chưa tới:</span>
            <span className={styles.statValue}>{stats.total - stats.checkedIn}</span>
          </div>
        </div>

        {/* Tab chuyển đổi chế độ */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'camera' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            <CameraIcon size={15} />
            <span>Camera trực tiếp</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'upload' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadIcon size={15} />
            <span>Tải ảnh QR</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <QrCodeIcon size={15} />
            <span>Nhập mã vé</span>
          </button>
        </div>

        {/* Nội dung theo Tab */}
        <div className={styles.tabBody}>
          {activeTab === 'camera' && (
            <div className={styles.cameraContainer}>
              {cameraError ? (
                <div className={styles.cameraErrorBox}>
                  <AlertCircleIcon size={36} className={styles.cameraErrorIcon} />
                  <p className={styles.cameraErrorText}>{cameraError}</p>
                  <button type="button" className={styles.btnRetryCamera} onClick={startCameraStream}>
                    <RefreshCwIcon size={14} /> Thử kết nối lại
                  </button>
                </div>
              ) : (
                <div className={styles.videoWrapper}>
                  <video ref={videoRef} className={styles.cameraVideo} playsInline muted autoPlay />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Khung ngắm quét QR Reticle */}
                  <div className={styles.scannerReticle}>
                    <div className={`${styles.corner} ${styles.topLeft}`} />
                    <div className={`${styles.corner} ${styles.topRight}`} />
                    <div className={`${styles.corner} ${styles.bottomLeft}`} />
                    <div className={`${styles.corner} ${styles.bottomRight}`} />
                    {isScanning && <div className={styles.laserLine} />}
                  </div>

                  <div className={styles.cameraControlsOverlay}>
                    <button
                      type="button"
                      className={styles.btnFlipCam}
                      onClick={() => setCameraFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
                      title="Đổi camera trước / sau"
                    >
                      <RefreshCwIcon size={14} />
                      <span>{cameraFacing === 'environment' ? 'Cam sau' : 'Cam trước'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className={styles.uploadContainer}>
              <label className={styles.uploadDropZone}>
                <input type="file" accept="image/*" onChange={handleFileUpload} className={styles.hiddenFileInput} />
                <UploadIcon size={36} className={styles.uploadIcon} />
                <span className={styles.uploadTitle}>Chọn hoặc kéo thả ảnh chứa mã QR vào đây</span>
                <span className={styles.uploadHint}>Hỗ trợ ảnh JPG, PNG, WEBP chụp từ điện thoại</span>
              </label>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className={styles.manualForm}>
              <label htmlFor="ticket-code-input" className={styles.manualLabel}>
                Nhập mã đăng ký vé (VD: DK-ABC123):
              </label>
              <div className={styles.manualInputRow}>
                <input
                  id="ticket-code-input"
                  type="text"
                  className={styles.manualInput}
                  placeholder="DK-XXXXXX..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
                <button type="submit" className={styles.btnManualCheck} disabled={!manualCode.trim()}>
                  Kiểm tra vé
                </button>
              </div>
            </form>
          )}

          {/* BANNER HIỂN THỊ KẾT QUẢ QUÉT */}
          {currentResult && (
            <div
              className={`${styles.resultBanner} ${
                currentResult.status === 'valid'
                  ? styles.resultValid
                  : currentResult.status === 'already_used'
                  ? styles.resultAlreadyUsed
                  : styles.resultInvalid
              }`}
            >
              <div className={styles.resultHeader}>
                <div className={styles.resultIcon}>
                  {currentResult.status === 'valid' ? (
                    <CheckIcon size={24} />
                  ) : (
                    <AlertCircleIcon size={24} />
                  )}
                </div>
                <div className={styles.resultHeaderInfo}>
                  <span className={styles.resultStatusBadge}>
                    {currentResult.status === 'valid' && 'MÃ HỢP LỆ — CHECK-IN THÀNH CÔNG'}
                    {currentResult.status === 'already_used' && 'CẢNH BÁO: MÃ ĐÃ SỬ DỤNG'}
                    {currentResult.status === 'invalid' && 'LỖI: MÃ KHÔNG HỢP LỆ'}
                  </span>
                  <span className={styles.resultTime}>Lúc {currentResult.time}</span>
                </div>
              </div>

              <div className={styles.resultDetails}>
                {currentResult.record ? (
                  <>
                    <div className={styles.resultAttendeeName}>
                      {currentResult.record.displayName || 'Người tham dự'}
                    </div>
                    <div className={styles.resultMetaRow}>
                      <span className={styles.resultCodeMonospace}>Mã: {currentResult.code}</span>
                      {currentResult.record.identityKey && (
                        <span className={styles.resultIdentity}>{currentResult.record.identityKey}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={styles.resultMetaRow}>
                    <span className={styles.resultCodeMonospace}>Mã quét: {currentResult.code}</span>
                  </div>
                )}
                <p className={styles.resultMessage}>{currentResult.message}</p>
              </div>

              <div className={styles.resultActions}>
                <button type="button" className={styles.btnNextScan} onClick={handleResumeScan}>
                  Quét vé tiếp theo
                </button>
              </div>
            </div>
          )}

          {/* LỊCH SỬ CÁC LẦN QUÉT VỪA QUA */}
          {recentScans.length > 0 && (
            <div className={styles.recentSection}>
              <div className={styles.recentTitleRow}>
                <span className={styles.recentTitle}>Lịch sử quét vừa qua ({recentScans.length})</span>
                <button type="button" className={styles.btnClearRecent} onClick={() => setRecentScans([])}>
                  Xóa lịch sử
                </button>
              </div>
              <div className={styles.recentList}>
                {recentScans.map((item) => (
                  <div key={item.id} className={styles.recentItem}>
                    <span
                      className={`${styles.recentBadge} ${
                        item.status === 'valid'
                          ? styles.badgeValid
                          : item.status === 'already_used'
                          ? styles.badgeUsed
                          : styles.badgeInvalid
                      }`}
                    >
                      {item.status === 'valid' ? 'Hợp lệ' : item.status === 'already_used' ? 'Đã dùng' : 'Không hợp lệ'}
                    </span>
                    <span className={styles.recentName}>
                      {item.record?.displayName || item.code}
                    </span>
                    <span className={styles.recentCode}>{item.code}</span>
                    <span className={styles.recentTime}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
