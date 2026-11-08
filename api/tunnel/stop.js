/**
 * @file api/tunnel/stop.js
 */

import { ensureMethod, sendSuccess } from '../_lib/http.js';

export default function handler(req, res) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }
  return sendSuccess(res, {});
}

