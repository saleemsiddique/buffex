// app/newsletter/unsubscribe/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

// (opcional) si usas App Router metadata y quieres no indexar
// export const metadata = {
//   title: "Unsubscribe | Buffex",
//   robots: { index: false, follow: false },
// };

export default function UnsubscribeNewsletterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { firebaseUser, user, setNewsletterConsent, refreshUser, loading } = useUser();

  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error" | "auth">("idle");
  const [unsubDate, setUnsubDate] = useState<Date | null>(null);
  const ranRef = useRef(false);

  const formatDateTime = (d?: Date) =>
    d
      ? d.toLocaleString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  useEffect(() => {
    if (ranRef.current) return;
    if (loading) return;

    ranRef.current = true;

    const run = async () => {
      // Si el usuario NO está autenticado, mostramos mensaje para iniciar sesión.
      if (!firebaseUser) {
        setStatus("auth");
        return;
      }

      try {
        setStatus("processing");

        // 1) Desuscribir
        await setNewsletterConsent(false);

        // 2) Refrescar usuario para obtener `serverTimestamp()` real
        await refreshUser?.();

        // 3) Obtener fecha desde Firestore si está disponible (preferible)
        const serverTS =
          user?.lastNewsletterConsentCanceledAt &&
          (typeof user.lastNewsletterConsentCanceledAt.toDate === "function"
            ?
              user.lastNewsletterConsentCanceledAt.toDate()
            : null);

        setUnsubDate(serverTS || new Date()); // fallback: hora local si aún no sincroniza
        setStatus("done");
      } catch (err) {
        console.error("Unsubscribe error:", err);
        setStatus("error");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, firebaseUser]);

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/90 border border-orange-100 rounded-2xl shadow-xl p-8 text-center">
        {status === "processing" || status === "idle" ? (
          <>
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--highlight)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
              {t("newsletter.unsubscribe.processingTitle") || "Processing your request"}
            </h1>
            <p className="text-[var(--foreground)]/70">
              {t("newsletter.unsubscribe.processingMsg") || "Please wait a moment…"}
            </p>
          </>
        ) : null}

        {status === "auth" ? (
          <>
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
              {t("newsletter.unsubscribe.signInRequiredTitle") || "Sign in required"}
            </h1>
            <p className="text-[var(--foreground)]/70 mb-6">
              {t("newsletter.unsubscribe.signInRequiredMsg") ||
                "To manage your newsletter preferences, please sign in to your account."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/login")} className="bg-[var(--highlight)] text-white rounded-xl">
                {t("newsletter.unsubscribe.signInButton") || "Sign in"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                {t("newsletter.unsubscribe.backHome") || "Back to home"}
              </Button>
            </div>
          </>
        ) : null}

        {status === "done" ? (
          <>
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
              {t("newsletter.unsubscribe.successTitle") || "You have been unsubscribed"}
            </h1>
            <p className="text-[var(--foreground)]/80 mb-1">
              {t("newsletter.unsubscribe.successMsg") || "You will no longer receive our newsletter."}
            </p>
            {unsubDate && (
              <p className="text-sm text-[var(--foreground)]/60 mb-6">
                {t("newsletter.unsubscribe.unsubscribedAt", {
                  date: formatDateTime(unsubDate),
                }) || `Unsubscribed on ${formatDateTime(unsubDate)}`}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/profile")} className="bg-[var(--highlight)] text-white rounded-xl">
                {t("newsletter.unsubscribe.managePrefs") || "Manage preferences"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                {t("newsletter.unsubscribe.backHome") || "Back to home"}
              </Button>
            </div>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
              {t("newsletter.unsubscribe.errorTitle") || "Something went wrong"}
            </h1>
            <p className="text-[var(--foreground)]/70 mb-6">
              {t("newsletter.unsubscribe.errorMsg") ||
                "We couldn't update your newsletter preference. Please try again."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.refresh()} className="bg-[var(--highlight)] text-white rounded-xl">
                {t("newsletter.unsubscribe.tryAgain") || "Try again"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/profile")}>
                {t("newsletter.unsubscribe.managePrefs") || "Manage preferences"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
