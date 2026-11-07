/**
 * @file api/sync/publish.js
 * Serverless handler (Vercel) nhận và lưu trữ dự án xuất bản để đồng bộ thời gian thực
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_FILE = path.join(os.tmpdir(), 'els-sync-cache.json');
globalThis._elsSyncProjects = globalThis._elsSyncProjects || new Map();

function saveToDisk() {
  try {
    const obj = {};
    for (const [k, v] of globalThis._elsSyncProjects.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf8');
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Chỉ chấp nhận phương thức POST' });
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

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ ok: true, count: globalThis._elsSyncProjects.size });
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ ok: false, error: err.message });
  }
}

