/**
 * @file moduleAuditor.js
 * Công cụ kiểm tra tự động & Quét mọi kích thước (Responsive Scan)
 * theo yêu cầu Mục 10 (yeu-cau-chuc-nang-module-design-dev-mode.md)
 */

import { MANDATORY_MODULE_TYPES } from './moduleSchema.js';

export const AUDIT_LEVELS = {
  ERROR: 'error',
  WARNING: 'warning',
  SUGGESTION: 'suggestion',
};

/**
 * Kiểm tra danh sách modules ở một độ rộng cụ thể
 */
export function auditModuleLayout(modules = [], eventData = {}, assets = [], width = 1280) {
  const issues = [];
  const activeModules = modules.filter((m) => !m.hidden);

  // 1. Kiểm tra khu vực bắt buộc (FR-19)
  for (const mandatoryType of MANDATORY_MODULE_TYPES) {
    const found = modules.find((m) => m.type === mandatoryType);
    if (!found) {
      issues.push({
        id: `missing_${mandatoryType}`,
        level: AUDIT_LEVELS.ERROR,
        title: `Thiếu module bắt buộc: ${mandatoryType.toUpperCase()}`,
        message: `Landing page bắt buộc phải có phần "${mandatoryType}". Bạn không thể xuất bản nếu thiếu phần này.`,
        moduleId: null,
        fixSuggestion: `Bấm "+ Thêm module" và chọn module ${mandatoryType}.`,
      });
    } else if (found.hidden) {
      issues.push({
        id: `hidden_${mandatoryType}`,
        level: AUDIT_LEVELS.WARNING,
        title: `Module bắt buộc đang bị ẩn: ${found.name}`,
        message: `Phần "${found.name}" đang bị ẩn. Trang công khai cần mở phần này để người tham dự tiếp cận đầy đủ.`,
        moduleId: found.id,
        fixSuggestion: `Bật biểu tượng con mắt để hiện lại module ${found.name}.`,
      });
    }
  }

  // 2. Kiểm tra thứ tự logic (FR-22)
  const heroIndex = activeModules.findIndex((m) => m.type === 'hero');
  const formIndex = activeModules.findIndex((m) => m.type === 'form');
  if (heroIndex !== -1 && formIndex !== -1 && formIndex < heroIndex) {
    issues.push({
      id: 'order_form_before_hero',
      level: AUDIT_LEVELS.SUGGESTION,
      title: 'Thứ tự module chưa tối ưu',
      message: 'Form đăng ký đang đứng trước phần mở đầu (Hero). Người xem thường cần đọc thông tin trước khi điền đơn.',
      moduleId: activeModules[formIndex].id,
      fixSuggestion: 'Kéo module Form đăng ký xuống cuối trang hoặc sau phần Chương trình.',
    });
  }

  // 3. Kiểm tra từng module cụ thể
  for (const mod of activeModules) {
    // 3.1. Dữ liệu rỗng khi dùng auto data
    if (mod.type === 'hero' && !eventData.eventName && !mod.customContent?.headline) {
      issues.push({
        id: `empty_hero_${mod.id}`,
        level: AUDIT_LEVELS.WARNING,
        title: `${mod.name}: Chưa có tiêu đề`,
        message: 'Tên sự kiện trong WS1 đang trống hoặc chưa tạo nội dung AI.',
        moduleId: mod.id,
        fixSuggestion: 'Vào WS1 nhập tên sự kiện hoặc vào WS3 bấm "Tạo landing bằng AI".',
      });
    }

    if (mod.type === 'speakers' && (!eventData.speakers || eventData.speakers.length === 0)) {
      issues.push({
        id: `empty_speakers_${mod.id}`,
        level: AUDIT_LEVELS.SUGGESTION,
        title: `${mod.name}: Chưa có diễn giả nào`,
        message: 'Module diễn giả đang hiển thị nhưng danh sách diễn giả ở WS1 chưa có ai.',
        moduleId: mod.id,
        fixSuggestion: 'Thêm diễn giả trong WS1 hoặc ẩn module này nếu sự kiện không có khách mời.',
      });
    }

    if (mod.type === 'agenda' && (!eventData.agenda || eventData.agenda.length === 0)) {
      issues.push({
        id: `empty_agenda_${mod.id}`,
        level: AUDIT_LEVELS.SUGGESTION,
        title: `${mod.name}: Chưa có mốc chương trình`,
        message: 'Lịch trình sự kiện đang trống. Hãy bổ sung các phiên để người tham gia nắm được thời gian.',
        moduleId: mod.id,
        fixSuggestion: 'Nhập lịch trình tại WS1 hoặc dùng bộ mẫu tự động sinh.',
      });
    }

    // 3.2. Ảnh thiếu mô tả (caption/alt) (FR-28)
    if (mod.type === 'hero' || mod.type === 'venue') {
      const relatedAsset = assets.find((a) => a.role === mod.type) || assets[0];
      if (relatedAsset && !relatedAsset.caption) {
        issues.push({
          id: `missing_alt_${mod.id}`,
          level: AUDIT_LEVELS.WARNING,
          title: `${mod.name}: Ảnh chưa có mô tả (alt)`,
          message: 'Ảnh sử dụng trong module chưa có mô tả văn bản để hỗ trợ người khiếm thị đọc màn hình.',
          moduleId: mod.id,
          fixSuggestion: 'Vào Thư viện ảnh ở WS1 và điền mô tả cho ảnh.',
        });
      }
    }

    // 3.3. Kiểm tra khả năng thao tác trên màn hình nhỏ (FR-26, FR-40)
    if (width <= 375) {
      if (mod.styles?.padding === 'spacious') {
        issues.push({
          id: `padding_mobile_${mod.id}`,
          level: AUDIT_LEVELS.SUGGESTION,
          title: `${mod.name}: Khoảng đệm quá rộng trên di động`,
          message: 'Khoảng đệm (padding) lớn có thể làm chiếm nhiều không gian cuộn trên màn hình 375px.',
          moduleId: mod.id,
          fixSuggestion: 'Chọn khoảng đệm "Vừa vặn (normal)" hoặc "Gọn gàng (compact)" cho di động.',
        });
      }
    }
  }

  // 4. Kiểm tra cấu trúc trang dài (v3 rules)
  if (activeModules.length >= 7) {
    const hasNav = activeModules.some((m) => m.type === 'nav');
    if (!hasNav) {
      issues.push({
        id: 'long_page_no_nav',
        level: AUDIT_LEVELS.SUGGESTION,
        title: 'Trang dài nên có thanh điều hướng (Nav)',
        message: `Trang hiện có ${activeModules.length} module nhưng chưa có thanh điều hướng neo. Người dùng sẽ phải cuộn nhiều để tìm thông tin.`,
        moduleId: null,
        fixSuggestion: 'Thêm module "Thanh điều hướng neo (Nav)" đặt ở đầu trang.',
      });
    }
  }

  if (activeModules.length >= 6) {
    const hasLateCta = activeModules.slice(5).some((m) => m.type === 'final_cta' || m.type === 'form');
    if (!hasLateCta) {
      issues.push({
        id: 'final_cta_missing',
        level: AUDIT_LEVELS.SUGGESTION,
        title: 'Thiếu nút kêu gọi hành động cuối trang',
        message: 'Trang có nhiều nội dung nhưng sau module thứ 5 không có nút đăng ký nào, dễ làm rơi rớt khách tiềm năng.',
        moduleId: null,
        fixSuggestion: 'Thêm module "Kêu gọi cuối trang (Final CTA)" hoặc di chuyển Form xuống gần chân trang.',
      });
    }
  }

  // 5. Kiểm tra trải nghiệm điện ảnh & dữ liệu minh bạch (Cinematic Rules D-01, D-02)
  for (let i = 0; i < activeModules.length; i++) {
    const curMod = activeModules[i];
    const nextMod = activeModules[i + 1];

    if (curMod.type === 'countdown' && nextMod && nextMod.type === 'stats') {
      issues.push({
        id: `consecutive_social_proof_${curMod.id}`,
        level: AUDIT_LEVELS.SUGGESTION,
        title: 'Trùng lặp hiệu ứng số đông liên tiếp',
        message: `Module "${curMod.name}" và "${nextMod.name}" đứng cạnh nhau đều nhấn mạnh số lượng đăng ký/thống kê. Cân nhắc chèn module Giá trị (Benefits) hoặc Lịch trình vào giữa để tạo nhịp nghỉ điện ảnh.`,
        moduleId: nextMod.id,
        fixSuggestion: 'Chèn module Lợi ích hoặc Diễn giả vào giữa hai module này.',
      });
    }
  }

  return issues;
}

/**
 * Quét toàn diện trên mọi kích thước màn hình (FR-47, FR-48)
 */
export function runResponsiveScan(modules = [], eventData = {}, assets = []) {
  const testBreakpoints = [
    { name: 'Điện thoại nhỏ (320px)', width: 320 },
    { name: 'Điện thoại chuẩn (375px)', width: 375 },
    { name: 'Máy tính bảng (768px)', width: 768 },
    { name: 'Laptop (1024px)', width: 1024 },
    { name: 'Màn hình lớn (1280px)', width: 1280 },
  ];

  const resultsByBreakpoint = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalSuggestions = 0;

  for (const bp of testBreakpoints) {
    const issues = auditModuleLayout(modules, eventData, assets, bp.width);
    const errors = issues.filter((i) => i.level === AUDIT_LEVELS.ERROR).length;
    const warnings = issues.filter((i) => i.level === AUDIT_LEVELS.WARNING).length;
    const suggestions = issues.filter((i) => i.level === AUDIT_LEVELS.SUGGESTION).length;

    totalErrors += errors;
    totalWarnings += warnings;
    totalSuggestions += suggestions;

    resultsByBreakpoint.push({
      ...bp,
      issues,
      errors,
      warnings,
      suggestions,
      status: errors > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass',
    });
  }

  const overallStatus = totalErrors > 0 ? 'fail' : totalWarnings > 0 ? 'warning' : 'pass';

  return {
    scannedAt: new Date().toISOString(),
    overallStatus,
    summary: {
      totalErrors,
      totalWarnings,
      totalSuggestions,
      totalIssues: totalErrors + totalWarnings + totalSuggestions,
    },
    resultsByBreakpoint,
  };
}

/**
 * Xuất báo cáo kiểm tra ra file văn bản (.txt / .md)
 */
export function exportAuditReport(scanResult, projectName = 'Dự án') {
  const lines = [
    `# BÁO CÁO KIỂM TRA ĐA KÍCH THƯỚC (RESPONSIVE AUDIT REPORT)`,
    `Dự án: ${projectName}`,
    `Thời gian quét: ${new Date(scanResult.scannedAt).toLocaleString('vi-VN')}`,
    `Kết luận tổng thể: ${scanResult.overallStatus === 'pass' ? '✅ ĐẠT YÊU CẦU' : scanResult.overallStatus === 'warning' ? '⚠️ CÓ CẢNH BÁO' : '❌ CHƯA ĐẠT (CẦN SỬA LỖI)'}`,
    `Tổng số lỗi: ${scanResult.summary.totalErrors}`,
    `Tổng cảnh báo: ${scanResult.summary.totalWarnings}`,
    `Tổng gợi ý: ${scanResult.summary.totalSuggestions}`,
    ``,
    `---`,
    `## CHI TIẾT THEO TỪNG KÍCH THƯỚC`,
  ];

  for (const bp of scanResult.resultsByBreakpoint) {
    lines.push(`\n### ${bp.name} (${bp.width}px) — Trạng thái: ${bp.status.toUpperCase()}`);
    if (bp.issues.length === 0) {
      lines.push(`  ✔ Không phát hiện vấn đề nào. Bố cục hiển thị tối ưu.`);
    } else {
      bp.issues.forEach((issue, idx) => {
        lines.push(`  ${idx + 1}. [${issue.level.toUpperCase()}] ${issue.title}`);
        lines.push(`     - Chi tiết: ${issue.message}`);
        lines.push(`     - Cách khắc phục: ${issue.fixSuggestion}`);
      });
    }
  }

  const content = lines.join('\n');
  if (typeof document !== 'undefined') {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responsive-audit-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return content;
}
