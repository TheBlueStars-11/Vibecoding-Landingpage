/**
 * @file api/tunnel/stop.js
 */

import { ensureDevOnly, ensureMethod, sendSuccess } from '../_lib/http.js';

export default function handler(req, res) {
  if (!ensureDevOnly(req, res)) {
    return;
  }
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }
  return sendSuccess(res, {});
}

