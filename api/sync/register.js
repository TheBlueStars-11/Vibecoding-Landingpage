/**
 * @file api/sync/register.js
 * Serverless handler (Vercel) nhận đơn đăng ký từ người dùng trên trang công khai
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const REGS_FILE = path.join(os.tmpdir(), 'els-regs-cache.json');
globalThis._elsRegistrations = globalThis._elsRegistrations || new Map();

function saveRegs() {
  try {
    const obj = {};
    for (const [k, v] of globalThis._elsRegistrations.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(REGS_FILE, JSON.stringify(obj), 'utf8');
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Chỉ chấp nhận phương thức POST' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { projectId, registration } = body;
    if (!projectId || !registration) {
      return res.status(400).json({ ok: false, error: 'Thiếu projectId hoặc thông tin đăng ký.' });
    }

    const list = globalThis._elsRegistrations.get(projectId) || [];
    const exists = list.some((r) => r.id === registration.id || (r.code && r.code === registration.code));
    if (!exists) {
      list.unshift(registration);
      globalThis._elsRegistrations.set(projectId, list);
      saveRegs();
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ ok: true, registration, totalCount: list.length });
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ ok: false, error: err.message });
  }
}

