/**
 * @file api/sync/registrations.js
 * Serverless handler (Vercel) lấy danh sách đơn đăng ký đã đồng bộ
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

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
  } catch {}
}

export default async function handler(req, res) {
  const { projectId } = req.query || {};
  loadRegs();
  const list = projectId ? (globalThis._elsRegistrations.get(projectId) || []) : [];

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ ok: true, registrations: list });
}

