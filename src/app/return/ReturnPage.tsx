"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle, XCircle } from "lucide-react";

interface SessionData {
  status: string;
}

function SparkleParticle({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      initial={{ opacity: 1, scale: 0, y: 0 }}
      animate={{ opacity: 0, scale: 1.5, y: -80 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    />
  );
}

const SPARKLE_COLORS = ["#F97316", "#FBBF24", "#FDE68A", "#FB923C", "#FCD34D"];

export default function CheckoutReturn() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    async function checkSession() {
      if (!sessionId) {
        setError(t("checkout.return.errors.noSessionId"));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/check-session?session_id=${sessionId}`);
        const data = await response.json();

        if (response.ok) {
          setSession(data.session);
          if (data.session.status === "complete") {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("token_update"));
              setShowSparkles(true);
            }, 400);
          }
        } else {
          setError(data.error || t("checkout.return.errors.sessionError"));
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setError(t("checkout.return.errors.paymentError"));
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [sessionId, t]);

  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    style: {
      width: `${6 + Math.random() * 8}px`,
      height: `${6 + Math.random() * 8}px`,
      backgroundColor: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
      left: `${15 + Math.random() * 70}%`,
      top: `${20 + Math.random() * 40}%`,
    } as React.CSSProperties,
  }));

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-white border-t-transparent rounded-full"
              style={{ borderWidth: 3 }}
            />
          </div>
          <p className="text-gray-600 font-medium">{t("checkout.return.loading")}</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-red-100"
        >
          <div className="w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">{t("checkout.return.general.errorTitle")}</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:from-orange-600 hover:to-amber-600"
          >
            {t("checkout.return.general.homeButton")}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (session?.status === "open") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-orange-100"
        >
          <div className="w-16 h-16 mx-auto mb-5 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-orange-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">{t("checkout.return.failed.title")}</h1>
          <p className="text-gray-500 mb-6">{t("checkout.return.failed.message")}</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t("checkout.return.failed.button")}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (session?.status === "complete") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4 overflow-hidden">
        {/* Sparkles */}
        {showSparkles && sparkles.map((s) => (
          <SparkleParticle key={s.id} style={s.style} />
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center overflow-hidden"
          style={{ border: "1px solid rgba(251, 191, 36, 0.3)" }}
        >
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-t-3xl" />

          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F97316 100%)" }}
          >
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="w-12 h-12 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-extrabold text-gray-800 mb-3"
          >
            {t("checkout.return.success.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="text-gray-500 mb-8 leading-relaxed"
          >
            {t("checkout.return.success.message")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              href="/kitchen"
              className="inline-block px-10 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:from-amber-500 hover:to-orange-600 text-lg"
            >
              {t("checkout.return.success.button")} →
            </Link>
          </motion.div>

          {/* Decorative brand name */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 text-xs font-semibold tracking-widest text-amber-400 uppercase"
          >
            Buffex ✦
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Fallback processing state
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full border-white border-t-transparent"
            style={{ border: "3px solid white", borderTopColor: "transparent" }}
          />
        </div>
        <p className="text-gray-600 font-medium">{t("checkout.return.processing")}</p>
      </motion.div>
    </div>
  );
}
