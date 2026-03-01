/* eslint-disable @typescript-eslint/no-explicit-any */

// ConsentModal.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@/context/user-context";
import { emitConsentUpdated } from "@/lib/consent-events";
import { usePathname } from "next/navigation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useTranslation } from "react-i18next";

const POLICY_VERSION = process.env.NEXT_PUBLIC_POLICY_VERSION || "1.0.5";
const url_base = ""; // '/mi_base' si aplica

type ConsentType = "terms_of_service" | "privacy_policy" | "cookies_policy";
type AcceptedItem = { type: ConsentType; version?: string; granted?: boolean; details?: Record<string, unknown> };
type ConsentDoc = {
  accepted?: AcceptedItem[];
  accepted_types?: ConsentType[];
  client_timestamp?: string;
  timestamp?: string;
  user_id?: string;
  [k: string]: any;
};

export default function ConsentModal() {
  const { t } = useTranslation();
  const pathname = usePathname() || "";

  const skipModalRoute = pathname.startsWith(`${url_base}/consent`);

  const { firebaseUser, loading: userLoading, user, setNewsletterConsent } = useUser();

  const [show, setShow] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsChecked, setAnalyticsChecked] = useState<boolean>(false);
  const [newsletterChecked, setNewsletterChecked] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);

  const CONSENT_TYPES: ConsentType[] = ["terms_of_service", "privacy_policy", "cookies_policy"];

  const LOCAL_KEY = "consent_versions";
  const LEGACY_KEY = "consent_version";
  const FULL_KEY = "culinarium_cookie_consent";
  const LAST_UPDATE_KEY = "culinarium_cookie_consent_last_update";

  const toMillis = (d?: string) => {
    if (!d) return 0;
    const iso = Date.parse(d);
    if (!Number.isNaN(iso)) return iso;
    const ms = new Date(d).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  };

  function normalizeConsents(input: unknown) {
    let docs: ConsentDoc[] = [];
    if (Array.isArray(input)) {
      docs = input as ConsentDoc[];
    } else if (input && typeof input === "object") {
      const obj = input as any;
      if (Array.isArray(obj.accepted)) {
        docs = [obj as ConsentDoc];
      } else {
        // API may return {version, granted} objects (new format) or strings (legacy)
        const accepted: AcceptedItem[] = CONSENT_TYPES.map((type) => {
          const val = obj[type];
          if (typeof val === "string") {
            return { type, version: val, granted: true };
          } else if (val && typeof val === "object") {
            return { type, version: val.version, granted: val.granted };
          }
          return { type, version: undefined, granted: undefined };
        });
        docs = [{ accepted, accepted_types: CONSENT_TYPES, client_timestamp: obj.updatedAt || obj.timestamp }];
      }
    }

    if (!docs.length) {
      return {
        hasAnyRecord: false,
        byType: { terms_of_service: {}, privacy_policy: {}, cookies_policy: {} } as Record<
          ConsentType,
          { version?: string; granted?: boolean }
        >,
        missingTypes: CONSENT_TYPES.slice(),
        allVersionsOk: false,
      };
    }

    const latest =
      docs
        .map((d) => ({ doc: d, ms: Math.max(toMillis(d.client_timestamp), toMillis(d.timestamp)) }))
        .sort((a, b) => b.ms - a.ms)?.[0]?.doc || docs[0];

    const byType: Record<ConsentType, { version?: string; granted?: boolean }> = {
      terms_of_service: {},
      privacy_policy: {},
      cookies_policy: {},
    };

    (latest.accepted || []).forEach((a) => {
      if (a?.type && CONSENT_TYPES.includes(a.type)) {
        byType[a.type as ConsentType] = { version: a.version, granted: a.granted };
      }
    });

    const missingTypes = CONSENT_TYPES.filter((t) => byType[t].version === undefined);
    // allVersionsOk: required types must be granted+current; optional types just need a choice at current version
    const allVersionsOk = CONSENT_TYPES.every((t) => {
      const entry = byType[t];
      if (t === "cookies_policy") return entry.version === POLICY_VERSION; // ok if user made any choice
      return entry.version === POLICY_VERSION && entry.granted === true;   // required must be explicitly granted
    });

    return { hasAnyRecord: true, latest, byType, missingTypes, allVersionsOk };
  }

  function writeLocalStorageSnapshot(analyticsGranted = true) {
    try {
      const saveObj: Record<string, string> = {};
      CONSENT_TYPES.forEach((t) => (saveObj[t] = POLICY_VERSION));
      localStorage.setItem(LOCAL_KEY, JSON.stringify(saveObj));
      localStorage.setItem(LEGACY_KEY, POLICY_VERSION);

      const full = {
        accepted: CONSENT_TYPES.map((type) => ({
          type,
          version: POLICY_VERSION,
          granted: type === "cookies_policy" ? analyticsGranted : true,
          details: {},
        })),
        accepted_types: analyticsGranted ? CONSENT_TYPES : ["terms_of_service", "privacy_policy"],
        client_timestamp: new Date().toISOString(),
        created_by_authenticated: !!firebaseUser,
        details: { ip_masked: "" },
        meta: {
          origin: typeof window !== "undefined" ? window.location.origin : "",
          path: typeof window !== "undefined" ? window.location.pathname : "",
          ref: typeof document !== "undefined" ? document.referrer || "" : "",
        },
        timestamp: new Date().toLocaleString(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        user_id: firebaseUser ? firebaseUser.uid : undefined,
      };
      localStorage.setItem(FULL_KEY, JSON.stringify(full));
      localStorage.setItem(LAST_UPDATE_KEY, String(Date.now()));
    } catch {}
  }

  // Init newsletter checkbox from user data
  useEffect(() => {
    if (user && typeof (user as any).newsletterConsent !== "undefined") {
      setNewsletterChecked(Boolean((user as any).newsletterConsent));
    }
  }, [user]);

  // Focus first button when modal opens
  useEffect(() => {
    if (show) {
      setTimeout(() => rejectButtonRef.current?.focus(), 50);
    }
  }, [show]);

  // Sync consent event
  useEffect(() => {
    const onConsentUpdated = (ev: Event) => {
      try {
        const custom = ev as CustomEvent;
        if (custom?.detail) writeLocalStorageSnapshot(true);
      } catch (err) {
        console.warn("ConsentModal: onConsentUpdated error", err);
      }
      setShow(false);
      setLoading(false);
      setInitialized(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("consent:updated", onConsentUpdated as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("consent:updated", onConsentUpdated as EventListener);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  // Main consent check
  useEffect(() => {
    if (userLoading) return;

    const checkConsent = async () => {
      setLoading(true);
      try {
        if (firebaseUser) {
          localStorage.removeItem("anonymous_user_id");
          localStorage.setItem("user_id", firebaseUser.uid);

          const token = await firebaseUser.getIdToken();
          const res = await fetch("/api/consent", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 404) {
            setShow(true);
            setInitialized(true);
            return;
          }
          if (!res.ok) {
            setShow(true);
            setInitialized(true);
            return;
          }

          const data = await res.json();
          const norm = normalizeConsents(data);

          // Show modal only if user has never made a choice or policy version changed
          // Do NOT re-show just because user previously rejected optional cookies
          if (!norm.hasAnyRecord || !norm.allVersionsOk || norm.missingTypes.length > 0) {
            setShow(true);
            setInitialized(true);
            return;
          }

          const cookiesGranted = norm.byType.cookies_policy.granted ?? false;
          writeLocalStorageSnapshot(cookiesGranted);
          setShow(false);
          setInitialized(true);
        } else {
          localStorage.removeItem("user_id");
          localStorage.removeItem("anonymous_user_id");

          const localRaw = localStorage.getItem(LOCAL_KEY);
          if (localRaw) {
            try {
              const localObj = JSON.parse(localRaw) as Record<string, string>;
              const allOk = CONSENT_TYPES.every((type) => localObj && localObj[type] === POLICY_VERSION);
              if (allOk) {
                setShow(false);
                setInitialized(true);
                return;
              }
            } catch (err) {
              console.error(t("consent.modal.errors.checkConsent"), err);
            }
          }
          setShow(true);
          setInitialized(true);
        }
      } catch (error) {
        console.error(t("consent.modal.errors.checkConsent"), error);
        setShow(true);
        setInitialized(true);
      } finally {
        setLoading(false);
        try {
          localStorage.setItem("consent_debug_last_check", new Date().toISOString());
        } catch {}
      }
    };

    checkConsent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, userLoading, t]);

  // Focus trap + Escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      handleReject();
      return;
    }
    if (e.key === "Tab") {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reject non-essential: only accept terms + privacy, reject cookies/analytics
  const handleReject = async () => {
    setLoading(true);

    const accepted = CONSENT_TYPES.map((type) => ({
      type,
      version: POLICY_VERSION,
      granted: type !== "cookies_policy",
      details: {},
    }));

    if (!firebaseUser) {
      try {
        writeLocalStorageSnapshot(false);
        emitConsentUpdated?.(false, { accepted_types: ["terms_of_service", "privacy_policy"] });
      } catch {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("consent:updated", { detail: { analytics: false, accepted_types: ["terms_of_service", "privacy_policy"] } }));
          try { localStorage.setItem(LAST_UPDATE_KEY, String(Date.now())); } catch {}
        }
      }
      setShow(false);
      setLoading(false);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accepted,
          user_id: firebaseUser.uid,
          details: {},
          origin: window.location.origin,
          ref: document.referrer || "",
          path: window.location.pathname,
          client_timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        console.error(t("consent.modal.errors.saveConsent"), await res.text());
      } else {
        writeLocalStorageSnapshot(false);
        try {
          emitConsentUpdated?.(false, { accepted_types: ["terms_of_service", "privacy_policy"] });
        } catch {
          window.dispatchEvent(new CustomEvent("consent:updated", { detail: { analytics: false } }));
          try { localStorage.setItem(LAST_UPDATE_KEY, String(Date.now())); } catch {}
        }
      }
      setShow(false);
    } catch (err) {
      console.error(t("consent.modal.errors.requestError"), err);
      setShow(false); // dismiss anyway to avoid blocking
    } finally {
      setLoading(false);
    }
  };

  // Accept all (cookies_policy follows analyticsChecked state)
  const handleAcceptAll = async () => {
    setLoading(true);

    const accepted = CONSENT_TYPES.map((type) => ({
      type,
      version: POLICY_VERSION,
      granted: type === "cookies_policy" ? analyticsChecked : true,
      details: {},
    }));
    const acceptedTypes = analyticsChecked ? CONSENT_TYPES : (["terms_of_service", "privacy_policy"] as ConsentType[]);

    if (!firebaseUser) {
      try {
        writeLocalStorageSnapshot(analyticsChecked);
        emitConsentUpdated?.(analyticsChecked, { accepted_types: acceptedTypes });
      } catch {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("consent:updated", { detail: { analytics: analyticsChecked, accepted_types: acceptedTypes } }));
          try { localStorage.setItem(LAST_UPDATE_KEY, String(Date.now())); } catch {}
        }
      }
      setShow(false);
      setLoading(false);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accepted,
          user_id: firebaseUser.uid,
          details: {},
          origin: window.location.origin,
          ref: document.referrer || "",
          path: window.location.pathname,
          client_timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        console.error(t("consent.modal.errors.saveConsent"), await res.text());
        setShow(true);
      } else {
        writeLocalStorageSnapshot(analyticsChecked);
        try {
          emitConsentUpdated?.(analyticsChecked, { accepted_types: acceptedTypes });
        } catch {
          window.dispatchEvent(new CustomEvent("consent:updated", { detail: { analytics: analyticsChecked, accepted_types: acceptedTypes } }));
          try { localStorage.setItem(LAST_UPDATE_KEY, String(Date.now())); } catch {}
        }

        // Newsletter independent of consents
        try {
          if (typeof setNewsletterConsent === "function") {
            if (newsletterChecked) {
              await setNewsletterConsent(true);
            } else if (user && (user as any).newsletterConsent === true) {
              await setNewsletterConsent(false);
            }
          }
        } catch (e) {
          console.error("No se pudo actualizar newsletter en Firestore:", e);
        }

        setShow(false);
      }
    } catch (err) {
      console.error(t("consent.modal.errors.requestError"), err);
      setShow(true);
    } finally {
      setLoading(false);
    }
  };

  useBodyScrollLock(show && !loading && !skipModalRoute);

  if (skipModalRoute || !initialized || !show) return null;

  return (
    // Non-blocking backdrop: pointer-events-none on outer so user can interact with page behind
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[99999] pointer-events-none">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
        onKeyDown={handleKeyDown}
        className="pointer-events-auto bg-[var(--background)] text-[var(--foreground)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border border-gray-200 outline-none"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 id="consent-modal-title" className="text-lg font-bold">
            {t("consent.modal.title")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("consent.modal.message")}
          </p>
        </div>

        {/* Consent categories */}
        <div className="p-6 space-y-4">
          {/* Necessary — always on */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-[var(--highlight)] flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t("consent.modal.categories.necessary.title")}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("consent.modal.categories.necessary.description")}</p>
            </div>
          </div>

          {/* Analytics — optional */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsChecked}
              onChange={(e) => setAnalyticsChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[var(--highlight)] flex-shrink-0"
              aria-label={t("consent.modal.categories.analytics.title")}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t("consent.modal.categories.analytics.title")}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("consent.modal.categories.analytics.description")}</p>
            </div>
          </label>

          {/* Newsletter — optional, only if logged in */}
          {firebaseUser && user && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletterChecked}
                onChange={(e) => setNewsletterChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--highlight)] flex-shrink-0"
                aria-label={t("consent.modal.categories.newsletter.title")}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t("consent.modal.categories.newsletter.title")}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t("consent.modal.categories.newsletter.description")}</p>
              </div>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            ref={rejectButtonRef}
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-full border-2 border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t("consent.modal.rejectButton")}
          </button>
          <button
            onClick={handleAcceptAll}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-full text-sm font-semibold text-[var(--text2)] transition-colors disabled:opacity-50"
            style={{ background: "linear-gradient(to right, var(--highlight), var(--highlight-dark))" }}
          >
            {loading ? t("consent.modal.acceptingButton") : t("consent.modal.acceptButton")}
          </button>
        </div>

        {/* Links */}
        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-gray-400">
            {t("consent.modal.links.prefix")}{" "}
            <a href="/consent/cookies" target="_blank" rel="noreferrer" className="underline hover:text-[var(--highlight)]">
              {t("consent.modal.cookies")}
            </a>
            {t("consent.modal.links.separator")}
            <a href="/consent/privacy" target="_blank" rel="noreferrer" className="underline hover:text-[var(--highlight)]">
              {t("consent.modal.privacy")}
            </a>
            {t("consent.modal.links.separator")}
            <a href="/consent/terms" target="_blank" rel="noreferrer" className="underline hover:text-[var(--highlight)]">
              {t("consent.modal.terms")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
