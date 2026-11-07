#!/usr/bin/env node
/**
 * @file scripts/package-submission.mjs
 * Script tự động hóa đóng gói bài thi vòng loại theo chuẩn quy chế.
 * 
 * Các bước thực hiện:
 * 1. Chạy scan-secrets.mjs để rà soát mã bí mật
 * 2. Thu gom toàn bộ mã nguồn hợp lệ vào thư mục đệm (loại bỏ node_modules, .git, .env*, dist, v.v.)
 * 3. Nén file zip: Vibecoding2026_De08_EventLandingStudio.zip
 * 4. Giải nén vào thư mục temp_verify_submission để kiểm chứng tính toàn vẹn và quét lại secrets
 * 5. Báo cáo dung lượng, số lượng file và hướng dẫn nộp bài
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const ZIP_FILENAME = 'Vibecoding2026_De08_EventLandingStudio.zip';
const ZIP_PATH = path.join(ROOT_DIR, ZIP_FILENAME);
const STAGE_DIR = path.join(ROOT_DIR, 'temp_package_stage');
const VERIFY_DIR = path.join(ROOT_DIR, 'temp_verify_submission');

const EXCLUDED_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.vercel',
  '.turbo',
  '.idea',
  '.vscode',
  'temp_package_stage',
  'temp_verify_submission',
];

console.log('📦 ==============================================================');
console.log('📦 BẮT ĐẦU ĐÓNG GÓI BÀI THI: Event Landing Studio (Đề số 08)');
console.log('📦 ==============================================================\n');

// 1. Quét bảo mật trước khi đóng gói
console.log('Bước 1: Rà soát bí mật trong thư mục hiện tại...');
try {
  execSync('node scripts/scan-secrets.mjs', { stdio: 'inherit' });
} catch {
  console.error('❌ Đóng gói thất bại: Phát hiện lỗi bí mật. Vui lòng xử lý trước.');
  process.exit(1);
}

// 2. Dọn dẹp các thư mục đệm cũ
console.log('\nBước 2: Chuẩn bị thư mục đệm an toàn...');
[STAGE_DIR, VERIFY_DIR].forEach((d) => {
  if (fs.existsSync(d)) {
    fs.rmSync(d, { recursive: true, force: true });
  }
});
if (fs.existsSync(ZIP_PATH)) {
  fs.rmSync(ZIP_PATH, { force: true });
}

fs.mkdirSync(STAGE_DIR, { recursive: true });

// 3. Sao chép cây thư mục dự án vào STAGE_DIR (chỉ lấy các file sạch)
function copyCleanFiles(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_PATTERNS.includes(entry.name)) {
        fs.mkdirSync(destPath, { recursive: true });
        copyCleanFiles(srcPath, destPath);
      }
    } else if (entry.isFile()) {
      // Loại bỏ file .zip, .env* (NGOẠI TRỪ .env.example)
      if (entry.name.endsWith('.zip')) continue;
      if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
        console.log(`🛡️  Bỏ qua file bí mật môi trường: ${entry.name}`);
        continue;
      }
      if (EXCLUDED_PATTERNS.includes(entry.name)) continue;

      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Đang sao chép các tệp hợp lệ vào thư mục đóng gói...');
copyCleanFiles(ROOT_DIR, STAGE_DIR);

// Đảm bảo .env.example có mặt trong gói nộp bài
const stagedEnvExample = path.join(STAGE_DIR, '.env.example');
if (!fs.existsSync(stagedEnvExample)) {
  fs.writeFileSync(
    stagedEnvExample,
    `# Biến môi trường mẫu cho Event Landing Studio\nVITE_GEMINI_API_KEY=your_gemini_api_key_here\nVITE_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta\nVITE_GEMINI_MODEL=gemini-1.5-flash\n`,
    'utf8'
  );
  console.log('✓ Đã tạo .env.example mẫu trong gói đóng gói.');
}

// 4. Nén file zip từ STAGE_DIR
console.log(`\nBước 3: Nén gói nộp bài thành "${ZIP_FILENAME}"...`);
try {
  // Dùng tar bsdtar tích hợp sẵn trong Windows để tạo zip
  execSync(`tar -a -c -f "${ZIP_PATH}" -C "${STAGE_DIR}" .`, { stdio: 'inherit' });
} catch (zipErr) {
  console.error('Lỗi khi nén bằng tar, thử dùng PowerShell Compress-Archive:', zipErr.message);
  execSync(`powershell -Command "Compress-Archive -Path '${STAGE_DIR}/*' -DestinationPath '${ZIP_PATH}' -Force"`, {
    stdio: 'inherit',
  });
}

// 5. Kiểm tra file zip đã sinh ra
if (!fs.existsSync(ZIP_PATH)) {
  console.error('❌ Lỗi: Không thể tìm thấy file zip sau khi nén.');
  process.exit(1);
}

const stats = fs.statSync(ZIP_PATH);
const zipSizeKB = (stats.size / 1024).toFixed(1);
const zipSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`✓ Đã tạo thành công file nén: ${ZIP_FILENAME} (${zipSizeKB} KB / ${zipSizeMB} MB)`);

// 6. Nghiệm thu giải nén vào VERIFY_DIR
console.log('\nBước 4: Giải nén kiểm chứng tính toàn vẹn vào thư mục tạm...');
fs.mkdirSync(VERIFY_DIR, { recursive: true });
try {
  execSync(`tar -x -f "${ZIP_PATH}" -C "${VERIFY_DIR}"`, { stdio: 'inherit' });
} catch (unzipErr) {
  console.error('Lỗi khi giải nén bằng tar, thử dùng PowerShell Expand-Archive:', unzipErr.message);
  execSync(`powershell -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${VERIFY_DIR}' -Force"`, {
    stdio: 'inherit',
  });
}

// 7. Rà soát secrets trên gói đã giải nén
console.log('\nBước 5: Quét bảo mật gói giải nén (Zero Secret Verification)...');
try {
  execSync(`node scripts/scan-secrets.mjs "${VERIFY_DIR}"`, { stdio: 'inherit' });
} catch {
  console.error('❌ Gói nộp bài thất bại khi kiểm chứng bí mật!');
  process.exit(1);
}

// 8. Đếm số file trong gói giải nén
let verifiedFileCount = 0;
function countFiles(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) countFiles(path.join(dir, ent.name));
    else verifiedFileCount++;
  }
}
countFiles(VERIFY_DIR);

// Dọn dẹp thư mục tạm
fs.rmSync(STAGE_DIR, { recursive: true, force: true });
fs.rmSync(VERIFY_DIR, { recursive: true, force: true });

console.log('\n🎉 ==============================================================');
console.log('🎉 ĐÓNG GÓI BÀI THI HOÀN TOÀN THÀNH CÔNG!');
console.log(`📦 Tệp nộp bài: ${ZIP_PATH}`);
console.log(`📊 Kích thước nén: ${zipSizeMB} MB (${zipSizeKB} KB)`);
console.log(`📄 Tổng số tệp tin: ${verifiedFileCount} tệp sạch`);
console.log('🛡️  Bảo mật: 100% không chứa file .env nhạy cảm hay API key thật');
console.log('✅ Sẵn sàng tải lên cổng nộp bài thi Vibecoding 2026!');
console.log('🎉 ==============================================================\n');
