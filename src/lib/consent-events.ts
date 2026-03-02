/* eslint-disable @typescript-eslint/no-explicit-any */

// /lib/consent-events.ts
export function emitConsentUpdated(analytics: boolean | null = null, extraDetail: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  try {
    const detail = { ...extraDetail };
    if (typeof analytics === "boolean") detail.analytics = analytics;
    window.dispatchEvent(new CustomEvent("consent:updated", { detail }));
    localStorage.setItem("buffex_cookie_consent_last_update", String(Date.now()));
  } catch {}
}
