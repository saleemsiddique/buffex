"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, Zap, Crown, ChefHat, ArrowRight,
  Star, Sparkles, CalendarDays,
} from "lucide-react";
import { CustomUser } from "@/context/user-context";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useTranslation } from "react-i18next";
import Link from "next/link";

interface TokensModalProps {
  onClose: () => void;
  user: CustomUser | null;
}

// ─── Checkout hook ────────────────────────────────────────────────────────────
function useCheckout(userId?: string | null) {
  const [loading, setLoading] = useState<string | null>(null);
  const go = useCallback(async (priceId: string) => {
    if (!priceId) return;
    setLoading(priceId);
    try {
      const res = await fetch("/api/embedded-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId }),
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }, [userId]);
  return { go, loading };
}

// ─── Already-subscribed view ──────────────────────────────────────────────────
function SubscribedView({
  user, onClose, t,
}: {
  user: CustomUser | null;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, opts?: any) => string;
}) {
  const renewalDate = user?.lastRenewal
    ? new Date(
        user.lastRenewal.toDate().getTime() + 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="px-5 pb-6 pt-3 flex flex-col items-center text-center gap-5">
      <div className="relative mt-2">
        <div
          className="rounded-3xl flex items-center justify-center shadow-lg"
          style={{
            width: 72,
            height: 72,
            background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)",
            boxShadow: "0 8px 24px rgba(249,115,22,.35)",
          }}
        >
          <Star className="w-9 h-9 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
          style={{ border: "2px solid #111111" }}>
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white">{t("premium.modal.subscribed.title")}</h3>
        <p className="text-sm text-white/50 mt-1 max-w-[260px]">{t("premium.modal.subscribed.message")}</p>
        {renewalDate && (
          <p className="text-xs text-white/35 mt-3 flex items-center justify-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 flex-none" />
            {t("premium.modal.subscribed.renewal", { date: renewalDate })}
          </p>
        )}
      </div>

      <div className="flex gap-2.5 w-full">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.6)", background: "transparent" }}
        >
          {t("premium.modal.subscribed.close")}
        </button>
        <Link
          href="/profile"
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)", color: "#fff" }}
        >
          {t("premium.modal.subscribed.manage")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
);

// ─── Main component ───────────────────────────────────────────────────────────
export const TokensModal: React.FC<TokensModalProps> = ({ onClose, user }) => {
  useBodyScrollLock(true);
  const { t } = useTranslation();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const extra      = user?.extra_recipes  || 0;
  const monthly    = user?.monthly_recipes || 0;
  const totalRecipes = extra + monthly;

  const isSubscribed =
    user?.isSubscribed &&
    (user?.subscriptionStatus === "active" || user?.subscriptionStatus === "cancel_at_period_end");

  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM        || "";
  const annualPriceId  = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_ANNUAL || monthlyPriceId;
  const paygPriceId    = process.env.NEXT_PUBLIC_STRIPE_PRICE_PAYG           || "";
  const subPriceId     = billing === "annual" ? annualPriceId : monthlyPriceId;

  const features: string[] = t("premium.modal.notSubscribed.features", {
    returnObjects: true,
  }) as string[];

  const { go, loading } = useCheckout(user?.uid);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Pricing display
  const subPrice    = billing === "annual" ? "€79.99" : "€9.99";
  const subPeriod   = billing === "annual" ? t("tokens.modal.perYear") : t("tokens.modal.perMonth");
  const subPerMonth = billing === "annual"
    ? `${t("premium.modal.notSubscribed.priceAnnualPerMonth")} · ${t("premium.modal.notSubscribed.annualSave")}`
    : null;

  const spring = { type: "spring" as const, stiffness: 400, damping: 34 };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label={t("tokens.modal.title")}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 56 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={spring}
          className="w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[88vh]"
          style={{ background: "#111111" }}
        >
          {/* ── Gradient header ──────────────────────────────────────────────── */}
          <div className="relative overflow-hidden flex-none">
            {/* Background gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg,#c2410c 0%,#ea580c 45%,#f97316 100%)",
              }}
            />
            {/* Subtle noise texture layer */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2) 0%, transparent 60%)",
              }}
            />

            <div className="relative z-10 px-5 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className="rounded-2xl flex items-center justify-center flex-none"
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <ChefHat style={{ width: 22, height: 22, color: "#fff" }} />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-white leading-tight tracking-tight">
                    {isSubscribed ? t("premium.modal.title") : "Buffex Premium"}
                  </h2>
                  <p className="text-[12px] text-white/70 mt-0.5 font-medium">
                    {isSubscribed ? (
                      <span className="flex items-center gap-1">
                        <Sparkles style={{ width: 11, height: 11 }} />
                        {t("header.tokens.unlimited")}
                      </span>
                    ) : (
                      <>
                        {t("tokens.modal.currentTokens")}{" "}
                        <span className="font-bold text-white">{totalRecipes}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label={t("tokens.modal.close")}
                className="rounded-full p-1.5 transition-colors"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* ── Scrollable body ──────────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1">
            {isSubscribed ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <SubscribedView user={user} onClose={onClose} t={t as any} />
            ) : (
              <div className="px-5 pt-5 pb-6 flex flex-col gap-3.5">

                {/* Billing toggle — dark segmented control */}
                <div
                  className="flex rounded-full p-[3px] gap-[2px]"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  {(["monthly", "annual"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBilling(b)}
                      className="relative flex-1 py-[7px] text-[12px] font-semibold rounded-full transition-colors duration-150 flex items-center justify-center gap-1.5 select-none"
                      style={{ color: billing === b ? "#fff" : "rgba(255,255,255,0.45)" }}
                    >
                      {billing === b && (
                        <motion.div
                          layoutId="billingSlider"
                          className="absolute inset-0 rounded-full"
                          style={{ background: "rgba(249,115,22,0.80)" }}
                          transition={spring}
                        />
                      )}
                      <span className="relative z-10">
                        {b === "monthly"
                          ? t("premium.modal.notSubscribed.billingMonthly")
                          : t("premium.modal.notSubscribed.billingAnnual")}
                      </span>
                      {b === "annual" && (
                        <span
                          className="relative z-10 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none tracking-wide"
                          style={{ background: "#10b981", color: "#fff" }}
                        >
                          −33%
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Premium card ───────────────────────────────────────────── */}
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid rgba(249,115,22,0.35)",
                    boxShadow: "0 0 40px rgba(249,115,22,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Popular badge */}
                  <div
                    className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wide"
                    style={{ background: "linear-gradient(90deg,#f97316,#ea580c)" }}
                  >
                    <Sparkles style={{ width: 10, height: 10 }} />
                    {t("tokens.modal.packages.150.promo")}
                  </div>

                  <div className="p-5 pt-4">
                    {/* Label row */}
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center flex-none"
                        style={{ background: "rgba(249,115,22,0.15)" }}
                      >
                        <Crown style={{ width: 14, height: 14, color: "#f97316" }} />
                      </div>
                      <span className="text-sm font-bold text-white">{t("premium.modal.title")}</span>
                    </div>

                    {/* Price — animated on billing change */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={billing}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.14 }}
                        className="mb-1"
                      >
                        <div className="flex items-baseline gap-1">
                          <span className="text-[32px] font-extrabold text-white tracking-tight leading-none">
                            {subPrice}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{subPeriod}</span>
                        </div>
                        {subPerMonth && (
                          <p className="text-[11px] font-semibold mt-1" style={{ color: "#34d399" }}>{subPerMonth}</p>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Recipes pill */}
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mt-3 mb-4"
                      style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}
                    >
                      <ChefHat style={{ width: 12, height: 12 }} />
                      150 {t("tokens.modal.recipesPerMonth")}
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2 mb-5">
                      {features.slice(0, 5).map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] leading-snug" style={{ color: "rgba(255,255,255,0.65)" }}>
                          <Check
                            className="flex-none mt-[1px]"
                            style={{ width: 13, height: 13, color: "#34d399" }}
                            strokeWidth={2.5}
                          />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {/* CTA with shimmer */}
                    <button
                      onClick={() => go(subPriceId)}
                      disabled={!!loading}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)",
                        boxShadow: "0 4px 20px rgba(249,115,22,.40)",
                      }}
                    >
                      {/* Shimmer layer */}
                      {!loading && (
                        <span
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%)",
                            animation: "shimmer 2.2s infinite",
                            backgroundSize: "200% 100%",
                          }}
                        />
                      )}
                      <style>{`
                        @keyframes shimmer {
                          0%   { background-position: -200% 0; }
                          100% { background-position: 200% 0; }
                        }
                      `}</style>
                      <span className="relative z-10 flex items-center gap-2">
                        {loading === subPriceId ? <Spinner /> : (
                          <>
                            {t("checkout.subscribe")}
                            <ArrowRight style={{ width: 15, height: 15 }} />
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ── Separator ─────────────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {t("tokens.modal.or")}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* ── PAYG card ──────────────────────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => go(paygPriceId)}
                  disabled={!!loading}
                  className="w-full rounded-2xl p-4 text-left transition-all duration-150 disabled:opacity-60 group"
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "#1a1a1a",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-none"
                        style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
                      >
                        <Zap style={{ width: 15, height: 15, color: "#f59e0b" }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white">
                          {t("tokens.modal.packages.150.label")}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          €0.17 {t("tokens.modal.promoTypes.perToken")} · {t("tokens.modal.oneTime")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-none">
                      {loading === paygPriceId ? (
                        <Spinner />
                      ) : (
                        <>
                          <p className="text-lg font-extrabold text-white">€4.99</p>
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{t("tokens.modal.oneTime")}</p>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {/* Disclaimer */}
                <p className="text-center text-[11px] leading-relaxed px-1" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {t("tokens.modal.disclaimer")}
                </p>

              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
