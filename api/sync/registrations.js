/**
 * @file api/sync/registrations.js
 * Serverless handler (Vercel) lấy danh sách đơn đăng ký đã đồng bộ
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { ensureMethod, sendSuccess } from '../_lib/http.js';

const REGS_FILE = path.join(os.tmpdir(), 'els-regs-cache.json');
globalThis._elsRegistrations = globalThis._elsRegistrations || new Map();

function loadRegs() {
  try {
    if (fs.existsSync(REGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(REGS_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        globalThis._elsRegistrations.set(k, v);
      }
    }
  } catch (err) {
    console.warn('[Sync] Không thể đọc cache đăng ký:', err.message);
  }
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  const { projectId } = req.query || {};
  loadRegs();
  const list = projectId ? (globalThis._elsRegistrations.get(projectId) || []) : [];

  return sendSuccess(res, { registrations: list });
}

