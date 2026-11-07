/**
 * @file useHashRoute.js
 * Hash router nhẹ cho Event Landing Studio, tương thích static hosting và không cần backend
 *
 * Hỗ trợ các mẫu URL:
 * - #/                     -> Trang 1: Chào mừng & Quản lý dự án
 * - #/p/:projectId/:ws     -> Trang 2: Không gian làm việc dự án (:ws = info | form | landing | registrations)
 * - #/e/:slug              -> Trang landing công khai cho người tham dự
 */

import { useState, useEffect, useCallback } from 'react';

export function parseHash(hashString) {
  let hash = hashString || (typeof window !== 'undefined' ? window.location.hash : '');
  let clean = hash.replace(/^#\/?/, '').trim();

  // Nếu không có hash, kiểm tra pathname (hỗ trợ mở trực tiếp link /e/:slug mà trình duyệt hoặc app chat vô tình bỏ dấu #)
  if (!clean && typeof window !== 'undefined' && window.location.pathname) {
    clean = window.location.pathname.replace(/^\//, '').trim();
  }

  if (!clean) {
    return { page: 'home', params: {} };
  }

  const parts = clean.split('/').filter(Boolean);

  // #/p/:projectId/:workspace? hoặc /p/:projectId/:workspace?
  if (parts[0] === 'p' && parts[1]) {
    return {
      page: 'studio',
      projectId: parts[1],
      workspace: parts[2] || 'info', // 'info' | 'form' | 'landing' | 'registrations'
    };
  }

  // #/e/:slug hoặc /e/:slug
  if (parts[0] === 'e' && parts[1]) {
    return {
      page: 'public',
      slug: parts[1],
    };
  }

  return { page: 'home', params: {} };
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((hash) => {
    const target = hash.startsWith('#') ? hash : `#/${hash.replace(/^\//, '')}`;
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
    setRoute(parseHash(target));
  }, []);

  return { route, navigate };
}

