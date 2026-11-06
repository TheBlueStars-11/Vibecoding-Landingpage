/**
 * @file storage.js
 * Adapter tương thích ngược - chuyển tiếp sang services/repository.
 */

import { registrationRepo, eventRepo } from '../services/repository.js';

export function getRegistrations(eventId) {
  return registrationRepo.listByEvent(eventId);
}

export function addRegistration(eventId, { name, fullName, email, phone }) {
  const result = registrationRepo.add(eventId, {
    fullName: fullName || name,
    email,
    phone,
  });

  return {
    success: result.ok,
    message: result.message,
    data: result.data,
  };
}

export function countRegistrations(eventId) {
  return registrationRepo.countByEvent(eventId);
}

export { registrationRepo, eventRepo };
