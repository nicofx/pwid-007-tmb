const STORAGE_KEY = 'tmb.device.id';

function fallbackUuid(): string {
  // UUID v4-compatible fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    const value = token === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-device';
  }

  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : fallbackUuid();

  localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
