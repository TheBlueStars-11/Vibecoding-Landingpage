/**
 * @file gemini.js
 * Adapter tương thích - chuyển tiếp sang services/aiClient với đầy đủ Fact Guard & Fallback.
 */

import { generateEventContentWithGuard, buildPrompt } from '../services/aiClient.js';

export async function generateEventContent(eventInfo) {
  return generateEventContentWithGuard(eventInfo);
}

export { buildPrompt };
