"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CustomUser, useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCard, Calendar, AlertTriangle, Edit, Save, X,
  AlertCircle, CheckCircle, User, Mail, Crown, Coins,
  LogOut, History, BookOpen, Zap, ChevronRight, ArrowDownCircle,
} from "lucide-react";
import { useSubscription } from "@/context/subscription-context";
import Onboarding from "@/components/onboarding";
import { TokensModal } from "@/components/SideMenu/TokensModal";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { useCallback } from "react";
import { auth } from "@/lib/firebase";

function useCheckout(userId?: string | null) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const go = useCallback(async (priceId: string) => {
    if (!priceId) return;
    setCheckoutLoading(priceId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/embedded-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ priceId, userId }),
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setCheckoutLoading(null);
    }
  }, [userId]);
  return { go, checkoutLoading };
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
);

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ icon, iconBg, title, message, confirmLabel, confirmStyle, onConfirm, onCancel, loading, cancelLabel }: {
  icon: React.ReactNode; iconBg: string; title: string; message: string;
  confirmLabel: string; confirmStyle: React.CSSProperties;
  onConfirm: () => void; onCancel: () => void; loading: boolean; cancelLabel: string;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-7 text-center"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${iconBg}`}>{icon}</div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/40 mb-7 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center"
            style={confirmStyle}>
            {loading ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Modal ──────────────────────────────────────────────────────────────
function MessageModal({ title, text, isError, onClose }: {
  title: string; text: string; isError: boolean; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-7 text-center"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isError ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
          {isError ? <AlertCircle className="w-7 h-7 text-red-400" /> : <CheckCircle className="w-7 h-7 text-emerald-400" />}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/40 mb-7 text-sm leading-relaxed">{text}</p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>Cerrar</button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
function ProfileContent() {
  const { user, logout, updateUserName, setNewsletterConsent } = useUser();
  const { subscription } = useSubscription();
  const router = useRouter();
  const { t } = useTranslation();

  const { go, checkoutLoading } = useCheckout(user?.uid);
  const paygPriceId   = process.env.NEXT_PUBLIC_STRIPE_PRICE_PAYG           || "";
  const annualPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_ANNUAL || "";

  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelNowDialog, setShowCancelNowDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [newsletterChecked, setNewsletterChecked] = useState(!!user?.newsletterConsent);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.firstName || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [messageModal, setMessageModal] = useState({ visible: false, title: "", text: "", isError: false });

  useEffect(() => { setNewsletterChecked(!!user?.newsletterConsent); }, [user?.newsletterConsent]);

  const totalOfTokens = (user?.monthly_recipes ?? 0) + (user?.extra_recipes ?? 0);
  const isAnnual = !!(
    subscription?.planName?.toLowerCase().includes("anual") ||
    subscription?.planName?.toLowerCase().includes("annual")
  );
  const isActiveSubscription = user?.isSubscribed && !user?.subscriptionCanceled && user?.subscriptionStatus !== "payment_failed";

  const formatDate = (date: string | Date) =>
    (typeof date === "string" ? new Date(date) : date)
      .toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  const msg = (title: string, text: string, isError = false) =>
    setMessageModal({ visible: true, title, text, isError });

  const handleLogout = async () => {
    try { await logout(); router.push("/"); } catch (e) { console.error(e); }
  };

  const handleToggleNewsletter = async (checked: boolean) => {
    if (!setNewsletterConsent) return;
    setNewsletterSaving(true);
    try {
      await setNewsletterConsent(checked);
      setNewsletterChecked(checked);
      msg(t("profile.modals.message.success"), checked ? t("profile.newsletter.subscribed") : t("profile.newsletter.unsubscribed"));
    } catch {
      msg(t("profile.modals.message.error"), t("profile.newsletter.error"), true);
      setNewsletterChecked(p => !p);
    } finally { setNewsletterSaving(false); }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) { msg(t("profile.modals.message.error"), t("profile.personalInfo.nameRequired"), true); return; }
    setIsSavingName(true);
    try {
      if (updateUserName) { await updateUserName(newName.trim()); }
      else {
        const res = await fetch("/api/user/update-name", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.uid, firstName: newName.trim() }) });
        if (!res.ok) throw new Error();
      }
      setIsEditingName(false);
      msg(t("profile.modals.message.success"), t("profile.personalInfo.nameUpdated"));
      if (!updateUserName) window.location.reload();
    } catch { msg(t("profile.modals.message.error"), t("profile.personalInfo.nameError"), true); }
    finally { setIsSavingName(false); }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.uid }) });
      if (!res.ok) throw new Error();
      msg(t("profile.modals.message.success"), t("profile.modals.message.subscriptionCancelled"));
      window.location.reload();
    } catch { msg(t("profile.modals.message.error"), t("profile.modals.message.subscriptionError"), true); }
    finally { setIsLoading(false); setShowCancelDialog(false); }
  };

  const handleCancelImmediateSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel-now", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.uid }) });
      if (!res.ok) throw new Error();
      msg(t("profile.modals.message.success"), t("profile.modals.message.subscriptionCancelledNow"));
      window.location.reload();
    } catch { msg(t("profile.modals.message.error"), t("profile.modals.message.subscriptionError"), true); }
    finally { setIsLoading(false); setShowCancelNowDialog(false); }
  };

  const handleReactivateSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/reactivate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.uid }) });
      if (!res.ok) throw new Error();
      msg(t("profile.modals.message.success"), t("profile.modals.message.subscriptionReactivated"));
      window.location.reload();
    } catch { msg(t("profile.modals.message.error"), t("profile.modals.message.subscriptionReactivateError"), true); }
    finally { setIsLoading(false); setShowReactivateDialog(false); }
  };

  const handleDowngradeToMonthly = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/downgrade-to-monthly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.uid }) });
      if (!res.ok) throw new Error();
      msg("Plan cambiado", "Tu suscripción pasará a €8,99/mes al final del período anual. Sin cargos adicionales.");
      window.location.reload();
    } catch { msg("Error", "No se pudo cambiar el plan. Inténtalo de nuevo.", true); }
    finally { setIsLoading(false); setShowDowngradeDialog(false); }
  };

  const status = (() => {
    if (!user?.isSubscribed) return null;
    if (user?.subscriptionCanceled) return { label: t("profile.subscription.premium.status.cancelled"), color: "#f97316" };
    if (user?.subscriptionStatus === "payment_failed") return { label: t("profile.subscription.premium.status.paymentFailed"), color: "#ef4444" };
    return { label: t("profile.subscription.premium.status.active"), color: "#34d399" };
  })();

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: "#0a0a0a" }}>
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex-none px-6 pt-20 pb-5 flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-none shadow-lg"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 8px 20px rgba(249,115,22,0.3)" }}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              {t("profile.greeting", { name: user?.firstName })}
            </h1>
            <p className="text-white/35 text-xs mt-0.5">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/50 transition-all hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
          <LogOut className="w-4 h-4" />
          {t("profile.logout.button")}
        </button>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-30 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Col 1: Personal ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Name + Email */}
          <div className="rounded-2xl p-5 flex-none"
            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-4">
              {t("profile.personalInfo.title")}
            </p>

            <div className="mb-3">
              <p className="text-[11px] text-white/30 mb-1.5">{t("profile.personalInfo.name")}</p>
              {!isEditingName ? (
                <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: "#1f1f1f", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-white text-sm font-medium">{user?.firstName}</span>
                  <button onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                    <Edit className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    disabled={isSavingName} placeholder={t("profile.personalInfo.namePlaceholder")}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-transparent focus:outline-none"
                    style={{ border: "1px solid rgba(249,115,22,0.5)", background: "#1f1f1f" }} />
                  <div className="flex gap-2">
                    <button onClick={handleSaveName} disabled={isSavingName}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                      style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                      {isSavingName ? <Spinner /> : <><Save className="w-3 h-3" />{t("profile.personalInfo.save")}</>}
                    </button>
                    <button onClick={() => { setNewName(user?.firstName || ""); setIsEditingName(false); }}
                      className="px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                      <X className="w-3.5 h-3.5 text-white/30" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] text-white/30 mb-1.5">{t("profile.personalInfo.email")}</p>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "#1f1f1f", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Mail className="w-3.5 h-3.5 text-white/25 flex-none" />
                <span className="text-white/50 text-sm truncate">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="rounded-2xl p-5 flex-none"
            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">Idioma</p>
            <div className="flex gap-2">
              {(["es", "en"] as const).map(lang => (
                <button key={lang} onClick={() => i18n.changeLanguage(lang)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={i18n.language === lang
                    ? { background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff" }
                    : { background: "#1f1f1f", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {lang === "en" ? "English" : "Español"}
                </button>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="rounded-2xl p-5 flex-none"
            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{t("profile.newsletter.title")}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{t("profile.newsletter.helper")}</p>
              </div>
              <label className="inline-flex items-center cursor-pointer flex-none">
                <input type="checkbox" className="sr-only" checked={newsletterChecked}
                  onChange={e => handleToggleNewsletter(e.target.checked)} disabled={newsletterSaving} />
                <div className="relative w-10 h-[22px] rounded-full transition-colors duration-200"
                  style={{ background: newsletterChecked ? "#f97316" : "rgba(255,255,255,0.1)" }}>
                  <span className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: newsletterChecked ? "translateX(18px)" : "translateX(0)" }} />
                </div>
              </label>
            </div>
          </div>

          {/* How it works */}
          <button onClick={() => setShowOnboarding(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
            style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.35)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.15)")}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-none"
              style={{ background: "rgba(52,211,153,0.12)" }}>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-emerald-400">{t("profile.quickActions.howItWorks")}</span>
          </button>
        </div>

        {/* ── Col 2: Subscription ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {user?.isSubscribed ? (
            <div className="rounded-2xl overflow-hidden flex flex-col h-full"
              style={{ background: "#161616", border: "1px solid rgba(249,115,22,0.2)", boxShadow: "0 0 40px rgba(249,115,22,0.05)" }}>

              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.14),rgba(234,88,12,0.06))", borderBottom: "1px solid rgba(249,115,22,0.12)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}>
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t("profile.subscription.premium.title")}</p>
                    <p className="text-white/35 text-[11px]">
                      {isAnnual ? "Plan anual · €74,99/año" : "Plan mensual · €8,99/mes"}
                    </p>
                  </div>
                </div>
                {status && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: `${status.color}18`, color: status.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                    {status.label}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="rounded-xl p-3.5" style={{ background: "#1f1f1f", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-white/25" />
                    <span className="text-[11px] text-white/30">{t("profile.subscription.premium.nextBilling")}</span>
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {subscription?.endsAt ? formatDate(subscription.endsAt.toDate()) : "N/A"}
                  </p>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: "#1f1f1f", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Coins className="w-3.5 h-3.5 text-white/25" />
                    <span className="text-[11px] text-white/30">{t("profile.subscription.premium.availableTokens")}</span>
                  </div>
                  <p className="font-bold text-base" style={{ color: "#f97316" }}>{totalOfTokens}</p>
                </div>
              </div>

              {/* Plan actions */}
              <div className="px-4 pb-4 space-y-2 mt-auto">

                {/* Buy extra tokens — always visible for subscribers */}
                <button onClick={() => go(paygPriceId)} disabled={!!checkoutLoading}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all disabled:opacity-50"
                  style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.18)")}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none"
                      style={{ background: "rgba(245,158,11,0.15)" }}>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white/75">+30 recetas extra</p>
                      <p className="text-[11px] text-white/30">Pago único · no caducan</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-400">
                    {checkoutLoading === paygPriceId ? <Spinner /> : "€3,99"}
                  </span>
                </button>

                {/* Upgrade monthly → annual */}
                {isActiveSubscription && !isAnnual && (
                  <button onClick={() => go(annualPriceId)} disabled={!!checkoutLoading}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all disabled:opacity-50"
                    style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.45)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.2)")}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none"
                        style={{ background: "rgba(249,115,22,0.15)" }}>
                        <Crown className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white/75">Pasarte al plan anual</p>
                        <p className="text-[11px] text-emerald-400/80">Ahorra 30% · €6,25/mes</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-orange-400">
                      {checkoutLoading === annualPriceId ? <Spinner /> : "€74,99"}
                    </span>
                  </button>
                )}

                {/* Downgrade annual → monthly */}
                {isActiveSubscription && isAnnual && (
                  <button onClick={() => setShowDowngradeDialog(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
                    <ArrowDownCircle className="w-4 h-4 text-white/25 flex-none" />
                    <div>
                      <p className="text-sm font-semibold text-white/50">Bajar a plan mensual</p>
                      <p className="text-[11px] text-white/25 mt-0.5">Al final del período · €8,99/mes</p>
                    </div>
                  </button>
                )}

                {/* Cancel */}
                {isActiveSubscription && (
                  <button onClick={() => setShowCancelDialog(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.1)")}>
                    <AlertTriangle className="w-4 h-4 text-red-400/40 flex-none" />
                    <p className="text-sm font-semibold text-red-400/60">{t("profile.subscription.premium.cancel")}</p>
                  </button>
                )}

                {/* Payment failed */}
                {user?.subscriptionStatus === "payment_failed" && (
                  <button onClick={() => setShowCancelNowDialog(true)}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: "#ef4444" }}>
                    {t("profile.subscription.premium.cancelNow")}
                  </button>
                )}

                {/* Cancelled → reactivate */}
                {user?.isSubscribed && user?.subscriptionCanceled && (
                  <div className="rounded-xl p-3.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <p className="text-red-300/60 text-xs text-center mb-2.5">
                      {t("profile.subscription.premium.cancelledNotice", { date: subscription?.endsAt ? formatDate(subscription.endsAt.toDate()) : "—" })}
                    </p>
                    <button onClick={() => setShowReactivateDialog(true)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                      <Zap className="w-3.5 h-3.5" />{t("profile.subscription.premium.reactivate")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Free plan upgrade
            <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full"
              style={{ background: "#161616", border: "1px dashed rgba(249,115,22,0.25)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 8px 24px rgba(249,115,22,0.3)" }}>
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1.5">{t("profile.subscription.free.title")}</h2>
              <p className="text-white/35 text-sm mb-5 leading-relaxed">{t("profile.subscription.free.description")}</p>
              <button onClick={() => setShowPremium(true)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }}>
                {t("profile.subscription.free.subscribe")}
              </button>
            </div>
          )}
        </div>

        {/* ── Col 3: Actions ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 px-1">
            {t("profile.quickActions.title")}
          </p>

          {[
            { icon: <CreditCard className="w-4 h-4 text-[#f97316]" />, label: t("profile.quickActions.billing"), onClick: () => router.push("/profile/billing") },
            { icon: <History className="w-4 h-4 text-[#f97316]" />, label: t("profile.quickActions.paymentHistory"), onClick: () => router.push("/profile/payment_history") },
          ].map(({ icon, label, onClick }) => (
            <button key={label} onClick={onClick}
              className="w-full flex items-center justify-between p-4 rounded-2xl transition-all group text-left"
              style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.15)" }}>
                  {icon}
                </div>
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}
      {showCancelDialog && (
        <ConfirmDialog
          icon={<AlertTriangle className="w-7 h-7 text-red-400" />} iconBg="bg-red-500/10"
          title={t("profile.modals.cancelSubscription.title")} message={t("profile.modals.cancelSubscription.message")}
          confirmLabel={t("profile.modals.cancelSubscription.confirm")} confirmStyle={{ background: "#ef4444" }}
          cancelLabel={t("profile.modals.cancelSubscription.keep")}
          onConfirm={handleCancelSubscription} onCancel={() => setShowCancelDialog(false)} loading={isLoading}
        />
      )}
      {showCancelNowDialog && (
        <ConfirmDialog
          icon={<AlertTriangle className="w-7 h-7 text-red-400" />} iconBg="bg-red-500/10"
          title={t("profile.modals.cancelNow.title")} message={t("profile.modals.cancelNow.message")}
          confirmLabel={t("profile.modals.cancelNow.confirm")} confirmStyle={{ background: "#ef4444" }}
          cancelLabel={t("profile.modals.cancelNow.keep")}
          onConfirm={handleCancelImmediateSubscription} onCancel={() => setShowCancelNowDialog(false)} loading={isLoading}
        />
      )}
      {showReactivateDialog && (
        <ConfirmDialog
          icon={<Zap className="w-7 h-7 text-emerald-400" />} iconBg="bg-emerald-500/10"
          title={t("profile.modals.reactivate.title")} message={t("profile.modals.reactivate.message")}
          confirmLabel={t("profile.modals.reactivate.confirm")} confirmStyle={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
          cancelLabel={t("profile.modals.reactivate.cancel")}
          onConfirm={handleReactivateSubscription} onCancel={() => setShowReactivateDialog(false)} loading={isLoading}
        />
      )}
      {showDowngradeDialog && (
        <ConfirmDialog
          icon={<ArrowDownCircle className="w-7 h-7 text-orange-400" />} iconBg="bg-orange-500/10"
          title="Cambiar a plan mensual"
          message="Al final del período anual tu suscripción pasará a €8,99/mes con 90 recetas. Sin cargos adicionales ahora."
          confirmLabel="Confirmar cambio" confirmStyle={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
          cancelLabel="Mantener plan anual"
          onConfirm={handleDowngradeToMonthly} onCancel={() => setShowDowngradeDialog(false)} loading={isLoading}
        />
      )}
      {messageModal.visible && (
        <MessageModal title={messageModal.title} text={messageModal.text} isError={messageModal.isError}
          onClose={() => setMessageModal({ ...messageModal, visible: false })} />
      )}
      {showPremium && (
        <TokensModal user={user as CustomUser | null} onClose={() => setShowPremium(false)} />
      )}
    </div>
  );
}
