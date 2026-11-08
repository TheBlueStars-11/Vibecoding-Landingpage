/**
 * @file api/sync/publish.js
 * Serverless handler (Vercel) nhận và lưu trữ dự án xuất bản để đồng bộ thời gian thực
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { ensureMethod, ensurePayloadSize, sendError, sendSuccess } from '../_lib/http.js';

const CACHE_FILE = path.join(os.tmpdir(), 'els-sync-cache.json');
globalThis._elsSyncProjects = globalThis._elsSyncProjects || new Map();

function saveToDisk() {
  try {
    const obj = {};
    for (const [k, v] of globalThis._elsSyncProjects.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf8');
  } catch (err) {
    console.warn('[Sync] Không thể ghi cache dự án:', err.message);
  }
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  // Cho phép payload dự án kèm metadata ảnh tối đa 2MB
  if (!ensurePayloadSize(req, res, 2 * 1024 * 1024)) {
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { project, assets } = body;

    if (project && project.id) {
      const item = { project, assets: assets || [], updatedAt: Date.now() };
      globalThis._elsSyncProjects.set(project.id, item);
      if (project.slug) {
        globalThis._elsSyncProjects.set(project.slug, item);
      }
      saveToDisk();
    }

    return sendSuccess(res, { count: globalThis._elsSyncProjects.size });
  } catch (err) {
    return sendError(res, err.message || 'Dữ liệu dự án không hợp lệ.', 400);
  }
}

