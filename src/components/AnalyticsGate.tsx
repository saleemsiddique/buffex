/* eslint-disable @typescript-eslint/no-explicit-any */

// components/AnalyticsGate.tsx
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/gtag";

const DynamicAnalytics = dynamic(
  () => import("@vercel/analytics/react").then((m) => m.Analytics),
  { ssr: false }
);

const LOCAL_KEY_VERSIONS = "consent_versions";
const LOCAL_KEY_FULL = "buffex_cookie_consent";

function hasAnalyticsConsentFromLocal(): boolean {
  try {
    const fullRaw = localStorage.getItem(LOCAL_KEY_FULL);
    if (fullRaw) {
      const full = JSON.parse(fullRaw);
      if (typeof full.analytics === "boolean") return !!full.analytics;
      if (Array.isArray(full.accepted_types) && full.accepted_types.includes("cookies_policy")) return true;
      if (Array.isArray(full.accepted)) {
        return full.accepted.some((it: any) => it?.type === "cookies_policy" && it?.granted);
      }
    }
    const versionsRaw = localStorage.getItem(LOCAL_KEY_VERSIONS);
    if (versionsRaw) {
      const versions = JSON.parse(versionsRaw);
      if (versions && typeof versions === "object") {
        return !!versions["cookies_policy"];
      }
    }
  } catch {}
  return false;
}

export default function AnalyticsGate() {
  // Inicializamos a false (coincide con el servidor)
  const [allowed, setAllowed] = useState<boolean>(false);

  useEffect(() => {
    // Tras montar, leemos localStorage y actualizamos (esto evita mismatch)
    setAllowed(hasAnalyticsConsentFromLocal());

    function onConsentUpdate(e: Event) {
      try {
        const custom = e as CustomEvent;
        if (custom?.detail && typeof custom.detail.analytics === "boolean") {
          setAllowed(!!custom.detail.analytics);
          return;
        }
      } catch {}
      // fallback
      setAllowed(hasAnalyticsConsentFromLocal());
    }

    window.addEventListener("consent:updated", onConsentUpdate as EventListener);
    window.addEventListener("storage", onConsentUpdate as EventListener);

    return () => {
      window.removeEventListener("consent:updated", onConsentUpdate as EventListener);
      window.removeEventListener("storage", onConsentUpdate as EventListener);
    };
  }, []);

  if (!allowed) return null;
  return (
    <>
      <DynamicAnalytics />
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script
            id="gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
              `,
            }}
          />
        </>
      )}
    </>
  );
}
