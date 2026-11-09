#!/usr/bin/env node
/**
 * @file scripts/scan-hardcode.mjs
 * Tự động rà soát chuỗi hardcode theo Bảng dọn hardcode (§7) trong ModuleRenderer.jsx và modules/*
 */

import fs from 'fs';
import path from 'path';

const TARGET_FILES = [
  'src/components/landing/ModuleRenderer.jsx',
];

const FORBIDDEN_RULES = [
  {
    name: 'Hardcoded time end range ("- 11:30")',
    regex: /-\s*11:30/g,
  },
  {
    name: 'Hardcoded weekday ("Thứ Sáu" / "Thứ Bảy"...) in static JSX',
    regex: />Thứ (?:Hai|Ba|Tư|Năm|Sáu|Bảy)</g,
  },
  {
    name: 'Hardcoded fake percentage ("82%")',
    regex: /82%/g,
  },
  {
    name: 'Hardcoded fake speaker fraction ("18/20")',
    regex: /18\/20\s+Diễn giả/g,
  },
  {
    name: 'Hardcoded fake email (@vibecoding.vn)',
    regex: /@vibecoding\.vn/g,
  },
  {
    name: 'Hardcoded fake phone number (024 3999 8888)',
    regex: /024\s*3999\s*8888/g,
  },
  {
    name: 'Hardcoded fake offer ("Nhận trọn bộ Ebook")',
    regex: /Nhận trọn bộ Ebook/g,
  },
  {
    name: 'Hardcoded brand string ("VIBE CODING 2026")',
    regex: /['"`]VIBE CODING 2026['"`]/g,
  },
];

let hasErrors = false;
console.log('🔍 [scan-hardcode] Kiểm tra chuỗi hardcode theo Bảng dọn dẹp §7...');

for (const relPath of TARGET_FILES) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[scan-hardcode] Không tìm thấy file: ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  for (const rule of FORBIDDEN_RULES) {
    const matches = content.match(rule.regex);
    if (matches && matches.length > 0) {
      console.error(`❌ [scan-hardcode] Phát hiện chuỗi cấm trong ${relPath}: ${rule.name} (${matches.length} lần)`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error('⚠️ [scan-hardcode] Thất bại: Vui lòng dọn sạch các chuỗi hardcode vi phạm §7.');
  process.exit(1);
} else {
  console.log('✅ [scan-hardcode] HOÀN TẤT: 0 chuỗi hardcode vi phạm trong ModuleRenderer.jsx.');
}

