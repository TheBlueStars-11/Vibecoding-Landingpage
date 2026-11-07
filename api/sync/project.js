/**
 * @file api/sync/project.js
 * Serverless handler (Vercel) lấy thông tin dự án đã xuất bản theo slug hoặc ID
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

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
  } catch {}
}

export default async function handler(req, res) {
  const { slug, id } = req.query || {};
  loadFromDisk();

  const item = (slug ? globalThis._elsSyncProjects.get(slug) : null) || (id ? globalThis._elsSyncProjects.get(id) : null);

  res.setHeader('Content-Type', 'application/json');
  if (item && item.project) {
    return res.status(200).json({ ok: true, project: item.project, assets: item.assets || [] });
  }

  return res.status(404).json({ ok: false, error: 'Không tìm thấy sự kiện trên máy chủ đồng bộ.' });
}

