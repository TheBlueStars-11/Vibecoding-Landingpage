/**
 * @file api/sync/project.js
 * Serverless handler (Vercel) lấy thông tin dự án đã xuất bản theo slug hoặc ID
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { ensureMethod, sendError, sendSuccess } from '../_lib/http.js';

const CACHE_FILE = path.join(os.tmpdir(), 'els-sync-cache.json');
globalThis._elsSyncProjects = globalThis._elsSyncProjects || new Map();

function loadFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        globalThis._elsSyncProjects.set(k, v);
      }
    }
  } catch (err) {
    console.warn('[Sync] Không thể đọc cache dự án:', err.message);
  }
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  const { slug, id } = req.query || {};
  loadFromDisk();

  const item = (slug ? globalThis._elsSyncProjects.get(slug) : null) || (id ? globalThis._elsSyncProjects.get(id) : null);

  if (item && item.project) {
    return sendSuccess(res, { project: item.project, assets: item.assets || [] });
  }

  return sendError(res, 'Không tìm thấy sự kiện trên máy chủ đồng bộ.', 404);
}

