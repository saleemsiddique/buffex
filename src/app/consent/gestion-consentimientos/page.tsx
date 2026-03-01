/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars*/

"use client";

import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/context/user-context";
import { emitConsentUpdated } from "@/lib/consent-events";
import { useTranslation } from "react-i18next";

const CONSENT_TYPES = ["terms_of_service", "privacy_policy", "cookies_policy"] as const;
const POLICY_VERSION = process.env.NEXT_PUBLIC_POLICY_VERSION || "1.0.5";

type ConsentState = Record<typeof CONSENT_TYPES[number], boolean>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function GestionConsentimientosPage() {
  const { t } = useTranslation();
  
  const { firebaseUser, user, loading: userLoading } = useUser();
  const isAnonymous = !firebaseUser;

  // Estado para usuarios autenticados
  const [status, setStatus] = useState<ConsentState>({
    terms_of_service: false,
    privacy_policy: false,
    cookies_policy: false,
  });
  const [localRecord, setLocalRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // LOCAL KEYS (solo se usan para usuarios autenticados)
  const LOCAL_KEY_FULL = "culinarium_cookie_consent";
  const LOCAL_KEY_VERSIONS = "consent_versions";
  const LAST_UPDATE_KEY = "culinarium_cookie_consent_last_update";
  const LEGACY_KEY = "consent_version";

  // ---- Helpers para usuarios autenticados ----
  function persistLocalAccepted(acceptedTrue: any[], createdByAuthenticated: boolean, userId: string | null) {
    try {
      // Si no hay aceptados, eliminar SOLO las claves de consent (no llamar localStorage.clear)
      if (!acceptedTrue || acceptedTrue.length === 0) {
        localStorage.removeItem(LOCAL_KEY_VERSIONS);
        localStorage.removeItem(LOCAL_KEY_FULL);
        localStorage.removeItem(LAST_UPDATE_KEY);
        localStorage.removeItem(LEGACY_KEY);
        setLocalRecord(null);
        return;
      }

      const versionsMap: Record<string, string> = {};
      acceptedTrue.forEach((a: any) => {
        if (a && a.type) versionsMap[a.type] = a.version || POLICY_VERSION;
      });
      localStorage.setItem(LOCAL_KEY_VERSIONS, JSON.stringify(versionsMap));

      const fullLocal = {
        accepted: acceptedTrue.map((a: any) => ({
          type: a.type,
          version: a.version || POLICY_VERSION,
          granted: !!a.granted,
          details: a.details || {},
        })),
        accepted_types: acceptedTrue.map((a: any) => a.type),
        client_timestamp: new Date().toISOString(),
        created_by_authenticated: !!createdByAuthenticated,
        details: {},
        meta: {
          origin: typeof window !== "undefined" ? window.location.origin : null,
          path: typeof window !== "undefined" ? window.location.pathname : null,
          ref: typeof document !== "undefined" ? document.referrer || null : null,
        },
        timestamp: new Date().toLocaleString(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent || null : null,
        user_id: userId || null,
      };

      localStorage.setItem(LOCAL_KEY_FULL, JSON.stringify(fullLocal));
      localStorage.setItem(LAST_UPDATE_KEY, String(Date.now()));

      const allAccepted = CONSENT_TYPES.every((t) => versionsMap[t] === POLICY_VERSION);
      if (allAccepted) {
        localStorage.setItem(LEGACY_KEY, POLICY_VERSION);
      } else {
        localStorage.removeItem(LEGACY_KEY);
      }

      setLocalRecord(fullLocal);
    } catch (err) {
      console.warn("persistLocalAccepted error:", err);
    }
  }

  function buildAcceptedArray(fromStatus: ConsentState) {
    const POLICY_TEXTS: Record<string, string> = {
      terms_of_service: "Aceptación de Términos y Condiciones (versión).",
      privacy_policy: "Aceptación de Política de Privacidad (versión).",
      cookies_policy: "Aceptación de Política de Cookies (versión).",
    };

    return CONSENT_TYPES.map((t) => ({
      type: t,
      version: POLICY_VERSION,
      granted: !!fromStatus[t],
      details: POLICY_TEXTS[t] || {},
    }));
  }

  // ---- Effects (SOLO para usuarios autenticados hacemos lecturas/escrituras) ----
  useEffect(() => {
    // Si es anónimo no hacemos lecturas ni escrituras en localStorage ni intentamos fetch
    if (isAnonymous) {
      // Quitamos cualquier rastro visual y dejamos que el ConsentModal maneje el flujo para anónimos
      setLocalRecord(null);
      setStatus({
        terms_of_service: false,
        privacy_policy: false,
        cookies_policy: false,
      });
      setLoading(false);
      return;
    }

    // Usuario autenticado: comprobamos estado en servidor y sincronizamos local
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obtener token
        let token: string | null = null;
        if (firebaseUser) {
          token = await firebaseUser.getIdToken();
        }

        if (!token) {
          setError("No se pudo obtener token de autenticación.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/consent", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setError("No se pudo obtener el estado de consentimientos desde el servidor.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        // API returns {version, granted} objects (or null if no record)
        const nextStatus: ConsentState = {
          terms_of_service: data.terms_of_service?.version === POLICY_VERSION && data.terms_of_service?.granted === true,
          privacy_policy: data.privacy_policy?.version === POLICY_VERSION && data.privacy_policy?.granted === true,
          cookies_policy: data.cookies_policy?.version === POLICY_VERSION && data.cookies_policy?.granted === true,
        };
        setStatus(nextStatus);

        const acceptedTypes = CONSENT_TYPES.filter((t) => nextStatus[t]);
        const acceptedTrue = acceptedTypes.map((t) => ({ type: t, version: POLICY_VERSION, granted: true, details: {} }));
        persistLocalAccepted(acceptedTrue, true, firebaseUser?.uid || null);
      } catch (err) {
        console.error(err);
        setError("Error comprobando el estado de consentimientos.");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, userLoading]);

  // ---- Actions para usuarios autenticados ----
  const toggle = (type: typeof CONSENT_TYPES[number]) => {
    setStatus((s) => ({ ...s, [type]: !s[type] }));
  };

  async function updateConsents(newStatus: ConsentState) {
    setSaving(true);
    setMessage(null);
    setError(null);

    const accepted = buildAcceptedArray(newStatus);
    const clientTimestamp = new Date().toISOString();
    const meta = {
      path: typeof window !== "undefined" ? window.location.pathname : null,
      origin: typeof window !== "undefined" ? window.location.origin : null,
      ref: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent || null : null,
      language: typeof navigator !== "undefined" ? navigator.language || null : null,
      platform: typeof navigator !== "undefined" ? navigator.platform || null : null,
    };

    try {
      if (!firebaseUser) throw new Error("Usuario no autenticado.");

      const token = await firebaseUser.getIdToken();
      const userId = firebaseUser.uid;
      const payload: any = {
        accepted,
        user_id: userId,
        details: { timestamp: clientTimestamp, version: POLICY_VERSION, meta },
        origin: meta.origin,
        ref: meta.ref,
        path: meta.path,
        client_timestamp: clientTimestamp,
      };

      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error guardando consentimiento en servidor");
      }

      const acceptedTrue = accepted.filter((a: any) => !!a.granted);
      persistLocalAccepted(acceptedTrue, true, userId);

      // client-side effects: analytics toggle (best-effort)
      if (!newStatus.cookies_policy) {
        // try to disable analytics SDKs (best-effort)
        ["_ga", "_gid", "_gat"].forEach((c) => {
          document.cookie = `${c}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        });
      }

      emitConsentUpdated(!!newStatus.cookies_policy, { accepted_types: acceptedTrue.map((a: any) => a.type) });

      setStatus(newStatus);
      setMessage("Consentimientos actualizados correctamente en el servidor.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error actualizando consentimientos");
    } finally {
      setSaving(false);
    }
  }

  const handleSave = async () => {
    await updateConsents(status);
  };

  const handleRevokeAll = async () => {
    // Solo para usuarios autenticados
    const revokeStatus: ConsentState = { terms_of_service: false, privacy_policy: false, cookies_policy: false };
    await updateConsents(revokeStatus);
  };

  // ---- Render ----
  if (isAnonymous) {
    // Si el usuario no está autenticado NO permitimos gestión desde esta página.
    return (
      <motion.div
        className="w-screen min-h-screen bg-gray-950 text-gray-300 p-6 lg:py-24 flex items-center justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-xl text-center">
          <h1 className="text-2xl font-bold mb-4">{t("consentManagement.unauthenticated.title")}</h1>
          <p className="text-sm text-gray-400 mb-6">
            {t("consentManagement.unauthenticated.description")}
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/auth/login"
              className="px-6 py-3 rounded-full bg-orange-600 text-white hover:bg-orange-700"
            >
              {t("consentManagement.unauthenticated.loginButton")}
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full border border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {t("consentManagement.unauthenticated.backButton")}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Usuario autenticado: mostramos interfaz de gestión
  return (
    <motion.div
      className="w-screen min-h-screen bg-gray-950 text-gray-300 p-6 lg:py-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={itemVariants}
        className="max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6 lg:p-8 shadow-xl"
      >
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-500 text-transparent bg-clip-text mb-2">
          {t("consentManagement.title")}
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          {t("consentManagement.subtitle")}
        </p>

        {loading ? (
          <p className="text-center py-8 text-gray-500">{t("consentManagement.loading")}</p>
        ) : (
          <div className="space-y-6">
            {CONSENT_TYPES.map((tr) => (
              <div key={tr} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div>
                  <p className="font-semibold text-gray-200">
                    {tr === "terms_of_service" ? t(`consentManagement.types.${tr}.title`) : tr === "privacy_policy" ? t(`consentManagement.types.${tr}.title`) : t(`consentManagement.types.${tr}.title`)}
                  </p>
                  <p className="text-sm text-gray-500">{t("consentManagement.version")}: {POLICY_VERSION}</p>
                </div>
                <div className="flex items-center gap-4">
                  {tr === "terms_of_service" || tr === "privacy_policy" ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-700 text-gray-400 text-sm cursor-not-allowed select-none">
                      <Lock className="w-3.5 h-3.5" /> {t("consentManagement.alwaysRequired")}
                    </span>
                  ) : (
                    <button
                      onClick={() => toggle(tr)}
                      className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${status[tr]
                        ? "bg-orange-600 text-white hover:bg-orange-700"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      aria-pressed={status[tr]}
                    >
                      {status[tr] ? t("consentManagement.accepted")
                        : t("consentManagement.rejected")}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-3 rounded-full font-medium transition ${saving ? "bg-orange-800 text-gray-500 cursor-not-allowed" : "bg-orange-600 text-white hover:bg-orange-700"}`}
              >
                {saving ? t("consentManagement.saving") 
                  : t("consentManagement.saveButton")}
              </button>
              <button
                onClick={handleRevokeAll}
                disabled={saving}
                className={`px-6 py-3 rounded-full font-medium transition ${saving ? "bg-red-800 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
              >
                {saving ? t("consentManagement.processing") 
                  : t("consentManagement.revokeAllButton")}
              </button>
            </div>

            {message && <p className="mt-4 text-green-500">{message}</p>}
            {error && <p className="mt-4 text-red-500">{error}</p>}

            <div className="mt-4 text-sm text-gray-500">
              <p>
                {t("consentManagement.rightsNotice")}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
