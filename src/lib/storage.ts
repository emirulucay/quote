/**
 * Safe localStorage access.
 *
 * Every write used to be a bare `localStorage.setItem` inside an effect, so a
 * QuotaExceededError (easy to hit once a base64 logo is stored) silently killed
 * all persistence with no feedback. These helpers never throw and report back
 * whether the write actually landed.
 */

export const STORAGE_KEYS = {
  preferences: "quote-preferences",
  servicesLayout: "quote-services-layout",
  customTaxes: "quote-custom-taxes",
  creationPreferences: "quote-creation-preferences",
  savedServices: "quote-saved-services",
  savedClients: "quote-saved-clients",
  history: "quote-history",
  numberCounter: "quote-number-counter",
  profiles: "invoice-profiles",
  activeProfileId: "quote-active-profile-id",
  previewZoom: "quote-preview-zoom",
} as const;

export const APP_KEYS: string[] = Object.values(STORAGE_KEYS);

export type WriteResult = { ok: boolean; quotaExceeded: boolean };

const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014);

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): WriteResult {
  try {
    localStorage.setItem(key, value);
    return { ok: true, quotaExceeded: false };
  } catch (error) {
    return { ok: false, quotaExceeded: isQuotaError(error) };
  }
}

export function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key: string, value: unknown): WriteResult {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return { ok: false, quotaExceeded: false };
  }
}

/** Rough byte size of everything this app keeps in localStorage. */
export function getStorageUsage(): number {
  return APP_KEYS.reduce((total, key) => {
    const raw = safeGetItem(key);
    return total + (raw ? raw.length + key.length : 0);
  }, 0);
}
