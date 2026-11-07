import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import styles from './LandingView.module.css';
import { calculateCountdown } from '../../domain/time.js';
import { validateRegistrationSubmission } from '../../domain/validators.js';
import { elsRepository } from '../../services/elsRepository.js';
import { downloadIcsFile } from '../../domain/calendar.js';
import { createPresetModuleTree } from '../../domain/moduleSchema.js';
import { ModuleRenderer } from '../studio/devmode/ModuleRenderer.jsx';
import { submitRegistrationToSync } from '../../services/realtimeSync.js';
import { fireDoubleConfetti } from '../../lib/confetti.js';
import { copyToClipboard } from '../../lib/clipboard.js';

export function LandingView({
  project,
  assets = [],
  isInteractive = true,
  source = 'landing', // 'landing' | 'preview'
  deviceMode = 'laptop', // 'laptop' | 'phone'
  onRegistrationSuccess,
}) {
  const event = project.event || {};
  const ai = project.ai || {};
  const formFields = project.formFields || [];

  // Countdown state
  const targetIso = event.eventDate && event.eventTime
    ? `${event.eventDate}T${event.eventTime}:00+07:00`
    : null;

  const [countdown, setCountdown] = useState(() =>
    targetIso ? calculateCountdown(targetIso) : { isPast: false, d: 0, h: 0, m: 0, s: 0 }
  );

  useEffect(() => {
    if (!targetIso) return;
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetIso));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  // Realtime registration count
  const [regCount, setRegCount] = useState(() => elsRepository.getRegistrationCount(project.id));

  useEffect(() => {
    const unsub = elsRepository.subscribe((ev) => {
      if (ev.projectId === project.id || (ev.key && ev.key.includes(project.id))) {
        setRegCount(elsRepository.getRegistrationCount(project.id));
      }
    });
    return () => unsub();
  }, [project.id]);

  // Form registration state
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessRecord, setSubmitSuccessRecord] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [ticketQrUrl, setTicketQrUrl] = useState('');

  const description =
    ai.description ||
    'Chào mừng bạn đến với sự kiện đặc biệt! Hãy đăng ký ngay hôm nay để nhận những quyền lợi và nội dung giá trị nhất.';

  const handleInputChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting || !isInteractive) return;

    const existing = elsRepository.getRegistrations(project.id);
    const validation = validateRegistrationSubmission(
      formValues,
      formFields,
      existing,
      countdown.isPast,
      event.capacity
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const newRecord = elsRepository.addRegistration(project.id, {
        values: formValues,
        displayName: validation.displayName,
        identityKey: validation.identityKey,
        source,
      });

      // Đồng bộ thời gian thực tới dev server (nếu có kết nối mạng)
      submitRegistrationToSync(project.id, newRecord).catch(() => { });

      // Tự động tạo ảnh mã QR vé
      if (newRecord.code) {
        QRCode.toDataURL(newRecord.code, {
          width: 320,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        })
          .then((url) => {
            setTicketQrUrl(url);
            // Bắn pháo hoa giấy chúc mừng rực rỡ khi QR vé xuất hiện
            fireDoubleConfetti();
          })
          .catch((err) => {
            console.error(err);
            fireDoubleConfetti();
          });
      } else {
        fireDoubleConfetti();
      }

      setSubmitSuccessRecord(newRecord);
      setRegCount(elsRepository.getRegistrationCount(project.id));
      onRegistrationSuccess?.(newRecord);
    } catch (err) {
      setFormErrors({ general: err.message || 'Lỗi khi gửi đơn đăng ký.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!submitSuccessRecord?.code) return;
    const ok = await copyToClipboard(submitSuccessRecord.code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadCalendar = () => {
    downloadIcsFile({
      name: event.eventName || project.name,
      startAt: targetIso,
      location: event.venue,
      content: { description },
    });
  };

  // Tải xuống vé tham dự định dạng ảnh PNG chứa mã QR và thông tin sự kiện
  const handleDownloadQrTicket = () => {
    if (!submitSuccessRecord?.code || !ticketQrUrl) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');

      // Nền gradient công nghệ sang trọng
      const grad = ctx.createLinearGradient(0, 0, 0, 760);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 760);

      // Thẻ vé trắng ở giữa
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(40, 40, 520, 680, 24);
      ctx.fill();

      // Dải màu thương hiệu trên đầu thẻ
      const barGrad = ctx.createLinearGradient(40, 40, 560, 40);
      barGrad.addColorStop(0, '#4f46e5');
      barGrad.addColorStop(1, '#7c3aed');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(40, 40, 520, 90, [24, 24, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VÉ CHECK-IN SỰ KIỆN', 300, 95);

      // Tên sự kiện
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      const eventName = event.eventName || project.name || 'Sự kiện';
      ctx.fillText(eventName.slice(0, 40), 300, 170);

      // Người tham dự
      ctx.fillStyle = '#475569';
      ctx.font = '15px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Người tham dự: ${submitSuccessRecord.displayName}`, 300, 205);

      // Thời gian & Địa điểm
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      const venueText = (event.venue || 'Địa điểm tổ chức').slice(0, 45);
      ctx.fillText(`${event.eventDate || ''} ${event.eventTime || ''} • ${venueText}`, 300, 235);

      // Vẽ mã QR
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 160, 260, 280, 280);

        // Khung mã vé monospace
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(150, 565, 300, 52, 10);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#4f46e5';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(submitSuccessRecord.code, 300, 600);

        // Ghi chú chân vé
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px system-ui, -apple-system, sans-serif';
        ctx.fillText('Xuất trình mã QR này tại quầy đón tiếp để check-in', 300, 665);

        // Kích hoạt tải về
        const link = document.createElement('a');
        link.download = `ve-checkin-${submitSuccessRecord.code}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      qrImg.onerror = () => {
        // Fallback tải trực tiếp ảnh QR
        const link = document.createElement('a');
        link.download = `qr-code-${submitSuccessRecord.code}.png`;
        link.href = ticketQrUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      qrImg.src = ticketQrUrl;
    } catch {
      const link = document.createElement('a');
      link.download = `qr-code-${submitSuccessRecord.code}.png`;
      link.href = ticketQrUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formProps = {
    formValues,
    formErrors,
    isSubmitting,
    submitSuccessRecord,
    copiedCode,
    ticketQrUrl,
    onInputChange: handleInputChange,
    onSubmit: handleSubmit,
    onCopyCode: handleCopyCode,
    onDownloadCalendar: handleDownloadCalendar,
    onDownloadQr: handleDownloadQrTicket,
    onResetSuccess: () => {
      setSubmitSuccessRecord(null);
      setTicketQrUrl('');
    },
  };

  // Áp dụng các bố cục trong module dev mode vào Landing Page
  const moduleTree = useMemo(() => {
    if (Array.isArray(project.moduleLayout) && project.moduleLayout.length > 0) {
      return project.moduleLayout;
    }
    return createPresetModuleTree(project.modulePreset || 'workshop');
  }, [project.moduleLayout, project.modulePreset]);

  const hasStickyCta = useMemo(() => {
    return moduleTree.some((m) => m.type === 'sticky_cta' && !m.hidden);
  }, [moduleTree]);

  return (
    <div
      className={`${styles.landingWrapper} ${deviceMode === 'phone' ? 'phone-device-preview' : ''}`}
      data-device={deviceMode}
      style={hasStickyCta ? { paddingBottom: '92px' } : undefined}
    >
      {moduleTree.map((m, index) => (
        <ModuleRenderer
          key={m.id}
          module={m}
          index={index}
          themeColor={project.colorTheme || 'purple'}
          isAlternating={project.alternatingBg !== false}
          eventData={event}
          aiData={ai}
          formFields={formFields}
          assets={assets}
          regCount={regCount}
          externalCountdown={countdown}
          isInteractive={isInteractive}
          isDevMode={false}
          formProps={formProps}
        />
      ))}
    </div>
  );
}
