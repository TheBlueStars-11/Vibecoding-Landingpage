/**
 * @file confetti.js
 * Hiệu ứng pháo hoa giấy sắc màu (Celebration Confetti) bắn chúc mừng khi đăng ký thành công
 * Chạy mượt mà trên Canvas 60fps, tương thích điện thoại & máy tính, tự động dọn dẹp bộ nhớ.
 */

export function fireCelebrationConfetti(options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  // Tôn trọng cài đặt giảm chuyển động của người dùng
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  const {
    particleCount = 100,
    durationMs = 3200,
    originY = 0.55,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    return () => {};
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = (window.innerWidth || 1280) * dpr;
  canvas.height = (window.innerHeight || 800) * dpr;

  const colors = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f59e0b', // Amber / Gold
    '#10b981', // Emerald
    '#3b82f6', // Bright Blue
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
  ];

  const particles = [];
  const startX = canvas.width / 2;
  const startY = canvas.height * originY;

  for (let i = 0; i < particleCount; i++) {
    // Góc phóng lan tỏa rộng hướng lên trên (từ 200° đến 340°)
    const angle = (Math.PI / 180) * (200 + Math.random() * 140);
    const speed = (6 + Math.random() * 15) * dpr;
    const size = (6 + Math.random() * 8) * dpr;

    particles.push({
      x: startX + (Math.random() - 0.5) * 80 * dpr,
      y: startY,
      vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.4),
      vy: Math.sin(angle) * speed,
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.06 + Math.random() * 0.08,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : (Math.random() > 0.5 ? 'circle' : 'diamond'),
      drag: 0.965,
      gravity: 0.35 * dpr,
    });
  }

  const startTime = performance.now();
  let animationId = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (animationId) cancelAnimationFrame(animationId);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };

  function render(now) {
    if (isCleanedUp) return;

    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;

      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      // Làm mờ dần ở 35% thời gian cuối
      if (progress > 0.65) {
        p.opacity = Math.max(0, 1 - (progress - 0.65) / 0.35);
      }

      if (p.opacity > 0.01 && p.y < canvas.height + 60) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.sin(p.wobble), 1);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Hình thoi lấp lánh (Diamond)
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2.5, 0);
          ctx.lineTo(0, p.size / 2);
          ctx.lineTo(-p.size / 2.5, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
    }

    if (activeCount > 0 && progress < 1) {
      animationId = requestAnimationFrame(render);
    } else {
      cleanup();
    }
  }

  animationId = requestAnimationFrame(render);

  // Bộ hẹn giờ dự phòng tuyệt đối chống rò rỉ bộ nhớ
  const fallbackTimer = setTimeout(cleanup, durationMs + 500);

  return () => {
    clearTimeout(fallbackTimer);
    cleanup();
  };
}

/**
 * Bắn pháo hoa giấy 2 đợt (Double celebratory burst) chúc mừng rực rỡ
 */
export function fireDoubleConfetti() {
  fireCelebrationConfetti({ particleCount: 90, originY: 0.6 });
  setTimeout(() => {
    fireCelebrationConfetti({ particleCount: 70, originY: 0.55 });
  }, 240);
}

