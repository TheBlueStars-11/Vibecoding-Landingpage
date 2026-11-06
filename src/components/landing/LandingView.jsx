import React, { useState, useEffect, useMemo } from 'react';
import styles from './LandingView.module.css';
import { calculateCountdown } from '../../domain/time.js';
import { validateRegistrationSubmission } from '../../domain/validators.js';
import { elsRepository } from '../../services/elsRepository.js';
import { downloadIcsFile } from '../../domain/calendar.js';
import { createPresetModuleTree } from '../../domain/moduleSchema.js';
import { ModuleRenderer } from '../studio/devmode/ModuleRenderer.jsx';
import { submitRegistrationToSync } from '../../services/realtimeSync.js';

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
      submitRegistrationToSync(project.id, newRecord).catch(() => {});

      setSubmitSuccessRecord(newRecord);
      setRegCount(elsRepository.getRegistrationCount(project.id));
      onRegistrationSuccess?.(newRecord);
    } catch (err) {
      setFormErrors({ general: err.message || 'Lỗi khi gửi đơn đăng ký.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!submitSuccessRecord?.code) return;
    navigator.clipboard.writeText(submitSuccessRecord.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCalendar = () => {
    downloadIcsFile({
      name: event.eventName || project.name,
      startAt: targetIso,
      location: event.venue,
      content: { description },
    });
  };

  const formProps = {
    formValues,
    formErrors,
    isSubmitting,
    submitSuccessRecord,
    copiedCode,
    onInputChange: handleInputChange,
    onSubmit: handleSubmit,
    onCopyCode: handleCopyCode,
    onDownloadCalendar: handleDownloadCalendar,
    onResetSuccess: () => setSubmitSuccessRecord(null),
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
