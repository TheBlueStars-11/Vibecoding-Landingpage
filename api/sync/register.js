/**
 * @file api/sync/register.js
 * Serverless handler (Vercel) nhận đơn đăng ký từ người dùng trên trang công khai
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { ensureMethod, ensurePayloadSize, sendError, sendSuccess } from '../_lib/http.js';

const REGS_FILE = path.join(os.tmpdir(), 'els-regs-cache.json');
globalThis._elsRegistrations = globalThis._elsRegistrations || new Map();

function saveRegs() {
  try {
    const obj = {};
    for (const [k, v] of globalThis._elsRegistrations.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(REGS_FILE, JSON.stringify(obj), 'utf8');
  } catch (err) {
    console.warn('[Sync] Không thể ghi cache đăng ký:', err.message);
  }
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  if (!ensurePayloadSize(req, res, 16384)) {
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { projectId, registration } = body;
    if (!projectId || !registration) {
      return sendError(res, 'Thiếu projectId hoặc thông tin đăng ký.', 400);
    }

    const list = globalThis._elsRegistrations.get(projectId) || [];
    const exists = list.some((r) => r.id === registration.id || (r.code && r.code === registration.code));
    if (!exists) {
      list.unshift(registration);
      globalThis._elsRegistrations.set(projectId, list);
      saveRegs();
    }

    return sendSuccess(res, { registration, totalCount: list.length });
  } catch (err) {
    return sendError(res, err.message || 'Không thể lưu đơn đăng ký.', 400);
  }
}

