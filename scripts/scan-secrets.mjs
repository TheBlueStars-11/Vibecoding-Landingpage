#!/usr/bin/env node
/**
 * @file scripts/scan-secrets.mjs
 * Tự động rà soát bí mật (API Keys, Token, Private Keys, .env) trước khi nộp bài hoặc commit.
 * Tuân thủ quy định bảo mật vòng sơ khảo: Tuyệt đối không để lọt secret thật vào repository/zip.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TARGET_DIR = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.vercel',
  '.turbo',
  'temp_verify_submission',
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  '.env.example',
  '.gitignore',
]);

const SECRET_PATTERNS = [
  {
    name: 'Google Gemini / Cloud API Key (AIzaSy...)',
    regex: /AIzaSy[0-9A-Za-z_-]{33}/g,
    isIgnored: (match) =>
      match.includes('AIzaSyDummy') ||
      match.includes('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6') ||
      match.includes('your_gemini_api_key_here'),
  },
  {
    name: 'OpenAI Secret Key (sk-...)',
    regex: /sk-(?:live-)?[0-9a-zA-Z]{32,}/g,
    isIgnored: (match) => match.includes('dummy') || match.includes('sk-test-'),
  },
  {
    name: 'Private Key header',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    isIgnored: () => false,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /gh[pousr]_[0-9A-Za-z]{36}/g,
    isIgnored: () => false,
  },
  {
    name: 'Local Machine Absolute Path Leak (C:\\Users / d:\\University)',
    regex: /(?:[cCdD]:\\(?:Users|University)\\[^\s"'`)]+|file:\/\/\/[cCdD](?:%3A|:)\/(?:Users|University)\/[^\s"'`)]+)/g,
    isIgnored: () => false,
  },
];

const foundIssues = [];

// Kiểm tra xem git có theo dõi .env không
function isGitTracked(fileRelPath) {
  try {
    const stdout = execSync(`git ls-files "${fileRelPath}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

function checkFileForSecrets(filePath) {
  const relativePath = path.relative(TARGET_DIR, filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Bỏ qua các file tài liệu .md lẻ ở thư mục gốc đã bị .gitignore loại trừ (trừ README.md và docs/)
  if (ext === '.md' && relativePath !== 'README.md' && !relativePath.startsWith(`docs${path.sep}`) && !relativePath.startsWith('docs/')) {
    if (!isGitTracked(relativePath)) {
      return;
    }
  }

  // Kiểm tra file .env
  if (fileName.startsWith('.env') && fileName !== '.env.example') {
    const isPackagedDir = TARGET_DIR.includes('temp_verify') || TARGET_DIR.includes('dist');
    const isTracked = isGitTracked(relativePath);

    if (isPackagedDir || isTracked) {
      foundIssues.push({
        file: relativePath,
        line: 1,
        rule: `File ${fileName} đang bị theo dõi bởi git hoặc lọt vào gói đóng gói nộp bài. BẮT BUỘC gỡ bỏ!`,
      });
      return;
    } else {
      console.log(`ℹ️  [scan-secrets] File "${relativePath}" tồn tại cục bộ (được bảo vệ bởi .gitignore, sẽ bị loại bỏ khi nén zip).`);
      return;
    }
  }

  // Bỏ qua các file nhị phân
  const textExtensions = new Set([
    '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx',
    '.json', '.html', '.css', '.md', '.txt', '.yml', '.yaml',
  ]);
  if (!textExtensions.has(ext)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const rule of SECRET_PATTERNS) {
      lines.forEach((lineText, lineIdx) => {
        const matches = lineText.match(rule.regex);
        if (matches) {
          for (const match of matches) {
            if (!rule.isIgnored(match)) {
              foundIssues.push({
                file: relativePath,
                line: lineIdx + 1,
                rule: rule.name,
                snippet: lineText.trim().slice(0, 80),
              });
            }
          }
        }
      });
    }
  } catch (err) {
    console.warn(`[scan-secrets] Không thể đọc file: ${relativePath} (${err.message})`);
  }
}

function walkDir(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (!IGNORED_FILES.has(entry.name)) {
        checkFileForSecrets(fullPath);
      }
    }
  }
}

console.log(`🔍 [scan-secrets] Bắt đầu rà soát bí mật tại: ${TARGET_DIR}`);
walkDir(TARGET_DIR);

if (foundIssues.length === 0) {
  console.log('✅ [scan-secrets] HOÀN TẤT: 0 bí mật hoặc file .env vi phạm được phát hiện.');
  console.log('   Mã nguồn an toàn để đóng gói nộp bài.');
  process.exit(0);
} else {
  console.error(`❌ [scan-secrets] PHÁT HIỆN ${foundIssues.length} NGUY CƠ RÒ RỈ BẢO MẬT:`);
  for (const issue of foundIssues) {
    console.error(`   - [${issue.file}:${issue.line}] ${issue.rule}`);
    if (issue.snippet) {
      console.error(`     Dòng: "${issue.snippet}"`);
    }
  }
  console.error('⚠️  Vui lòng gỡ bỏ các bí mật trên trước khi tạo bản nộp bài.');
  process.exit(1);
}
